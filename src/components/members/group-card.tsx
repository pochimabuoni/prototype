import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { GroupSuggestion } from "@/lib/matching/group";
import type { MemberSummary } from "@/lib/data/members";

export function GroupCard({
  group,
  index,
  sportSlug,
}: {
  group: GroupSuggestion & { members: MemberSummary[] };
  index: number;
  sportSlug: string;
}) {
  const inviteHref = `/invitations/new?sport=${sportSlug}&group=${group.memberIds.join(",")}`;
  return (
    <article className="flex h-full flex-col border border-border bg-card">
      <header className="flex items-start justify-between gap-4 p-6">
        <div>
          <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-stone">
            Suggestion {index + 1} · {group.sportName}
          </p>
          <h3 className="mt-2 font-serif text-2xl leading-tight">You and {group.members.length} {group.members.length === 1 ? "member" : "members"}</h3>
        </div>
        <div className="text-right" aria-label={`Group compatibility ${group.score} percent`}>
          <p className="font-serif text-4xl leading-none">
            {group.score}
            <span className="text-sm text-stone">%</span>
          </p>
          <p className="mt-1 text-[0.625rem] uppercase tracking-[0.16em] text-stone">Group fit</p>
        </div>
      </header>
      <ul className="divide-y divide-border border-t border-border">
        {group.members.map((m) => {
          const level = m.sports.find((s) => s.sportId === group.sportId)?.level;
          return (
            <li key={m.userId} className="flex items-center gap-4 px-6 py-3">
              <Avatar src={m.photoUrl} name={m.displayName} size={40} />
              <div className="min-w-0 flex-1">
                <Link href={`/members/${m.userId}`} className="block truncate font-medium hover:underline underline-offset-4">
                  {m.displayName}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {[level, m.neighborhoodName, m.age ? `${m.age}` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-1 flex-col gap-4 border-t border-border p-6">
        <ul className="space-y-1.5 text-sm text-graphite">
          {group.reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <span aria-hidden className="text-steel">—</span>
              {r}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center justify-end border-t border-border px-6 py-4">
        <Button asChild size="sm">
          <Link href={inviteHref}>Invite this group</Link>
        </Button>
      </div>
    </article>
  );
}
