import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { getMemberWithMatch } from "@/lib/data/members";
import { getActiveSports } from "@/lib/data/sports";
import { uuidSchema } from "@/lib/validation/common";
import { todayInNewYork } from "@/lib/domain/format";
import { AppMain } from "@/components/app/app-header";
import { Avatar } from "@/components/ui/avatar";
import { InvitationForm } from "@/components/invitations/invitation-form";

export const metadata: Metadata = { title: "Invite to play", robots: { index: false } };

export default async function NewInvitationPage({ searchParams }: PageProps<"/invitations/new">) {
  const sp = await searchParams;
  const to = typeof sp.to === "string" ? sp.to : "";
  if (!uuidSchema.safeParse(to).success) notFound();
  const viewer = await requireCommunityAccess(`/invitations/new?to=${to}`);
  if (to === viewer.id) notFound();
  const supabase = await createClient();
  const [member, sports] = await Promise.all([getMemberWithMatch(supabase, viewer.id, to), getActiveSports()]);
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
        Propose a time and a general place. Pochi Ma Buoni doesn&apos;t reserve venues — if {member.firstName} accepts, you&apos;ll
        arrange any booking together.
      </p>
      <div className="mt-10">
        <InvitationForm recipientId={to} sports={ordered.map((s) => ({ id: s.id, name: s.name }))} defaultSportId={member.match?.sportId} minDate={todayInNewYork()} />
      </div>
    </AppMain>
  );
}
