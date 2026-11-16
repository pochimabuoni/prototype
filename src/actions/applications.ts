"use server";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { applicationSchema } from "@/lib/validation/application";
import { validateImageFile } from "@/lib/validation/common";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { getViewer } from "@/lib/auth/viewer";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";
import { serverEnv } from "@/lib/env.server";
import { siteUrl } from "@/lib/env";
import { type ActionResult, fail, zodFieldErrors, GENERIC_ERROR } from "@/lib/action-result";

/**
 * Public membership application intake.
 * Applicants have no account yet, so the insert is performed with the service
 * role AFTER strict validation; clients have no direct insert privilege.
 */
export async function submitApplication(formData: FormData): Promise<ActionResult> {
  const ip = await clientIp();
  if (!(await rateLimit("application", `ip:${ip}`))) {
    return fail("We've received several applications from this connection. Please try again later.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return fail("Your application could not be read. Please try again.");
  }
  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please review the highlighted fields.", zodFieldErrors(parsed.error.issues));
  }
  const data = parsed.data;
  const admin = createAdminClient();

  // Validate sports & levels against the live catalogue.
  const { data: sports, error: sportsError } = await admin
    .from("sports")
    .select("slug, name, skill_levels")
    .eq("is_active", true);
  if (sportsError) return fail(GENERIC_ERROR);
  for (const [i, s] of data.sports.entries()) {
    const sport = sports.find((x) => x.slug === s.sport);
    if (!sport) return fail("Please review your sports.", { [`sports.${i}.sport`]: "This sport is not available." });
    if (!sport.skill_levels.includes(s.level)) {
      return fail("Please review your sports.", { [`sports.${i}.level`]: "Choose a level for this sport." });
    }
  }

  // Photo (optional).
  const photo = formData.get("photo");
  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const check = await validateImageFile(photo);
    if (!check.ok) return fail(check.error, { photo: check.error });
    photoPath = `${randomUUID()}.${check.ext}`;
    const { error } = await admin.storage
      .from("application-photos")
      .upload(photoPath, photo, { contentType: photo.type, upsert: false });
    if (error) {
      console.error("[apply] photo upload failed", error.message);
      return fail("We couldn't upload your photo. Please try a different image or remove it.", { photo: "Upload failed." });
    }
  }

  // Referral code (optional) — consumed atomically.
  let referralCodeId: string | null = null;
  if (data.referralCode) {
    const { data: rid, error } = await admin.rpc("consume_referral_code", { p_code: data.referralCode });
    if (error) return fail(GENERIC_ERROR);
    if (!rid) {
      await cleanupPhoto(photoPath);
      return fail("That referral code isn't valid.", { referralCode: "This code is invalid, expired or fully used." });
    }
    referralCodeId = rid;
  }

  // Link to the signed-in account only when the verified email matches.
  const viewer = await getViewer();
  const userId = viewer && viewer.email.toLowerCase() === data.email ? viewer.id : null;

  const { error: insertError } = await admin.from("membership_applications").insert({
    user_id: userId,
    email: data.email,
    full_name: data.fullName,
    date_of_birth: data.dateOfBirth,
    neighborhood: data.neighborhood,
    occupation: data.occupation ?? null,
    sports: data.sports,
    availability: data.availability,
    introduction: data.introduction,
    motivation: data.motivation,
    referral_code_id: referralCodeId,
    photo_path: photoPath,
  });

  if (insertError) {
    await cleanupPhoto(photoPath);
    if (referralCodeId) await releaseReferral(referralCodeId);
    if (insertError.code === "23505") {
      return fail("An application with this email is already under review. You can check its status by signing in.", {
        email: "An open application already exists for this email.",
      });
    }
    if (insertError.code === "23514") {
      return fail("Please review your details.", { dateOfBirth: "Members must be at least 18 years old." });
    }
    console.error("[apply] insert failed", insertError.code, insertError.message);
    return fail(GENERIC_ERROR);
  }

  const firstName = data.fullName.split(/\s+/)[0] ?? data.fullName;
  await sendEmail(data.email, emailTemplates.applicationReceived({ firstName, statusUrl: siteUrl("/application-status") }));
  const adminEmail = serverEnv.adminNotificationEmail();
  if (adminEmail) {
    await sendEmail(adminEmail, emailTemplates.adminNewApplication({ applicantName: data.fullName, reviewUrl: siteUrl("/admin/applications") }));
  }

  return { ok: true };

  async function cleanupPhoto(path: string | null) {
    if (path) await admin.storage.from("application-photos").remove([path]);
  }
  async function releaseReferral(id: string) {
    const { data: code } = await admin.from("referral_codes").select("use_count").eq("id", id).single();
    if (code && code.use_count > 0) await admin.from("referral_codes").update({ use_count: code.use_count - 1 }).eq("id", id);
  }
}
