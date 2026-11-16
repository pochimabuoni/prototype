import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorialArt } from "@/components/brand/editorial-art";
import { BRAND } from "@/lib/domain/constants";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} — A private sports community in New York` },
  alternates: { canonical: "/" },
};

const SPORTS = [
  "Tennis", "Padel", "Pickleball", "Golf", "Squash", "Running",
  "Swimming", "Cycling", "Basketball", "Soccer", "Volleyball",
];

const MATCH_FACTORS = [
  { n: "35%", title: "Availability", body: "Overlap in the hours you actually have — early weekday hits, weekend mornings, late evenings." },
  { n: "30%", title: "Level", body: "Members are introduced to others who will make the game better, not easier or harder." },
  { n: "20%", title: "Neighbourhood", body: "Proximity matters in Manhattan. We consider where you live and play, never your address." },
  { n: "15%", title: "Format", body: "Singles or doubles, long runs or intervals, nine holes or eighteen." },
];

const BENEFITS = [
  { title: "Considered introductions", body: "A short list of compatible members for each sport you play, with clear reasons why you'd suit one another." },
  { title: "A vetted circle", body: "Every member is reviewed personally. The community stays small enough that names become familiar." },
  { title: "Private coordination", body: "Invitations and messages between members, without phone numbers or public profiles." },
  { title: "Your city, your venues", body: "Play wherever you already do — public courts, private clubs, parks and pools across the five boroughs." },
  { title: "Discretion by design", body: "Neighbourhood-level location only, visibility controls, and the ability to block or report at any time." },
  { title: "Gatherings", body: "Occasional members' sessions and socials, announced to the community first." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-7xl items-stretch gap-0 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex min-w-0 flex-col justify-center px-5 py-20 sm:px-8 lg:py-28">
            <p className="eyebrow !text-paper/50 animate-fade-in">Private members · New York City</p>
            <h1 className="display mt-8 text-[2.5rem] tracking-[0.04em] sm:text-7xl sm:tracking-[0.06em] lg:text-[5.5rem] animate-fade-in">
              POCHI
              <span className="mx-2 align-middle font-serif sm:mx-3 text-[0.45em] italic tracking-normal text-steel">ma</span>
              BUONI
            </h1>
            <p className="mt-8 max-w-xl font-serif text-2xl italic leading-snug text-paper/90 sm:text-3xl">
              &ldquo;{BRAND.tagline}&rdquo;
            </p>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-paper/65">{BRAND.description}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="inverse">
                <Link href="/apply">Apply for membership</Link>
              </Button>
              <Button asChild size="lg" variant="outline-inverse">
                <Link href="/philosophy">Discover the community</Link>
              </Button>
            </div>
          </div>
          <EditorialArt
            variant="court"
            alt="A line study of a tennis court seen in perspective"
            caption="Hudson River Park · 7:10am"
            className="min-h-[22rem] border-t border-paper/10 lg:border-l lg:border-t-0"
            priority
          />
        </div>
      </section>

      {/* Concept */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 md:py-32">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">The idea</p>
            <h2 className="display mt-6 text-4xl sm:text-5xl">
              Few, <em className="text-steel">but good.</em>
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-graphite/85">
            <p>
              New York is full of people who play — and remarkably short of good ways to find the right people to play with.
              Group chats fill up with strangers. Apps optimise for volume. The best partners are usually met by chance.
            </p>
            <p>
              Pochi Ma Buoni is a private social network for adults who take their sport seriously and their company more
              seriously still. We admit members selectively, learn how and when they play, and make thoughtful introductions.
            </p>
            <p className="text-base text-muted-foreground">
              We are not a gym, a court-booking service, or a dating app. Members arrange play themselves at the venues they
              already love; we make sure the person across the net is worth meeting.
            </p>
          </div>
        </div>
      </section>

      {/* Matching */}
      <section className="border-y border-border bg-ivory">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 md:py-32">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">How matching works</p>
              <h2 className="display mt-6 max-w-2xl text-4xl sm:text-5xl">Introductions with reasons, not a feed of faces.</h2>
            </div>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] hover:opacity-60">
              The full process <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-16 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {MATCH_FACTORS.map((f) => (
              <div key={f.title} className="bg-ivory p-8">
                <p className="font-serif text-5xl text-steel">{f.n}</p>
                <p className="mt-6 text-sm font-medium uppercase tracking-[0.16em]">{f.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid items-center gap-10 md:grid-cols-[1fr_1fr]">
            <p className="max-w-md text-base leading-relaxed text-graphite/80">
              A shared sport is always required. Everything else is weighed transparently, and every suggestion explains itself
              — so you know exactly why two people were introduced.
            </p>
            <figure aria-label="Example introduction" className="border border-border bg-paper p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-serif text-2xl">Giulia R.</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-stone">West Village · Tennis, Padel</p>
                </div>
                <p className="font-serif text-4xl">
                  92<span className="text-base text-stone">%</span>
                </p>
              </div>
              <ul className="mt-5 flex flex-wrap gap-2 text-xs">
                {["Both play intermediate tennis", "Available on weekend mornings", "Both prefer doubles", "Both downtown Manhattan"].map((l) => (
                  <li key={l} className="border border-sand px-2.5 py-1 text-graphite">{l}</li>
                ))}
              </ul>
              <figcaption className="mt-4 text-[0.6875rem] uppercase tracking-[0.18em] text-stone">Illustrative example</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Sports */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="eyebrow">What members play</p>
            <h2 className="display mt-6 text-4xl sm:text-5xl">From the baseline to the bridle path.</h2>
            <p className="mt-6 max-w-sm text-muted-foreground">
              Each sport has its own levels and formats. New sports are added as the membership asks for them.
            </p>
          </div>
          <ul className="grid grid-cols-2 border-t border-border sm:grid-cols-3">
            {SPORTS.map((s, i) => (
              <li key={s} className="flex items-baseline gap-3 border-b border-border py-5 pr-4">
                <span className="text-[0.625rem] tabular-nums text-stone">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-2xl sm:text-3xl">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-ink text-paper">
        <div className="mx-auto grid max-w-7xl gap-16 px-5 py-24 sm:px-8 md:py-32 lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-8">
            <div>
              <p className="eyebrow !text-paper/50">Membership</p>
              <h2 className="display mt-6 text-4xl sm:text-5xl">What belonging includes.</h2>
            </div>
            <EditorialArt variant="pool" alt="A line study of lap lanes in a pool" className="hidden aspect-[4/5] border border-paper/10 lg:block" />
          </div>
          <div className="grid gap-x-12 gap-y-12 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title} className="border-t border-paper/15 pt-6">
                <h3 className="font-serif text-2xl">{b.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper/65">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Selective process + price */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 md:py-32">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Admissions</p>
            <h2 className="display mt-6 text-4xl sm:text-5xl">A selective, personal process.</h2>
            <ol className="mt-10 space-y-8">
              {[
                ["Apply", "Tell us how you play, when you're free, and why you'd like to join. It takes about five minutes."],
                ["Review", "Every application is read by a person. We admit gradually to keep the community balanced across sports and levels."],
                ["Decision", "You'll hear from us by email: approved, or placed on our waitlist while we grow."],
                ["Activate", "Approved members activate their membership and complete a short profile before meeting the community."],
              ].map(([t, b], i) => (
                <li key={t} className="grid grid-cols-[3rem_1fr] gap-4">
                  <span className="font-serif text-3xl text-steel">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.16em]">{t}</p>
                    <p className="mt-2 text-muted-foreground">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col justify-between border border-border bg-ivory p-8 sm:p-12">
            <div>
              <p className="eyebrow">One membership</p>
              <p className="mt-8 flex items-baseline gap-2">
                <span className="display text-8xl">${BRAND.priceMonthlyUsd}</span>
                <span className="text-sm uppercase tracking-[0.16em] text-stone">per month</span>
              </p>
              <p className="mt-6 max-w-sm text-muted-foreground">
                Billed monthly once you are approved. Cancel at any time from your account; no long-term commitment.
              </p>
            </div>
            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/apply">Apply for membership</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/membership">Membership details</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-linen">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 py-24 text-center sm:px-8 md:py-32">
          <p className="eyebrow">Applications are open</p>
          <h2 className="display mt-6 text-5xl sm:text-6xl">
            Play well. <em className="text-steel">Belong well.</em>
          </h2>
          <p className="mt-6 max-w-xl text-lg text-graphite/80">
            We are admitting a limited founding membership in Manhattan. If this sounds like your kind of room, we would like to
            hear from you.
          </p>
          <Button asChild size="lg" className="mt-10">
            <Link href="/apply">Apply for membership</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
