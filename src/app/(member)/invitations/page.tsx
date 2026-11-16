import type { Metadata } from "next";
import Link from "next/link";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { loadMembers } from "@/lib/data/members";
import { formatInvitationWhen, todayInNewYork } from "@/lib/domain/format";
import { AppMain, AppPageHeader } from "@/components/app/app-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InvitationActions } from "@/components/invitations/invitation-actions";
import type { Tables } from "@/types/database";

export const metadata: Metadata = { title: "Invitations", robots: { index: false } };

type Inv = Pick<Tables<"invitations">, "id" | "sender_id" | "recipient_id" | "sport_id" | "proposed_date" | "proposed_time" | "location_note" | "message" | "status" | "created_at">;

export default async function InvitationsPage() {
  const viewer = await requireCommunityAccess("/invitations");
  const supabase = await createClient();
  const [{ data }, { data: sports }] = await Promise.all([
    supabase
      .from("invitations")
      .select("id, sender_id, recipient_id, sport_id, proposed_date, proposed_time, location_note, message, status, created_at")
      .order("proposed_date", { ascending: true })
      .order("proposed_time", { ascending: true })
      .limit(200),
    supabase.from("sports").select("id, name"),
  ]);
  const invitations = (data ?? []).filter((i) => i.sender_id === viewer.id || i.recipient_id === viewer.id);
  const other = (i: Inv) => (i.sender_id === viewer.id ? i.recipient_id : i.sender_id);
  const { summaries } = await loadMembers(supabase, { userIds: [...new Set(invitations.map(other))] });
  const sportName = new Map((sports ?? []).map((s) => [s.id, s.name]));
  const today = todayInNewYork();

  const received = invitations.filter((i) => i.status === "PENDING" && i.recipient_id === viewer.id && i.proposed_date >= today);
  const upcoming = invitations.filter((i) => i.status === "ACCEPTED");
  const sent = invitations.filter((i) => i.status === "PENDING" && i.sender_id === viewer.id && i.proposed_date >= today);
  const past = invitations
    .filter((i) => ["DECLINED", "CANCELLED", "COMPLETED"].includes(i.status) || (i.status === "PENDING" && i.proposed_date < today))
    .reverse()
    .slice(0, 20);

  const card = (i: Inv, actions: React.ReactNode) => {
    const m = summaries.get(other(i));
    const name = m?.displayName ?? "A member";
    const incoming = i.recipient_id === viewer.id;
    return (
      <li key={i.id} className="grid gap-4 py-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex gap-4">
          <Avatar src={m?.photoUrl} name={name} size={52} />
          <div>
            <p className="font-serif text-2xl">
              {sportName.get(i.sport_id) ?? "Sport"} · {formatInvitationWhen(i.proposed_date, i.proposed_time)}
            </p>
            <p className="mt-1 text-sm text-graphite">
              {incoming ? "From" : "With"}{" "}
              {m ? <Link className="underline-offset-4 hover:underline" href={`/members/${m.userId}`}>{name}</Link> : name} · {i.location_note}
            </p>
            {i.message ? <p className="mt-2 max-w-xl text-sm italic text-muted-foreground">&ldquo;{i.message}&rdquo;</p> : null}
          </div>
        </div>
        {actions}
      </li>
    );
  };

  const isPast = (i: Inv) => i.proposed_date < today;

  return (
    <AppMain>
      <AppPageHeader eyebrow="Invitations" title="Games on the calendar." description="Venues are arranged directly between members — Pochi Ma Buoni never books on your behalf." actions={<Button asChild variant="outline"><Link href="/discover">Find a partner</Link></Button>} />
      {invitations.length === 0 ? (
        <EmptyState title="No invitations yet" description="Invite a member to play from their profile." action={<Button asChild><Link href="/discover">Discover members</Link></Button>} />
      ) : (
        <div className="flex flex-col gap-14">
          <Section title="Awaiting your reply" items={received}>
            {received.map((i) => card(i, <InvitationActions id={i.id} actions={["ACCEPTED", "DECLINED"]} />))}
          </Section>
          <Section title="Confirmed" items={upcoming}>
            {upcoming.map((i) => card(i, <InvitationActions id={i.id} actions={isPast(i) ? ["COMPLETED", "CANCELLED"] : ["CANCELLED"]} />))}
          </Section>
          <Section title="Sent" items={sent}>
            {sent.map((i) => card(i, <InvitationActions id={i.id} actions={["CANCELLED"]} />))}
          </Section>
          <Section title="Past" items={past}>
            {past.map((i) => card(i, <Badge variant={i.status === "COMPLETED" ? "success" : "muted"}>{i.status === "PENDING" ? "Expired" : i.status.toLowerCase()}</Badge>))}
          </Section>
        </div>
      )}
    </AppMain>
  );
}

function Section({ title, items, children }: { title: string; items: unknown[]; children: React.ReactNode }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="flex items-baseline gap-3 font-serif text-3xl">{title} <span className="font-sans text-sm text-stone">{items.length}</span></h2>
      <ul className="mt-4 divide-y divide-border border-y border-border">{children}</ul>
    </section>
  );
}
