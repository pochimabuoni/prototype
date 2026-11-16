import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * After a verified email sign-in, attach any application submitted with that
 * email and promote approved applicants to MEMBER. Covers accounts created
 * before the application was submitted (the sign-up trigger covers the rest).
 */
export async function linkApplicationsToUser(userId: string, email: string | undefined) {
  if (!email) return;
  try {
    const admin = createAdminClient();
    await admin
      .from("membership_applications")
      .update({ user_id: userId })
      .eq("email", email.toLowerCase())
      .is("user_id", null);

    const { data: approved } = await admin
      .from("membership_applications")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "APPROVED")
      .limit(1);
    if (approved && approved.length > 0) {
      await admin.from("users").update({ role: "MEMBER" }).eq("id", userId).eq("role", "APPLICANT");
    }
    await admin.from("users").update({ last_active_at: new Date().toISOString() }).eq("id", userId);
  } catch (e) {
    console.error("[auth] linkApplicationsToUser failed", e);
  }
}
