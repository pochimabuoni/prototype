import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site/page-intro";
import { EditorialArt } from "@/components/brand/editorial-art";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Our Philosophy",
  description: "Why Pochi Ma Buoni keeps its membership small, considered and international.",
  alternates: { canonical: "/philosophy" },
};

const PRINCIPLES = [
  {
    title: "Quality over volume",
    body: "We would rather introduce you to three people you will play with for years than three hundred you will never see again. The membership grows slowly on purpose.",
  },
  {
    title: "Sport as common ground",
    body: "A shared hour on a court says more about someone than any profile. Sport gives conversation somewhere to begin and a reason to return.",
  },
  {
    title: "International by nature",
    body: "New York draws people from everywhere. Our members bring the padel of Madrid, the running clubs of London and the tennis of Milan — and find each other here.",
  },
  {
    title: "Understated, never exclusive for its own sake",
    body: "Selectivity is about the health of the community, not status. We look for good company, reliability and genuine enthusiasm — at every level of play.",
  },
  {
    title: "Privacy as a courtesy",
    body: "No public profiles, no exact locations, no phone numbers exchanged until you choose. Members decide who sees them and can step away at any time.",
  },
];

export default function PhilosophyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Our philosophy"
        title={
          <>
            Pochi ma buoni. <em className="text-gold">Few, but good.</em>
          </>
        }
        lede={
          <p>
            An Italian expression for choosing carefully — fewer things, better ones. We apply it to the people you spend your
            mornings, evenings and weekends playing with.
          </p>
        }
      />
      <section className="mx-auto grid max-w-7xl gap-16 px-5 pb-24 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
        <EditorialArt variant="track" alt="A line study of running lanes curving into the distance" className="aspect-[4/5] lg:sticky lg:top-28" caption="East River Esplanade" />
        <ol className="divide-y divide-border border-y border-border">
          {PRINCIPLES.map((p, i) => (
            <li key={p.title} className="grid gap-4 py-10 sm:grid-cols-[4rem_1fr]">
              <span className="font-serif text-3xl text-gold">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="font-serif text-3xl">{p.title}</h2>
                <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="border-t border-border bg-ivory">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center">
          <p className="max-w-2xl font-serif text-3xl">If this reads like your kind of room, we would be glad to hear from you.</p>
          <Button asChild size="lg">
            <Link href="/apply">Apply for membership</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
