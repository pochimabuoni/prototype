import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { ProfileInput } from "@/lib/validation/profile";
import { slotKey } from "@/lib/domain/availability";

/** Load the viewer's editable profile as form values (falls back to application data). */
export async function loadProfileFormValues(supabase: ServerSupabase, userId: string): Promise<ProfileInput> {
  const [{ data: profile }, { data: sports }, { data: availability }, { data: catalogue }, { data: apps }] = await Promise.all([
    supabase.from("member_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("member_sports").select("sport_id, skill_level, formats").eq("user_id", userId),
    supabase.from("member_availability").select("day_of_week, time_block").eq("user_id", userId),
    supabase.from("sports").select("id, slug"),
    supabase
      .from("membership_applications")
      .select("full_name, neighborhood, occupation, sports, availability, introduction")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  const slugById = new Map((catalogue ?? []).map((s) => [s.id, s.slug]));
  const app = apps?.[0];

  if (profile) {
    return {
      firstName: profile.first_name,
      lastName: profile.last_name ?? "",
      showLastName: profile.show_last_name,
      bio: profile.bio ?? "",
      neighborhood: profile.neighborhood as ProfileInput["neighborhood"],
      occupation: profile.occupation ?? "",
      showOccupation: profile.show_occupation,
      visibility: profile.visibility,
      showAge: profile.show_age,
      partnerAgeMin: profile.partner_age_min,
      partnerAgeMax: profile.partner_age_max,
      playStyles: profile.play_styles as ProfileInput["playStyles"],
      sports: (sports ?? []).map((s) => ({ sport: slugById.get(s.sport_id) ?? "", level: s.skill_level, formats: s.formats })),
      availability: (availability ?? []).map((a) => slotKey(a.day_of_week, a.time_block)),
    };
  }

  // Pre-fill from the approved application.
  const [first, ...rest] = (app?.full_name ?? "").split(/\s+/);
  const appSports = Array.isArray(app?.sports) ? (app.sports as { sport: string; level: string }[]) : [];
  const appAvailability = Array.isArray(app?.availability) ? (app.availability as string[]) : [];
  return {
    firstName: first ?? "",
    lastName: rest.join(" "),
    showLastName: false,
    bio: app?.introduction?.slice(0, 600) ?? "",
    neighborhood: (app?.neighborhood ?? "") as ProfileInput["neighborhood"],
    occupation: app?.occupation ?? "",
    showOccupation: true,
    visibility: "MEMBERS",
    showAge: true,
    partnerAgeMin: null,
    partnerAgeMax: null,
    playStyles: ["one_on_one", "small_group"],
    sports: appSports.map((s) => ({ sport: s.sport, level: s.level, formats: [] })),
    availability: appAvailability,
  };
}
