import type { Metadata } from "next";
import Link from "next/link";
import { requireCommunityAccess } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { discoverMembers, discoverGroups, connectionStates, type DiscoverFilters } from "@/lib/data/members";
import { GROUP_SIZE_MAX, GROUP_SIZE_MIN } from "@/lib/domain/play-styles";
import { GroupCard } from "@/components/members/group-card";
import { cn } from "@/lib/utils";
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

  const mode = str(sp.mode) === "group" ? "group" : "partner";
  const sportSlug = str(sp.sport);
  const sport = sports.find((s) => s.slug === sportSlug);
  const filters: DiscoverFilters = {
    sport: sport?.id,
    area: AREAS.some((a) => a.value === str(sp.area)) ? str(sp.area) : undefined,
    when: (["weekday-mornings", "weekday-evenings", "weekends"] as const).find((w) => w === str(sp.when)),
    format: sport && sport.formats.includes(str(sp.format) ?? "") ? str(sp.format) : undefined,
    level: str(sp.level) === "similar" ? "similar" : "any",
    age: str(sp.age) === "any" ? "any" : "mine",
  };

  if (mode === "group") {
    return <GroupDiscover viewerId={viewer.id} sports={sports} sportSlug={sportSlug} sizeParam={str(sp.size)} age={filters.age!} />;
  }

  const [{ me, results }, states] = await Promise.all([discoverMembers(supabase, viewer.id, filters), connectionStates(supabase, viewer.id)]);

  return (
    <AppMain>
      <AppPageHeader
        eyebrow="Discover"
        title="Members you may play well with."
        description="Suggestions are ranked by a transparent compatibility score. A shared sport is always required."
      />
      <ModeTabs mode="partner" />
      <form method="get" className="mb-10 grid gap-6 border border-border bg-ivory p-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 xl:items-end">
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-age">Age</Label>
          <NativeSelect id="f-age" name="age" defaultValue={filters.age}>
            <option value="mine">My preferred range</option>
            <option value="any">Any age</option>
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

function ModeTabs({ mode }: { mode: "partner" | "group" }) {
  const tabs = [
    { value: "partner", label: "Find a partner", href: "/discover", hint: "One-on-one" },
    { value: "group", label: "Build a group", href: "/discover?mode=group", hint: "Doubles, foursomes, pickup" },
  ] as const;
  return (
    <nav aria-label="Matchmaking mode" className="mb-8 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link
          key={t.value}
          href={t.href}
          aria-current={mode === t.value ? "page" : undefined}
          className={cn(
            "flex flex-col border px-5 py-3 transition-colors",
            mode === t.value ? "border-ink bg-ink text-paper" : "border-border hover:border-stone",
          )}
        >
          <span className="text-xs font-medium uppercase tracking-[0.16em]">{t.label}</span>
          <span className={cn("mt-1 text-xs", mode === t.value ? "text-paper/70" : "text-muted-foreground")}>{t.hint}</span>
        </Link>
      ))}
    </nav>
  );
}

async function GroupDiscover({
  viewerId,
  sports,
  sportSlug,
  sizeParam,
  age,
}: {
  viewerId: string;
  sports: Awaited<ReturnType<typeof getActiveSports>>;
  sportSlug?: string;
  sizeParam?: string;
  age: "mine" | "any";
}) {
  const supabase = await createClient();
  const { data: mine } = await supabase.from("member_sports").select("sport_id").eq("user_id", viewerId);
  const mySports = sports.filter((s) => (mine ?? []).some((m) => m.sport_id === s.id));
  const sport = mySports.find((s) => s.slug === sportSlug) ?? mySports[0];
  const parsedSize = Number(sizeParam);
  const size = Number.isInteger(parsedSize) && parsedSize >= GROUP_SIZE_MIN && parsedSize <= GROUP_SIZE_MAX ? parsedSize : 4;
  const { groups, poolSize } = sport ? await discoverGroups(supabase, viewerId, { sportId: sport.id, size, age }) : { groups: [], poolSize: 0 };

  return (
    <AppMain>
      <AppPageHeader
        eyebrow="Discover"
        title="Build a group to play with."
        description="Choose a sport and a group size. We suggest members who share a free time with you and with each other, and who have said they enjoy playing in groups."
      />
      <ModeTabs mode="group" />
      <form method="get" className="mb-10 grid gap-6 border border-border bg-ivory p-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <input type="hidden" name="mode" value="group" />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="g-sport">Sport</Label>
          <NativeSelect id="g-sport" name="sport" defaultValue={sport?.slug ?? ""} disabled={mySports.length === 0}>
            {mySports.length === 0 ? <option value="">Add a sport to your profile</option> : null}
            {mySports.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="g-size">Group size (including you)</Label>
          <NativeSelect id="g-size" name="size" defaultValue={String(size)}>
            {Array.from({ length: GROUP_SIZE_MAX - GROUP_SIZE_MIN + 1 }, (_, i) => i + GROUP_SIZE_MIN).map((n) => (
              <option key={n} value={n}>
                {n} players{n === 4 ? " (doubles, a foursome)" : n === 3 ? " (a small session)" : n >= 7 ? " (pickup or team)" : ""}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="g-age">Age</Label>
          <NativeSelect id="g-age" name="age" defaultValue={age}>
            <option value="mine">My preferred range</option>
            <option value="any">Any age</option>
          </NativeSelect>
        </div>
        <Button type="submit">Suggest groups</Button>
      </form>

      {mySports.length === 0 ? (
        <EmptyState title="Add a sport to your profile" description="Groups are built around one sport you play." action={<Button asChild><Link href="/profile">Add sports</Link></Button>} />
      ) : groups.length === 0 ? (
        <EmptyState
          title={`No group of ${size} fits yet`}
          description={
            poolSize < size - 1
              ? `${poolSize === 0 ? "No other members" : `Only ${poolSize} other ${poolSize === 1 ? "member" : "members"}`} who play ${sport!.name.toLowerCase()} in groups of this size match your preferences so far. Try a smaller group or widen your age range.`
              : "There are enough players, but no time when everyone is free. Try adding more availability to your profile, or a smaller group."
          }
          action={<Button asChild variant="outline"><Link href={`/discover?mode=group&sport=${sport!.slug}&size=${Math.max(GROUP_SIZE_MIN, size - 1)}`}>Try a smaller group</Link></Button>}
        />
      ) : (
        <ul className="grid gap-6 lg:grid-cols-2">
          {groups.map((g, i) => (
            <li key={g.memberIds.join()}>
              <GroupCard group={g} index={i} sportSlug={sport!.slug} />
            </li>
          ))}
        </ul>
      )}
    </AppMain>
  );
}
