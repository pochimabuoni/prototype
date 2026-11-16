import type { Metadata } from "next";
import Link from "next/link";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { loadMembers } from "@/lib/data/members";
import { formatRelative } from "@/lib/domain/format";
import { AppMain, AppPageHeader } from "@/components/app/app-header";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default async function MessagesPage() {
  const viewer = await requireCommunityAccess("/messages");
  const supabase = await createClient();
  const [{ data: conversations }, { data: unread }] = await Promise.all([
    supabase.from("conversations").select("id, last_message_at, created_at").order("last_message_at", { ascending: false, nullsFirst: false }).limit(100),
    supabase.rpc("my_unread_counts"),
  ]);
  const ids = (conversations ?? []).map((c) => c.id);
  const [{ data: participants }, { data: latest }] = ids.length
    ? await Promise.all([
        supabase.from("conversation_participants").select("conversation_id, user_id").in("conversation_id", ids).neq("user_id", viewer.id),
        supabase.from("messages").select("conversation_id, body, sender_id, created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(300),
      ])
    : [{ data: [] }, { data: [] }];
  const otherByConv = new Map((participants ?? []).map((p) => [p.conversation_id, p.user_id]));
  const { summaries } = await loadMembers(supabase, { userIds: [...new Set(otherByConv.values())] });
  const unreadByConv = new Map((unread ?? []).map((u) => [u.conversation_id, Number(u.unread)]));
  const lastByConv = new Map<string, { body: string; sender_id: string; created_at: string }>();
  for (const m of latest ?? []) if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);

  return (
    <AppMain className="max-w-4xl">
      <AppPageHeader eyebrow="Messages" title="Conversations." description="Private messages between connected members." />
      {ids.length === 0 ? (
        <EmptyState title="No conversations yet" description="Once you're connected with a member, you can message them from their profile." action={<Button asChild><Link href="/connections">View connections</Link></Button>} />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {(conversations ?? []).map((c) => {
            const other = summaries.get(otherByConv.get(c.id) ?? "");
            const last = lastByConv.get(c.id);
            const count = unreadByConv.get(c.id) ?? 0;
            const name = other?.displayName ?? "Former member";
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center gap-4 py-5 transition-colors hover:bg-ivory sm:px-3">
                  <Avatar src={other?.photoUrl} name={name} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={cn("truncate font-serif text-xl", count > 0 && "font-semibold")}>{name}</p>
                      {last ? <time className="shrink-0 text-xs text-stone" dateTime={last.created_at}>{formatRelative(last.created_at)}</time> : null}
                    </div>
                    <p className={cn("truncate text-sm", count > 0 ? "text-ink" : "text-muted-foreground")}>
                      {last ? `${last.sender_id === viewer.id ? "You: " : ""}${last.body}` : "No messages yet"}
                    </p>
                  </div>
                  {count > 0 ? (
                    <span className="flex min-w-6 items-center justify-center bg-gold px-1.5 py-0.5 text-xs text-paper" aria-label={`${count} unread`}>{count}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppMain>
  );
}
