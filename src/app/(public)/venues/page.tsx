import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageIntro } from "@/components/site/page-intro";
import { getVenueDirectory } from "@/lib/data/venues";
import { VENUE_DISCLAIMER } from "@/lib/domain/venues";

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
        lede={<p>A short guide to the courts, fields, pools and routes our members use across Manhattan and nearby. Choose a sport to see its venues.</p>}
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
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <p className="max-w-3xl border-l-2 border-steel pl-5 text-sm leading-relaxed text-muted-foreground">{VENUE_DISCLAIMER}</p>
      </section>
    </>
  );
}
