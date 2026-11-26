import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/site/page-intro";
import { getVenueDirectory } from "@/lib/data/venues";
import { PUBLIC_FACILITY_REGISTERS, VENUE_DISCLAIMER } from "@/lib/domain/venues";

export const metadata: Metadata = {
  title: "Venues",
  description: "Where members play in New York: public courts, fields, pools and clubs for every sport, chosen by sport.",
  alternates: { canonical: "/venues" },
};

export default async function VenuesPage() {
  const directory = await getVenueDirectory();
  return (
    <>
      <PageIntro
        eyebrow="Venues"
        title="Where to play, sport by sport."
        lede={<p>A guide to the clubs, courts, fields, pools and routes our members use, from Manhattan to the other four boroughs. Choose a sport to see its venues.</p>}
      />
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        {directory.length === 0 ? (
          <p className="border border-border bg-ivory p-8 text-muted-foreground">The venue guide is being prepared. Please check back soon.</p>
        ) : (
          <ul className="grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {directory.map(({ sport, venues }) => (
              <li key={sport.id} className="border-b border-r border-border bg-paper">
                <Link
                  href={`/venues/${sport.slug}`}
                  className="group flex h-full flex-col justify-between gap-10 p-8 transition-colors hover:bg-ivory focus-visible:bg-ivory"
                >
                  <div>
                    <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-stone">
                      {venues.length === 0 ? "Venues coming soon" : `${venues.length} ${venues.length === 1 ? "venue" : "venues"}`}
                    </p>
                    <h2 className="mt-4 font-serif text-4xl">{sport.name}</h2>
                    {venues.length > 0 ? (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{venues.slice(0, 3).map((v) => v.name).join(" · ")}</p>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink">
                    See venues <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="border-t border-border bg-ivory">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">Beyond the guide</p>
            <h2 className="mt-4 font-serif text-3xl">Every public court and field.</h2>
            <p className="mt-3 text-muted-foreground">
              New York has thousands of public facilities. We list the ones members ask about most. These registers cover the rest.
            </p>
          </div>
          <ul className="grid border-l border-t border-border sm:grid-cols-2">
            {PUBLIC_FACILITY_REGISTERS.map((r) => (
              <li key={r.href} className="border-b border-r border-border bg-paper">
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-start justify-between gap-4 p-5 transition-colors hover:bg-ivory focus-visible:bg-ivory"
                >
                  <span>
                    <span className="block font-serif text-xl">{r.label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{r.detail}</span>
                  </span>
                  <ArrowUpRight aria-hidden className="mt-1 size-4 shrink-0 text-stone transition-colors group-hover:text-ink" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-4 border border-border p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-2xl">After the game.</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Athletic and private members&apos; clubs, and the hotels where visiting players stay, in our guide to the city.
            </p>
          </div>
          <Link href="/city" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink hover:underline underline-offset-4">
            The city guide <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <p className="max-w-3xl border-l-2 border-steel pl-5 text-sm leading-relaxed text-muted-foreground">{VENUE_DISCLAIMER}</p>
      </section>
    </>
  );
}
