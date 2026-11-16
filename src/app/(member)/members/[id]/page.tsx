import type { Metadata } from "next";
import { playStyleLabel } from "@/lib/domain/play-styles";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { getMemberWithMatch, connectionStates } from "@/lib/data/members";
import { uuidSchema } from "@/lib/validation/common";
import { describeSlots } from "@/lib/domain/availability";
import { COMPONENT_KEYS, COMPONENT_LABELS } from "@/lib/matching/score";
import { AppMain } from "@/components/app/app-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConnectButton } from "@/components/members/connect-button";
import { SafetyActions } from "@/components/members/safety-actions";
import { openConversation } from "@/actions/messages";

export const metadata: Metadata = { title: "Member", robots: { index: false } };

export default async function MemberPage({ params, searchParams }: PageProps<"/members/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!uuidSchema.safeParse(id).success) notFound();
  const viewer = await requireCommunityAccess(`/members/${id}`);
  const supabase = await createClient();
  const [member, states] = await Promise.all([getMemberWithMatch(supabase, viewer.id, id), connectionStates(supabase, viewer.id)]);
  // RLS returns nothing for hidden, blocked, inactive or non-existent members.
  if (!member) notFound();

  const isSelf = id === viewer.id;
  const state = states.get(id) ?? { kind: "none" as const };
  const m = member.match;

  return (
    <AppMain className="max-w-5xl">
      <Link href="/discover" className="text-xs uppercase tracking-[0.16em] text-stone hover:text-ink">← Discover</Link>
      {sp.notice === "messaging-unavailable" ? (
        <Alert variant="destructive" className="mt-6">Messaging opens once you&apos;re connected with this member.</Alert>
      ) : null}
      <div className="mt-8 grid gap-12 md:grid-cols-[1fr_20rem]">
        <section>
          <div className="flex items-center gap-6">
            <Avatar src={member.photoUrl} name={member.displayName} size={112} />
            <div>
              <h1 className="display text-5xl">{member.displayName}</h1>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-stone">
                {member.neighborhoodName}
                {member.age ? ` · ${member.age}` : ""}
              </p>
              {member.occupation ? <p className="mt-1 text-muted-foreground">{member.occupation}</p> : null}
              <p className="mt-2 text-sm text-graphite">Enjoys {member.playStyles.map((p) => playStyleLabel(p).toLowerCase()).join(", ")} play</p>
            </div>
          </div>
          {member.bio ? <p className="mt-10 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-graphite">{member.bio}</p> : null}

          <h2 className="mt-12 eyebrow">Plays</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {member.sports.map((s) => (
              <li key={s.sportId} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                <span className="font-serif text-2xl">{s.name}</span>
                <span className="flex flex-wrap gap-1.5">
                  <Badge variant="default">{s.level}</Badge>
                  {s.formats.map((f) => <Badge key={f}>{f}</Badge>)}
                </span>
              </li>
            ))}
          </ul>
          {member.availability.length ? (
            <p className="mt-6 text-sm text-muted-foreground">Usually free: {describeSlots(member.availability)}</p>
          ) : null}
        </section>

        <aside className="flex flex-col gap-6">
          {m ? (
            <div className="border border-border bg-ivory p-6">
              <p className="eyebrow">Compatibility · {m.sportName}</p>
              <p className="mt-4 font-serif text-6xl leading-none">{m.score}<span className="text-xl text-stone">%</span></p>
              <dl className="mt-6 space-y-3">
                {COMPONENT_KEYS.map((k) => (
                  <div key={k}>
                    <div className="flex justify-between text-xs">
                      <dt>{COMPONENT_LABELS[k]}</dt>
                      <dd className="text-stone">{m.components[k] === undefined ? "Not known" : `${Math.round(m.components[k]! * 100)}%`}</dd>
                    </div>
                    <div className="mt-1 h-px bg-sand">
                      <div className="h-px bg-ink" style={{ width: `${Math.round((m.components[k] ?? 0) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </dl>
              {m.reasons.length ? (
                <ul className="mt-6 space-y-1.5 text-sm">
                  {m.reasons.map((r) => <li key={r}>— {r}</li>)}
                </ul>
              ) : null}
            </div>
          ) : null}

          {!isSelf ? (
            <div id="message" className="flex flex-col gap-3">
              <ConnectButton memberId={id} state={state} />
              {state.kind === "connected" ? (
                <form action={openConversation.bind(null, id)}>
                  <Button type="submit" variant="outline" className="w-full">Send a message</Button>
                </form>
              ) : null}
              <Button asChild variant="outline">
                <Link href={`/invitations/new?to=${id}`}>Invite to play</Link>
              </Button>
              <div className="mt-4 border-t border-border pt-4">
                <SafetyActions memberId={id} memberName={member.firstName} />
              </div>
            </div>
          ) : (
            <Button asChild variant="outline"><Link href="/profile">Edit your profile</Link></Button>
          )}
        </aside>
      </div>
    </AppMain>
  );
}
