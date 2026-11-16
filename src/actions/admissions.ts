"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin, AuthorizationError } from "@/lib/auth/viewer";
import { applicationDecisionSchema } from "@/lib/validation/application";
import { logAdminAction } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";
import { siteUrl } from "@/lib/env";
import { type ActionResult, fail, GENERIC_ERROR } from "@/lib/action-result";

/**
 * Approve / reject / waitlist an application. Admin-only, verified server-side,
 * performed with the service role and recorded in the audit log.
 */
export async function decideApplication(input: unknown): Promise<ActionResult> {
  let admin;
  let actor;
  try {
    actor = await assertAdmin();
    admin = createAdminClient();
  } catch (e) {
    if (e instanceof AuthorizationError) return fail(e.message);
    throw e;
  }

  const parsed = applicationDecisionSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid decision.");
  const { applicationId, decision, note, notify } = parsed.data;

  const { data: app, error: loadError } = await admin
    .from("membership_applications")
    .select("id, email, full_name, status, user_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (loadError || !app) return fail("Application not found.");
  if (app.status === decision) return { ok: true, message: "No change." };

  const { error: updateError } = await admin
    .from("membership_applications")
    .update({ status: decision, reviewed_by: actor.id, reviewed_at: new Date().toISOString(), review_note: note ?? null })
    .eq("id", applicationId);
  if (updateError) {
    if (updateError.code === "23505") return fail("This applicant already has another open application.");
    console.error("[admissions] update failed", updateError.message);
    return fail(GENERIC_ERROR);
  }

  // Reconcile the account role, if the applicant already has an account.
  const { data: account } = app.user_id
    ? await admin.from("users").select("id, role").eq("id", app.user_id).maybeSingle()
    : await admin.from("users").select("id, role").eq("email", app.email.toLowerCase()).maybeSingle();
  if (account) {
    if (!app.user_id) await admin.from("membership_applications").update({ user_id: account.id }).eq("id", app.id);
    if (decision === "APPROVED" && account.role === "APPLICANT") {
      await admin.from("users").update({ role: "MEMBER" }).eq("id", account.id);
    } else if (decision !== "APPROVED" && app.status === "APPROVED" && account.role === "MEMBER") {
      await admin.from("users").update({ role: "APPLICANT" }).eq("id", account.id);
    }
  }

  await logAdminAction(admin, {
    actorId: actor.id,
    action: `application.${decision.toLowerCase()}`,
    targetType: "membership_application",
    targetId: app.id,
    metadata: { previousStatus: app.status, notified: notify, note: note ?? null },
  });

  if (notify) {
    const firstName = app.full_name.split(/\s+/)[0] ?? app.full_name;
    const content =
      decision === "APPROVED"
        ? emailTemplates.membershipApproved({ firstName, activateUrl: siteUrl("/sign-in?next=/onboarding") })
        : decision === "WAITLISTED"
          ? emailTemplates.applicationWaitlisted({ firstName })
          : emailTemplates.applicationRejected({ firstName });
    await sendEmail(app.email, content);
  }

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${app.id}`);
  revalidatePath("/admin");
  return { ok: true, message: `Application ${decision.toLowerCase()}.` };
}
