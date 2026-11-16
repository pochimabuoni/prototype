import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { getMemberWithMatch, loadMembers } from "@/lib/data/members";
import { getActiveSports } from "@/lib/data/sports";
import { venueNamesBySport } from "@/lib/data/venues";
import { uuidSchema } from "@/lib/validation/common";
import { MAX_GROUP_INVITEES } from "@/lib/validation/community";
import { todayInNewYork } from "@/lib/domain/format";
import { AppMain } from "@/components/app/app-header";
import { Avatar } from "@/components/ui/avatar";
import { InvitationForm } from "@/components/invitations/invitation-form";

export const metadata: Metadata = { title: "Invite to play", robots: { index: false } };

const VENUE_NOTE = "Pochi Ma Buoni doesn't reserve venues.";

export default async function NewInvitationPage({ searchParams }: PageProps<"/invitations/new">) {
  const sp = await searchParams;
  const to = typeof sp.to === "string" ? sp.to : "";
  const groupParam = typeof sp.group === "string" ? sp.group : "";
  const sportSlug = typeof sp.sport === "string" ? sp.sport : undefined;

  if (groupParam) {
    const ids = [...new Set(groupParam.split(","))];
    if (ids.length < 2 || ids.length > MAX_GROUP_INVITEES || !ids.every((id) => uuidSchema.safeParse(id).success)) notFound();
    return <GroupInvitation ids={ids} sportSlug={sportSlug} returnTo={`/invitations/new?group=${ids.join(",")}${sportSlug ? `&sport=${sportSlug}` : ""}`} />;
  }

  if (!uuidSchema.safeParse(to).success) notFound();
  const viewer = await requireCommunityAccess(`/invitations/new?to=${to}`);
  if (to === viewer.id) notFound();
  const supabase = await createClient();
  const [member, sports, venues] = await Promise.all([getMemberWithMatch(supabase, viewer.id, to), getActiveSports(), venueNamesBySport()]);
  if (!member) notFound();

  // Shared sports first; any active sport is allowed.
  const shared = new Set(member.sports.map((s) => s.sportId));
  const ordered = [...sports].sort((a, b) => Number(shared.has(b.id)) - Number(shared.has(a.id)));

  return (
    <AppMain className="max-w-3xl">
      <Link href={`/members/${to}`} className="text-xs uppercase tracking-[0.16em] text-stone hover:text-ink">← {member.firstName}</Link>
      <div className="mt-8 flex items-center gap-5">
        <Avatar src={member.photoUrl} name={member.displayName} size={64} />
        <div>
          <p className="eyebrow">Invitation to play</p>
          <h1 className="display mt-2 text-4xl">Invite {member.firstName}</h1>
        </div>
      </div>
      <p className="mt-6 text-muted-foreground">
        Propose a time and a general place. {VENUE_NOTE} If {member.firstName} accepts, you&apos;ll arrange any booking together.
      </p>
      <div className="mt-10">
        <InvitationForm
          recipientIds={[to]}
          sports={ordered.map((s) => ({ id: s.id, name: s.name }))}
          defaultSportId={member.match?.sportId}
          minDate={todayInNewYork()}
          venuesBySport={venues}
        />
      </div>
    </AppMain>
  );
}

async function GroupInvitation({ ids, sportSlug, returnTo }: { ids: string[]; sportSlug?: string; returnTo: string }) {
  const viewer = await requireCommunityAccess(returnTo);
  if (ids.includes(viewer.id)) notFound();
  const supabase = await createClient();
  const [{ summaries }, sports, venues] = await Promise.all([loadMembers(supabase, { userIds: ids }), getActiveSports(), venueNamesBySport()]);
  const members = ids.map((id) => summaries.get(id)).filter((m) => !!m);
  if (members.length !== ids.length) notFound();
  const sport = sports.find((s) => s.slug === sportSlug);
  const ordered = sport ? [sport, ...sports.filter((s) => s.id !== sport.id)] : sports;

  return (
    <AppMain className="max-w-3xl">
      <Link href={`/discover?mode=group${sport ? `&sport=${sport.slug}` : ""}&size=${ids.length + 1}`} className="text-xs uppercase tracking-[0.16em] text-stone hover:text-ink">
        ← Group suggestions
      </Link>
      <p className="eyebrow mt-8">Group invitation</p>
      <h1 className="display mt-2 text-4xl">Invite a group of {ids.length + 1}</h1>
      <ul className="mt-8 flex flex-wrap gap-4">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center gap-3 border border-border py-2 pl-2 pr-4">
            <Avatar src={m.photoUrl} name={m.displayName} size={36} />
            <span className="text-sm">{m.displayName}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-muted-foreground">
        Each member receives their own invitation and can accept or decline. {VENUE_NOTE} Once people accept, you arrange any booking together.
      </p>
      <div className="mt-10">
        <InvitationForm
          recipientIds={ids}
          sports={ordered.map((s) => ({ id: s.id, name: s.name }))}
          defaultSportId={sport?.id}
          minDate={todayInNewYork()}
          venuesBySport={venues}
        />
      </div>
    </AppMain>
  );
}
