import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageIntro } from "@/components/site/page-intro";
import { Badge } from "@/components/ui/badge";
import { CITY_GUIDE_DISCLAIMER, CLUB_GROUPS, HOTELS, HOTEL_TIERS, PRIVATE_CLUBS } from "@/lib/domain/city-guide";

export const metadata: Metadata = {
  title: "The City",
  description:
    "A guide to New York's athletic and private members' clubs and its finest hotels, for members and the guests they bring to play.",
  alternates: { canonical: "/city" },
};

export default function CityGuidePage() {
  return (
    <>
      <PageIntro
        eyebrow="The city"
        title="Off the court, around the city."
        lede={
          <p>
            Sport in New York runs through its clubs and hotels as much as its parks. Here are the private members&apos; clubs,
            athletic clubs and hotels our members mention most, for reference when you host a partner or welcome a visiting player.
          </p>
        }
      />

      <nav aria-label="On this page" className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
        <ul className="flex flex-wrap gap-2">
          <li>
            <a href="#clubs" className="inline-flex h-9 items-center border border-ink bg-ink px-4 text-[0.75rem] uppercase tracking-[0.14em] text-paper">
              Private clubs · {PRIVATE_CLUBS.length}
            </a>
          </li>
          <li>
            <a href="#hotels" className="inline-flex h-9 items-center border border-border px-4 text-[0.75rem] uppercase tracking-[0.14em] text-graphite hover:border-stone">
              Hotels · {HOTELS.length}
            </a>
          </li>
          <li>
            <Link href="/venues" className="inline-flex h-9 items-center border border-border px-4 text-[0.75rem] uppercase tracking-[0.14em] text-graphite hover:border-stone">
              Sports venues
            </Link>
          </li>
        </ul>
      </nav>

      <section id="clubs" aria-labelledby="clubs-title" className="scroll-mt-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-20">
          <p className="eyebrow">Part one</p>
          <h2 id="clubs-title" className="mt-4 font-serif text-4xl sm:text-5xl">Private members&apos; clubs</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            From contemporary clubs to historic society, university and sporting clubs. All in Manhattan unless noted. Most admit
            members and their guests only.
          </p>

          <div className="mt-14 flex flex-col gap-16">
            {CLUB_GROUPS.map((g) => {
              const clubs = PRIVATE_CLUBS.filter((c) => c.group === g.value);
              return (
                <section key={g.value} aria-labelledby={`clubs-${g.value}`}>
                  <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
                    <h3 id={`clubs-${g.value}`} className="font-serif text-2xl sm:text-3xl">{g.label}</h3>
                    <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-stone">{clubs.length} clubs</p>
                  </div>
                  <ul className="divide-y divide-border">
                    {clubs.map((c) => (
                      <li key={c.name} className="grid gap-x-8 gap-y-2 py-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2">
                            <span className="font-serif text-xl leading-tight">{c.name}</span>
                            {c.sporting ? <Badge variant="steel">Sporting</Badge> : null}
                          </p>
                          <p className="mt-1 text-sm text-graphite">
                            {c.address}
                            <span className="text-stone"> · {c.operator}</span>
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{c.profile}</p>
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="text-muted-foreground">{c.access}</span>
                          {c.venuesHref ? (
                            <Link href={c.venuesHref} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-ink underline-offset-4 hover:underline">
                              In our venue guide <ArrowRight aria-hidden className="size-3" />
                            </Link>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section id="hotels" aria-labelledby="hotels-title" className="scroll-mt-24 border-t border-border bg-ivory">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-20">
          <p className="eyebrow">Part two</p>
          <h2 id="hotels-title" className="mt-4 font-serif text-4xl sm:text-5xl">Hotels</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Fifty-five hotels for visiting players and guests, ranked by prestige, service and facilities. The ranking is our own and
            subjective. All in Manhattan unless noted.
          </p>

          <div className="mt-14 grid gap-14 lg:grid-cols-2">
            {HOTEL_TIERS.map((t) => {
              const hotels = HOTELS.filter((h) => h.tier === t.value);
              return (
                <section key={t.value} aria-labelledby={`hotels-${t.value}`}>
                  <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
                    <h3 id={`hotels-${t.value}`} className="font-serif text-2xl sm:text-3xl">{t.label}</h3>
                    <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-stone">{hotels.length} hotels</p>
                  </div>
                  <ol className="divide-y divide-border">
                    {hotels.map((h) => (
                      <li key={h.rank} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 py-3.5">
                        <span className="pt-1 text-xs tabular-nums text-stone">{String(h.rank).padStart(2, "0")}</span>
                        <div className="min-w-0">
                          <p className="font-serif text-lg leading-tight">{h.name}</p>
                          <p className="mt-0.5 text-sm text-graphite">
                            {h.address}
                            <span className="text-stone"> · {h.brand}</span>
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <p className="max-w-3xl border-l-2 border-steel pl-5 text-sm leading-relaxed text-muted-foreground">{CITY_GUIDE_DISCLAIMER}</p>
      </section>
    </>
  );
}
