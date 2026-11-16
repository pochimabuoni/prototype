"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCommunityAccess, AuthorizationError } from "@/lib/auth/viewer";
import { groupInvitationSchema, invitationSchema } from "@/lib/validation/community";
import { uuidSchema } from "@/lib/validation/common";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";
import { displayName } from "@/lib/data/members";
import { formatInvitationWhen } from "@/lib/domain/format";
import { siteUrl } from "@/lib/env";
import { type ActionResult, fail, zodFieldErrors, GENERIC_ERROR } from "@/lib/action-result";

async function guard() {
  try {
    return { viewer: await assertCommunityAccess() };
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: fail(e.message) };
    throw e;
  }
}

export async function createInvitation(input: unknown): Promise<ActionResult<{ id: string }>> {
  const g = await guard();
  if ("error" in g) return g.error!;
  const parsed = invitationSchema.safeParse(input);
  if (!parsed.success) return fail("Please review the invitation.", zodFieldErrors(parsed.error.issues));
  const d = parsed.data;
  if (d.recipientId === g.viewer.id) return fail("You can't invite yourself.");
  if (!(await rateLimit("invitation", g.viewer.id))) return fail("You've sent many invitations today. Please try again tomorrow.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      sender_id: g.viewer.id,
      recipient_id: d.recipientId,
      sport_id: d.sportId,
      proposed_date: d.proposedDate,
      proposed_time: d.proposedTime,
      location_note: d.locationNote,
      message: d.message ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    if (error?.code === "42501") return fail("This member isn't available for invitations.");
    console.error("[invitations] insert", error?.message);
    return fail(GENERIC_ERROR);
  }

  const admin = createAdminClient();
  const [{ data: recipient }, { data: rp }, { data: me }, { data: sport }] = await Promise.all([
    admin.from("users").select("email").eq("id", d.recipientId).single(),
    admin.from("member_profiles").select("first_name").eq("user_id", d.recipientId).single(),
    admin.from("member_profiles").select("first_name, last_name, show_last_name").eq("user_id", g.viewer.id).single(),
    admin.from("sports").select("name").eq("id", d.sportId).single(),
  ]);
  if (recipient && rp && me && sport) {
    await sendEmail(
      recipient.email,
      emailTemplates.invitationReceived({
        recipientFirstName: rp.first_name,
        senderDisplayName: displayName(me),
        sport: sport.name,
        when: formatInvitationWhen(d.proposedDate, d.proposedTime),
        where: d.locationNote,
        reviewUrl: siteUrl("/invitations"),
      }),
    );
  }
  revalidatePath("/invitations");
  return { ok: true, data: { id: data.id }, message: "Invitation sent." };
}

/**
 * Invite several members at once (doubles, a foursome, a pickup game).
 * Creates one invitation per member, linked by a shared group id. The insert
 * runs as the sender, so RLS checks every recipient; if any one isn't
 * available, nothing is sent.
 */
export async function createGroupInvitation(input: unknown): Promise<ActionResult<{ groupId: string }>> {
  const g = await guard();
  if ("error" in g) return g.error!;
  const parsed = groupInvitationSchema.safeParse(input);
  if (!parsed.success) return fail("Please review the invitation.", zodFieldErrors(parsed.error.issues));
  const d = parsed.data;
  if (d.recipientIds.includes(g.viewer.id)) return fail("You can't invite yourself.");
  if (!(await rateLimit("invitation", g.viewer.id))) return fail("You've sent many invitations today. Please try again tomorrow.");

  const groupId = randomUUID();
  const supabase = await createClient();
  const { error } = await supabase.from("invitations").insert(
    d.recipientIds.map((recipientId) => ({
      sender_id: g.viewer.id,
      recipient_id: recipientId,
      sport_id: d.sportId,
      proposed_date: d.proposedDate,
      proposed_time: d.proposedTime,
      location_note: d.locationNote,
      message: d.message ?? null,
      group_id: groupId,
    })),
  );
  if (error) {
    if (error.code === "42501") return fail("One of these members isn't available for invitations. Please choose another group.");
    console.error("[invitations] group insert", error.message);
    return fail(GENERIC_ERROR);
  }

  const admin = createAdminClient();
  const [{ data: users }, { data: profiles }, { data: me }, { data: sport }] = await Promise.all([
    admin.from("users").select("id, email").in("id", d.recipientIds),
    admin.from("member_profiles").select("user_id, first_name").in("user_id", d.recipientIds),
    admin.from("member_profiles").select("first_name, last_name, show_last_name").eq("user_id", g.viewer.id).single(),
    admin.from("sports").select("name").eq("id", d.sportId).single(),
  ]);
  if (me && sport) {
    for (const u of users ?? []) {
      const p = profiles?.find((x) => x.user_id === u.id);
      if (!p) continue;
      await sendEmail(
        u.email,
        emailTemplates.invitationReceived({
          recipientFirstName: p.first_name,
          senderDisplayName: displayName(me),
          sport: sport.name,
          when: formatInvitationWhen(d.proposedDate, d.proposedTime),
          where: d.locationNote,
          reviewUrl: siteUrl("/invitations"),
          othersInvited: d.recipientIds.length - 1,
        }),
      );
    }
  }
  revalidatePath("/invitations");
  return { ok: true, data: { groupId }, message: `Invitations sent to ${d.recipientIds.length} members.` };
}

type Transition = "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED";

/** Status changes; the database trigger enforces who may make which transition. */
export async function updateInvitationStatus(invitationId: string, status: Transition): Promise<ActionResult> {
  const g = await guard();
  if ("error" in g) return g.error!;
  if (!uuidSchema.safeParse(invitationId).success) return fail("Invalid request.");
  if (!["ACCEPTED", "DECLINED", "CANCELLED", "COMPLETED"].includes(status)) return fail("Invalid request.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .update({ status })
    .eq("id", invitationId)
    .select("id, sender_id, recipient_id")
    .maybeSingle();
  if (error || !data) {
    if (error?.code === "42501") return fail("That change isn't possible for this invitation.");
    return fail("This invitation could not be updated.");
  }

  // Accepting an invitation to play also connects the two members so they can
  // coordinate details privately (unless either has blocked the other).
  if (status === "ACCEPTED") {
    const admin = createAdminClient();
    const { data: blocked } = await admin.rpc("is_blocked_between", { a: data.sender_id, b: data.recipient_id });
    const { data: connected } = await admin.rpc("are_connected", { a: data.sender_id, b: data.recipient_id });
    if (!blocked && !connected) {
      await admin
        .from("connections")
        .update({ status: "ACCEPTED", responded_at: new Date().toISOString() })
        .eq("status", "PENDING")
        .or(`and(requester_id.eq.${data.sender_id},addressee_id.eq.${data.recipient_id}),and(requester_id.eq.${data.recipient_id},addressee_id.eq.${data.sender_id})`);
      const { data: nowConnected } = await admin.rpc("are_connected", { a: data.sender_id, b: data.recipient_id });
      if (!nowConnected) {
        await admin.from("connections").insert({
          requester_id: data.sender_id,
          addressee_id: data.recipient_id,
          status: "ACCEPTED",
          responded_at: new Date().toISOString(),
        });
      }
    }
  }

  revalidatePath("/invitations");
  revalidatePath("/home");
  revalidatePath("/connections");
  const messages: Record<Transition, string> = {
    ACCEPTED: "Invitation accepted — you're now connected to coordinate details.",
    DECLINED: "Invitation declined.",
    CANCELLED: "Invitation cancelled.",
    COMPLETED: "Marked as played.",
  };
  return { ok: true, message: messages[status] };
}
