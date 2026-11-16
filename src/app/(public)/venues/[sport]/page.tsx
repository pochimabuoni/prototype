import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSportVenues, getVenueDirectory } from "@/lib/data/venues";
import { VENUE_DISCLAIMER } from "@/lib/domain/venues";
import { VenueCard } from "@/components/venues/venue-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/venues/[sport]">): Promise<Metadata> {
  const { sport } = await params;
  const data = await getSportVenues(sport);
  if (!data) return { title: "Venues" };
  return {
    title: `${data.sport.name} venues`,
    description: `Where to play ${data.sport.name.toLowerCase()} in New York: public and private venues our members use.`,
    alternates: { canonical: `/venues/${data.sport.slug}` },
  };
}

export default async function SportVenuesPage({ params }: PageProps<"/venues/[sport]">) {
  const { sport: slug } = await params;
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) notFound();
  const directory = await getVenueDirectory();
  const current = directory.find((d) => d.sport.slug === slug);
  if (!current) notFound();
  const { sport, venues } = current;

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8 md:pt-24">
        <Link href="/venues" className="text-xs uppercase tracking-[0.16em] text-stone hover:text-ink">← All sports</Link>
        <p className="eyebrow mt-10">Venues</p>
        <h1 className="display mt-6 text-5xl sm:text-6xl md:text-7xl">Where to play {sport.name.toLowerCase()}.</h1>
        <nav aria-label="Choose a sport" className="-mx-5 mt-10 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <ul className="flex gap-2 pb-1">
            {directory.map(({ sport: s }) => (
              <li key={s.id}>
                <Link
                  href={`/venues/${s.slug}`}
                  aria-current={s.slug === sport.slug ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center whitespace-nowrap border px-4 text-[0.75rem] uppercase tracking-[0.14em] transition-colors",
                    s.slug === sport.slug ? "border-ink bg-ink text-paper" : "border-border text-graphite hover:border-stone",
                  )}
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        {venues.length === 0 ? (
          <p className="border border-border bg-ivory p-8 text-muted-foreground">
            We haven&apos;t listed {sport.name.toLowerCase()} venues yet. Members suggest places when they invite each other to play.
          </p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {venues.map((v) => (
              <li key={v.id}>
                <VenueCard venue={v} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-border bg-ivory">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="font-serif text-3xl">Found the place? Find the people.</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Members can find a partner or build a whole group for {sport.name.toLowerCase()}, then suggest one of these venues when they send an invitation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/discover?sport=${sport.slug}`}>Find a partner</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/discover?mode=group&sport=${sport.slug}`}>Build a group</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <p className="max-w-3xl border-l-2 border-steel pl-5 text-sm leading-relaxed text-muted-foreground">{VENUE_DISCLAIMER}</p>
      </section>
    </>
  );
}
