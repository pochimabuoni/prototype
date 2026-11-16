"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCommunityAccess, getViewer, AuthorizationError } from "@/lib/auth/viewer";
import { reportSchema } from "@/lib/validation/community";
import { uuidSchema } from "@/lib/validation/common";
import { rateLimit } from "@/lib/rate-limit";
import { type ActionResult, fail, GENERIC_ERROR } from "@/lib/action-result";

/**
 * Blocking is immediate and mutual in effect: profiles disappear both ways,
 * pending invitations are cancelled, and messaging stops (enforced by RLS).
 */
export async function blockMember(memberId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return fail("Please sign in.");
  if (!uuidSchema.safeParse(memberId).success || memberId === viewer.id) return fail("Invalid request.");

  const supabase = await createClient();
  const { error } = await supabase.from("blocks").insert({ blocker_id: viewer.id, blocked_id: memberId });
  if (error && error.code !== "23505") {
    console.error("[safety] block", error.message);
    return fail(GENERIC_ERROR);
  }

  // Tidy up open items between the two members (service role: the other
  // side's rows are no longer visible to the blocker after the block).
  const admin = createAdminClient();
  const pair = `and(sender_id.eq.${viewer.id},recipient_id.eq.${memberId}),and(sender_id.eq.${memberId},recipient_id.eq.${viewer.id})`;
  await admin.from("invitations").update({ status: "CANCELLED" }).in("status", ["PENDING", "ACCEPTED"]).or(pair);
  const cpair = `and(requester_id.eq.${viewer.id},addressee_id.eq.${memberId}),and(requester_id.eq.${memberId},addressee_id.eq.${viewer.id})`;
  await admin.from("connections").update({ status: "CANCELLED" }).in("status", ["PENDING", "ACCEPTED"]).or(cpair);

  revalidatePath("/", "layout");
  return { ok: true, message: "Member blocked. They can no longer see you or contact you." };
}

export async function unblockMember(memberId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer || !uuidSchema.safeParse(memberId).success) return fail("Invalid request.");
  const supabase = await createClient();
  const { error } = await supabase.from("blocks").delete().eq("blocker_id", viewer.id).eq("blocked_id", memberId);
  if (error) return fail(GENERIC_ERROR);
  revalidatePath("/settings");
  return { ok: true, message: "Member unblocked." };
}

export async function reportMember(input: unknown): Promise<ActionResult> {
  let viewer;
  try {
    viewer = await assertCommunityAccess();
  } catch (e) {
    if (e instanceof AuthorizationError) return fail(e.message);
    throw e;
  }
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return fail("Please choose a reason.");
  const d = parsed.data;
  if (d.reportedUserId === viewer.id) return fail("Invalid request.");
  if (!(await rateLimit("report", viewer.id))) return fail("You've submitted several reports today. Please contact us directly.");

  const supabase = await createClient();
  // A reported message must belong to a conversation the reporter can read.
  if (d.messageId) {
    const { data: msg } = await supabase.from("messages").select("id, sender_id").eq("id", d.messageId).maybeSingle();
    if (!msg || msg.sender_id !== d.reportedUserId) return fail("Invalid request.");
  }
  const { error } = await supabase.from("reports").insert({
    reporter_id: viewer.id,
    reported_user_id: d.reportedUserId,
    message_id: d.messageId ?? null,
    invitation_id: d.invitationId ?? null,
    reason: d.reason,
    details: d.details ?? null,
  });
  if (error) {
    console.error("[safety] report", error.message);
    return fail(GENERIC_ERROR);
  }
  if (d.alsoBlock) await blockMember(d.reportedUserId);
  return { ok: true, message: "Thank you. Our team will review this report confidentially." };
}
