import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { MemberMatch } from "@/lib/data/members";
import type { ConnectionState } from "@/lib/data/members";
import { COMPONENT_LABELS } from "@/lib/matching/score";
import { ConnectButton } from "./connect-button";

export function MemberCard({ member, connection }: { member: MemberMatch; connection: ConnectionState }) {
  const m = member.match;
  return (
    <article className="flex h-full flex-col border border-border bg-card">
      <div className="flex items-start gap-4 p-6">
        <Avatar src={member.photoUrl} name={member.displayName} size={64} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-2xl leading-tight">
            <Link href={`/members/${member.userId}`} className="hover:underline underline-offset-4">
              {member.displayName}
            </Link>
          </h3>
          <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.16em] text-stone">{member.neighborhoodName}</p>
          {member.occupation ? <p className="mt-1 truncate text-sm text-muted-foreground">{member.occupation}</p> : null}
        </div>
        {m ? (
          <div className="text-right" aria-label={`Compatibility ${m.score} percent`}>
            <p className="font-serif text-4xl leading-none">
              {m.score}
              <span className="text-sm text-stone">%</span>
            </p>
            <p className="mt-1 text-[0.625rem] uppercase tracking-[0.16em] text-stone">{m.sportName}</p>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 border-t border-border p-6">
        <ul className="flex flex-wrap gap-1.5">
          {member.sports.map((s) => (
            <li key={s.sportId}>
              <Badge variant="muted">
                {s.name} · {s.level}
              </Badge>
            </li>
          ))}
        </ul>
        {m && m.reasons.length > 0 ? (
          <ul className="space-y-1.5 text-sm text-graphite">
            {m.reasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span aria-hidden className="text-gold">—</span>
                {r}
              </li>
            ))}
          </ul>
        ) : null}
        {m && m.missing.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Based on {Math.round(m.coverage * 100)}% of signals · not yet known: {m.missing.map((k) => COMPONENT_LABELS[k].toLowerCase()).join(", ")}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
        <Link href={`/members/${member.userId}`} className="text-xs uppercase tracking-[0.16em] underline-offset-4 hover:underline">
          View profile
        </Link>
        <ConnectButton memberId={member.userId} state={connection} compact />
      </div>
    </article>
  );
}
