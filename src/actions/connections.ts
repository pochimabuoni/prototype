"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCommunityAccess, AuthorizationError } from "@/lib/auth/viewer";
import { connectionRequestSchema } from "@/lib/validation/community";
import { uuidSchema } from "@/lib/validation/common";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";
import { displayName } from "@/lib/data/members";
import { siteUrl } from "@/lib/env";
import { type ActionResult, fail, GENERIC_ERROR } from "@/lib/action-result";

async function guard() {
  try {
    return { viewer: await assertCommunityAccess() };
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: fail(e.message) };
    throw e;
  }
}

export async function requestConnection(input: { memberId: string; note?: string }): Promise<ActionResult> {
  const g = await guard();
  if ("error" in g) return g.error!;
  const parsed = connectionRequestSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid request.");
  if (parsed.data.memberId === g.viewer.id) return fail("You can't connect with yourself.");
  if (!(await rateLimit("connectionRequest", g.viewer.id))) return fail("You've sent many requests today. Please try again tomorrow.");

  const supabase = await createClient();
  const { error } = await supabase.from("connections").insert({
    requester_id: g.viewer.id,
    addressee_id: parsed.data.memberId,
    note: parsed.data.note ?? null,
  });
  if (error) {
    if (error.code === "23505") return fail("A request is already pending or you're already connected.");
    if (error.code === "42501") return fail("This member isn't available to connect.");
    console.error("[connections] insert", error.message);
    return fail(GENERIC_ERROR);
  }

  // Notify the recipient (service role is needed to read their email).
  const admin = createAdminClient();
  const [{ data: recipient }, { data: recipientProfile }, { data: me }] = await Promise.all([
    admin.from("users").select("email").eq("id", parsed.data.memberId).single(),
    admin.from("member_profiles").select("first_name").eq("user_id", parsed.data.memberId).single(),
    admin.from("member_profiles").select("first_name, last_name, show_last_name").eq("user_id", g.viewer.id).single(),
  ]);
  if (recipient && recipientProfile && me) {
    await sendEmail(
      recipient.email,
      emailTemplates.connectionRequest({
        recipientFirstName: recipientProfile.first_name,
        senderDisplayName: displayName(me),
        reviewUrl: siteUrl("/connections"),
      }),
    );
  }
  revalidatePath("/connections");
  revalidatePath(`/members/${parsed.data.memberId}`);
  revalidatePath("/discover");
  return { ok: true, message: "Request sent." };
}

export async function respondToConnection(connectionId: string, accept: boolean): Promise<ActionResult> {
  const g = await guard();
  if ("error" in g) return g.error!;
  if (!uuidSchema.safeParse(connectionId).success) return fail("Invalid request.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connections")
    .update({ status: accept ? "ACCEPTED" : "DECLINED" })
    .eq("id", connectionId)
    .eq("addressee_id", g.viewer.id)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();
  if (error || !data) return fail("This request is no longer available.");
  revalidatePath("/connections");
  revalidatePath("/home");
  return { ok: true, message: accept ? "Connected." : "Request declined." };
}

/** Withdraw a pending request, or remove an existing connection. */
export async function cancelConnection(connectionId: string): Promise<ActionResult> {
  const g = await guard();
  if ("error" in g) return g.error!;
  if (!uuidSchema.safeParse(connectionId).success) return fail("Invalid request.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connections")
    .update({ status: "CANCELLED" })
    .eq("id", connectionId)
    .select("id")
    .maybeSingle();
  if (error || !data) return fail("This connection could not be updated.");
  revalidatePath("/connections");
  return { ok: true, message: "Connection removed." };
}
