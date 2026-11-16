import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { discoverMembers, connectionStates } from "@/lib/data/members";
import { formatInvitationWhen, todayInNewYork } from "@/lib/domain/format";
import { AppMain } from "@/components/app/app-header";
import { MemberCard } from "@/components/members/member-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Home", robots: { index: false } };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export default async function MemberHome() {
  const viewer = await requireCommunityAccess("/home");
  const supabase = await createClient();
  const today = todayInNewYork();
  const [{ results }, states, { count: incomingRequests }, { data: invites }, { data: sports }] = await Promise.all([
    discoverMembers(supabase, viewer.id, {}, 3),
    connectionStates(supabase, viewer.id),
    supabase.from("connections").select("id", { count: "exact", head: true }).eq("addressee_id", viewer.id).eq("status", "PENDING"),
    supabase
      .from("invitations")
      .select("id, sport_id, proposed_date, proposed_time, location_note, status, recipient_id")
      .in("status", ["PENDING", "ACCEPTED"])
      .gte("proposed_date", today)
      .order("proposed_date")
      .limit(5),
    supabase.from("sports").select("id, name"),
  ]);
  const sportName = new Map((sports ?? []).map((s) => [s.id, s.name]));
  const awaiting = (invites ?? []).filter((i) => i.status === "PENDING" && i.recipient_id === viewer.id).length;
  const confirmed = (invites ?? []).filter((i) => i.status === "ACCEPTED");

  return (
    <AppMain>
      <section className="border-b border-border pb-10">
        <p className="eyebrow">{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" }).format(new Date())}</p>
        <h1 className="display mt-4 text-5xl sm:text-6xl">
          {greeting()}, <em className="text-gold">{viewer.profile?.first_name ?? "member"}.</em>
        </h1>
        <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
          <Stat href="/connections" label="Connection requests" value={incomingRequests ?? 0} />
          <Stat href="/invitations" label="Invitations awaiting you" value={awaiting} />
          <Stat href="/invitations" label="Confirmed games" value={confirmed.length} />
        </div>
      </section>

      {confirmed.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl">On the calendar</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {confirmed.map((i) => (
              <li key={i.id} className="flex flex-wrap justify-between gap-2 py-4">
                <span className="font-serif text-xl">{sportName.get(i.sport_id)} · {formatInvitationWhen(i.proposed_date, i.proposed_time)}</span>
                <span className="text-sm text-muted-foreground">{i.location_note}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Suggested for you</h2>
          <Link href="/discover" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] hover:opacity-60">
            Discover all <ArrowRight className="size-4" />
          </Link>
        </div>
        {results.length === 0 ? (
          <EmptyState title="No suggestions yet" description="As more members join who share your sports, they'll appear here." action={<Button asChild variant="outline"><Link href="/profile">Review your sports</Link></Button>} />
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {results.map((m) => (
              <li key={m.userId}><MemberCard member={m} connection={states.get(m.userId) ?? { kind: "none" }} /></li>
            ))}
          </ul>
        )}
      </section>
    </AppMain>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="group bg-paper p-6 transition-colors hover:bg-ivory">
      <p className="font-serif text-5xl">{value}</p>
      <p className="mt-2 text-[0.6875rem] uppercase tracking-[0.16em] text-stone group-hover:text-ink">{label}</p>
    </Link>
  );
}
