"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertCommunityAccess, AuthorizationError } from "@/lib/auth/viewer";
import { messageSchema } from "@/lib/validation/community";
import { uuidSchema } from "@/lib/validation/common";
import { rateLimit } from "@/lib/rate-limit";
import { type ActionResult, fail, GENERIC_ERROR } from "@/lib/action-result";

/** Opens (or creates) the private conversation with a connected member. */
export async function openConversation(memberId: string) {
  const viewer = await assertCommunityAccess().catch(() => null);
  if (!viewer || !uuidSchema.safeParse(memberId).success) redirect("/messages");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_or_create_conversation", { other: memberId });
  if (error || !data) redirect(`/members/${memberId}?notice=messaging-unavailable`);
  redirect(`/messages/${data}`);
}

export async function sendMessage(input: { conversationId: string; body: string }): Promise<ActionResult<{ id: string; created_at: string }>> {
  let viewer;
  try {
    viewer = await assertCommunityAccess();
  } catch (e) {
    if (e instanceof AuthorizationError) return fail(e.message);
    throw e;
  }
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid message.");
  if (!(await rateLimit("message", viewer.id))) return fail("You're sending messages very quickly. Please wait a moment.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: parsed.data.conversationId, sender_id: viewer.id, body: parsed.data.body })
    .select("id, created_at")
    .single();
  if (error || !data) {
    // RLS rejects: not a participant, not connected, or blocked.
    if (error?.code === "42501") return fail("This conversation is no longer available.");
    console.error("[messages] insert", error?.message);
    return fail(GENERIC_ERROR);
  }
  revalidatePath("/messages");
  return { ok: true, data };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  if (!uuidSchema.safeParse(conversationId).success) return;
  const viewer = await assertCommunityAccess().catch(() => null);
  if (!viewer) return;
  const supabase = await createClient();
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", viewer.id);
}
