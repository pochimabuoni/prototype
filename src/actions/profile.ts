"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import { profileSchema } from "@/lib/validation/profile";
import { validateImageFile } from "@/lib/validation/common";
import { parseSlotKey } from "@/lib/domain/availability";
import { rateLimit } from "@/lib/rate-limit";
import { type ActionResult, fail, zodFieldErrors, GENERIC_ERROR } from "@/lib/action-result";

/**
 * Create or update the member profile, sports and availability.
 * Runs as the member (RLS-enforced): only entitled members can write, and only
 * their own rows.
 */
export async function saveProfile(formData: FormData): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer || !(viewer.canUseCommunity || viewer.stage === "PROFILE_INCOMPLETE")) {
    return fail("An active membership is required to edit your profile.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return fail("Your profile could not be read. Please try again.");
  }
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return fail("Please review the highlighted fields.", zodFieldErrors(parsed.error.issues));
  const data = parsed.data;

  const supabase = await createClient();

  // Validate sports/levels/formats against the catalogue (DB triggers re-check).
  const { data: catalogue } = await supabase.from("sports").select("id, slug, skill_levels, formats").eq("is_active", true);
  const rows = [];
  for (const [i, s] of data.sports.entries()) {
    const sport = catalogue?.find((c) => c.slug === s.sport);
    if (!sport) return fail("Please review your sports.", { [`sports.${i}.sport`]: "Unavailable sport." });
    if (!sport.skill_levels.includes(s.level)) return fail("Please review your sports.", { [`sports.${i}.level`]: "Choose a level." });
    const formats = s.formats.filter((f) => sport.formats.includes(f));
    rows.push({ user_id: viewer.id, sport_id: sport.id, skill_level: s.level, formats });
  }

  // Optional photo, validated by content.
  const photo = formData.get("photo");
  let newPhotoPath: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    if (!(await rateLimit("upload", viewer.id))) return fail("Too many uploads. Please try again later.");
    const check = await validateImageFile(photo);
    if (!check.ok) return fail(check.error, { photo: check.error });
    newPhotoPath = `${viewer.id}/${randomUUID()}.${check.ext}`;
    const { error } = await supabase.storage.from("avatars").upload(newPhotoPath, photo, { contentType: photo.type });
    if (error) {
      console.error("[profile] avatar upload", error.message);
      return fail("We couldn't upload your photo. Please try another image.", { photo: "Upload failed." });
    }
  }

  const previousPhoto = viewer.profile?.photo_path ?? null;
  const { error: profileError } = await supabase.from("member_profiles").upsert(
    {
      user_id: viewer.id,
      first_name: data.firstName,
      last_name: data.lastName ?? null,
      show_last_name: data.showLastName,
      bio: data.bio ?? null,
      neighborhood: data.neighborhood,
      occupation: data.occupation ?? null,
      show_occupation: data.showOccupation,
      visibility: data.visibility,
      ...(newPhotoPath ? { photo_path: newPhotoPath } : {}),
      completed_at: viewer.profile?.completed_at ?? new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (profileError) {
    console.error("[profile] upsert", profileError.code, profileError.message);
    return fail(GENERIC_ERROR);
  }

  // Replace sports & availability.
  const del1 = await supabase.from("member_sports").delete().eq("user_id", viewer.id);
  const ins1 = del1.error ? del1 : await supabase.from("member_sports").insert(rows);
  const slots = data.availability.map(parseSlotKey).filter((s): s is NonNullable<typeof s> => !!s);
  const del2 = await supabase.from("member_availability").delete().eq("user_id", viewer.id);
  const ins2 = del2.error
    ? del2
    : await supabase
        .from("member_availability")
        .insert(slots.map((s) => ({ user_id: viewer.id, day_of_week: s.day, time_block: s.block })));
  const firstError = ins1.error ?? ins2.error;
  if (firstError) {
    console.error("[profile] preferences", firstError.message);
    return fail(GENERIC_ERROR);
  }

  if (newPhotoPath && previousPhoto) await supabase.storage.from("avatars").remove([previousPhoto]);

  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function removeProfilePhoto(): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer?.profile?.photo_path) return { ok: true };
  const supabase = await createClient();
  await supabase.storage.from("avatars").remove([viewer.profile.photo_path]);
  const { error } = await supabase.from("member_profiles").update({ photo_path: null }).eq("user_id", viewer.id);
  if (error) return fail(GENERIC_ERROR);
  revalidatePath("/", "layout");
  return { ok: true };
}
