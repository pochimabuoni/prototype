import type { Metadata } from "next";
import Link from "next/link";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { loadMembers, type MemberSummary } from "@/lib/data/members";
import { AppMain, AppPageHeader } from "@/components/app/app-header";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ConnectionActions } from "@/components/members/connection-actions";
import { openConversation } from "@/actions/messages";
import { formatRelative } from "@/lib/domain/format";

export const metadata: Metadata = { title: "Connections", robots: { index: false } };

export default async function ConnectionsPage() {
  const viewer = await requireCommunityAccess("/connections");
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("connections")
    .select("id, requester_id, addressee_id, status, note, created_at")
    .in("status", ["PENDING", "ACCEPTED"])
    .or(`requester_id.eq.${viewer.id},addressee_id.eq.${viewer.id}`)
    .order("created_at", { ascending: false });
  const all = rows ?? [];
  const otherId = (c: (typeof all)[number]) => (c.requester_id === viewer.id ? c.addressee_id : c.requester_id);
  const { summaries } = await loadMembers(supabase, { userIds: [...new Set(all.map(otherId))] });

  const incoming = all.filter((c) => c.status === "PENDING" && c.addressee_id === viewer.id);
  const outgoing = all.filter((c) => c.status === "PENDING" && c.requester_id === viewer.id);
  const connected = all.filter((c) => c.status === "ACCEPTED");

  return (
    <AppMain>
      <AppPageHeader eyebrow="Connections" title="Your circle." description="Connected members can message each other privately." />
      <div className="flex flex-col gap-14">
        <Group title="Requests for you" count={incoming.length} empty="No pending requests.">
          {incoming.map((c) => (
            <Row key={c.id} member={summaries.get(otherId(c))} note={c.note} meta={`Requested ${formatRelative(c.created_at)} ago`}>
              <ConnectionActions id={c.id} kind="incoming" />
            </Row>
          ))}
        </Group>
        <Group title="Connected" count={connected.length} empty="">
          {connected.length === 0 ? (
            <EmptyState title="No connections yet" description="Find members who play your sports and send a short request." action={<Button asChild><Link href="/discover">Discover members</Link></Button>} />
          ) : (
            connected.map((c) => (
              <Row key={c.id} member={summaries.get(otherId(c))}>
                <div className="flex flex-wrap gap-2">
                  <form action={openConversation.bind(null, otherId(c))}>
                    <Button size="sm" variant="outline" type="submit">Message</Button>
                  </form>
                  <Button size="sm" variant="outline" asChild><Link href={`/invitations/new?to=${otherId(c)}`}>Invite</Link></Button>
                  <ConnectionActions id={c.id} kind="connected" />
                </div>
              </Row>
            ))
          )}
        </Group>
        <Group title="Sent requests" count={outgoing.length} empty="No requests awaiting a reply.">
          {outgoing.map((c) => (
            <Row key={c.id} member={summaries.get(otherId(c))} meta={`Sent ${formatRelative(c.created_at)} ago`}>
              <ConnectionActions id={c.id} kind="outgoing" />
            </Row>
          ))}
        </Group>
      </div>
    </AppMain>
  );
}

function Group({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-baseline gap-3 font-serif text-3xl">
        {title} <span className="font-sans text-sm text-stone">{count}</span>
      </h2>
      {count === 0 && empty ? <p className="mt-4 text-sm text-muted-foreground">{empty}</p> : <ul className="mt-6 divide-y divide-border border-y border-border">{children}</ul>}
    </section>
  );
}

function Row({ member, note, meta, children }: { member?: MemberSummary; note?: string | null; meta?: string; children: React.ReactNode }) {
  const name = member?.displayName ?? "A member";
  return (
    <li className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar src={member?.photoUrl} name={name} size={52} />
        <div>
          {member ? (
            <Link href={`/members/${member.userId}`} className="font-serif text-xl hover:underline underline-offset-4">{name}</Link>
          ) : (
            <span className="font-serif text-xl">{name}</span>
          )}
          <p className="text-xs uppercase tracking-[0.14em] text-stone">
            {member ? `${member.neighborhoodName} · ${member.sports.map((s) => s.name).join(", ")}` : ""}
            {meta ? <span className="ml-2 normal-case tracking-normal">{meta}</span> : null}
          </p>
          {note ? <p className="mt-2 max-w-xl text-sm italic text-graphite">&ldquo;{note}&rdquo;</p> : null}
        </div>
      </div>
      {children}
    </li>
  );
}
