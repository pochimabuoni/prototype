import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { loadMembers } from "@/lib/data/members";
import { uuidSchema } from "@/lib/validation/common";
import { AppMain } from "@/components/app/app-header";
import { Avatar } from "@/components/ui/avatar";
import { ChatThread } from "@/components/messages/chat-thread";
import { SafetyActions } from "@/components/members/safety-actions";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const viewer = await requireCommunityAccess(`/messages/${id}`);
  const supabase = await createClient();

  // RLS: only participants can see the conversation and its messages.
  const { data: participants } = await supabase.from("conversation_participants").select("user_id").eq("conversation_id", id);
  if (!participants || !participants.some((p) => p.user_id === viewer.id)) notFound();
  const otherId = participants.find((p) => p.user_id !== viewer.id)?.user_id;

  const [{ data: messages }, { data: canSend }, members] = await Promise.all([
    supabase.from("messages").select("id, sender_id, body, created_at").eq("conversation_id", id).order("created_at", { ascending: false }).limit(200),
    supabase.rpc("can_message", { cid: id }),
    otherId ? loadMembers(supabase, { userIds: [otherId] }) : Promise.resolve({ summaries: new Map() }),
  ]);
  const other = otherId ? members.summaries.get(otherId) : undefined;
  const otherName = other?.firstName ?? "Member";

  return (
    <AppMain className="max-w-4xl">
      <Link href="/messages" className="text-xs uppercase tracking-[0.16em] text-stone hover:text-ink">← Messages</Link>
      <div className="mb-6 mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={other?.photoUrl} name={other?.displayName ?? otherName} size={48} />
          <div>
            <h1 className="font-serif text-3xl">{other ? <Link href={`/members/${other.userId}`} className="hover:underline underline-offset-4">{other.displayName}</Link> : otherName}</h1>
            {other ? <p className="text-xs uppercase tracking-[0.14em] text-stone">{other.neighborhoodName}</p> : null}
          </div>
        </div>
        {otherId ? <SafetyActions memberId={otherId} memberName={otherName} /> : null}
      </div>
      <ChatThread conversationId={id} viewerId={viewer.id} otherName={otherName} initialMessages={(messages ?? []).reverse()} canSend={!!canSend} />
    </AppMain>
  );
}
