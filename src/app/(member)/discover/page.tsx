import type { Metadata } from "next";
import Link from "next/link";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { discoverMembers, connectionStates, type DiscoverFilters } from "@/lib/data/members";
import { getActiveSports } from "@/lib/data/sports";
import { AppMain, AppPageHeader } from "@/components/app/app-header";
import { MemberCard } from "@/components/members/member-card";
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Discover", robots: { index: false } };

const AREAS = [
  { value: "downtown", label: "Downtown Manhattan" },
  { value: "midtown", label: "Midtown Manhattan" },
  { value: "uptown", label: "Uptown Manhattan" },
  { value: "north-brooklyn", label: "North Brooklyn" },
  { value: "brownstone-brooklyn", label: "Brownstone Brooklyn" },
  { value: "western-queens", label: "Western Queens" },
];

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function DiscoverPage({ searchParams }: PageProps<"/discover">) {
  const viewer = await requireCommunityAccess("/discover");
  const sp = await searchParams;
  const supabase = await createClient();
  const sports = await getActiveSports();

  const sportSlug = str(sp.sport);
  const sport = sports.find((s) => s.slug === sportSlug);
  const filters: DiscoverFilters = {
    sport: sport?.id,
    area: AREAS.some((a) => a.value === str(sp.area)) ? str(sp.area) : undefined,
    when: (["weekday-mornings", "weekday-evenings", "weekends"] as const).find((w) => w === str(sp.when)),
    format: sport && sport.formats.includes(str(sp.format) ?? "") ? str(sp.format) : undefined,
    level: str(sp.level) === "similar" ? "similar" : "any",
  };

  const [{ me, results }, states] = await Promise.all([discoverMembers(supabase, viewer.id, filters), connectionStates(supabase, viewer.id)]);

  return (
    <AppMain>
      <AppPageHeader
        eyebrow="Discover"
        title="Members you may play well with."
        description="Suggestions are ranked by a transparent compatibility score. A shared sport is always required."
      />
      <form method="get" className="mb-10 grid gap-6 border border-border bg-ivory p-6 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-sport">Sport</Label>
          <NativeSelect id="f-sport" name="sport" defaultValue={sport?.slug ?? ""}>
            <option value="">All my sports</option>
            {sports.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-level">Level</Label>
          <NativeSelect id="f-level" name="level" defaultValue={filters.level}>
            <option value="any">Any level</option>
            <option value="similar">Similar to mine</option>
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-area">Neighbourhood</Label>
          <NativeSelect id="f-area" name="area" defaultValue={filters.area ?? ""}>
            <option value="">Anywhere</option>
            {AREAS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-when">Availability</Label>
          <NativeSelect id="f-when" name="when" defaultValue={filters.when ?? ""}>
            <option value="">Any time</option>
            <option value="weekday-mornings">Weekday mornings</option>
            <option value="weekday-evenings">Weekday evenings</option>
            <option value="weekends">Weekends</option>
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-format">Format</Label>
          <NativeSelect id="f-format" name="format" defaultValue={filters.format ?? ""} disabled={!sport}>
            <option value="">{sport ? "Any format" : "Choose a sport first"}</option>
            {sport?.formats.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex gap-3">
          <Button type="submit" className="flex-1">Apply</Button>
          <Button asChild variant="ghost">
            <Link href="/discover">Reset</Link>
          </Button>
        </div>
      </form>

      {!me ? (
        <EmptyState
          title="Complete your profile to see suggestions"
          description="Add your sports, levels and availability so we can introduce you to compatible members."
          action={<Button asChild><Link href="/profile">Edit profile</Link></Button>}
        />
      ) : me.sports.length === 0 ? (
        <EmptyState title="Add a sport to your profile" description="Suggestions require at least one shared sport." action={<Button asChild><Link href="/profile">Add sports</Link></Button>} />
      ) : results.length === 0 ? (
        <EmptyState
          title="No members match these filters yet"
          description="Try widening your neighbourhood or availability. The community grows every week."
          action={<Button asChild variant="outline"><Link href="/discover">Clear filters</Link></Button>}
        />
      ) : (
        <>
          <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
            {results.length} {results.length === 1 ? "member" : "members"}
          </p>
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {results.map((m) => (
              <li key={m.userId}>
                <MemberCard member={m} connection={states.get(m.userId) ?? { kind: "none" }} />
              </li>
            ))}
          </ul>
        </>
      )}
    </AppMain>
  );
}
