import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PageIntro } from "@/components/site/page-intro";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/domain/constants";

export const metadata: Metadata = {
  title: "Membership",
  description: `One membership, $${BRAND.priceMonthlyUsd} per month. What it includes and how billing works.`,
  alternates: { canonical: "/membership" },
};

const INCLUDED = [
  "Curated member suggestions for every sport you play",
  "Explainable compatibility scores and filters by sport, level, neighbourhood and availability",
  "Private requests to connect and member-to-member messaging",
  "Invitations to play with date, time and venue suggestions",
  "Profile visibility controls, blocking and reporting",
  "Invitations to occasional members' sessions and socials",
];

const FAQ = [
  { q: "Who can apply?", a: "Adults aged 18 and over who live, work or regularly play in New York City. Membership is reviewed individually." },
  { q: "When am I charged?", a: "Only after your application is approved and you choose to activate your membership. Billing is monthly through Stripe." },
  { q: "Can I cancel?", a: "Yes, at any time from your account settings. Your membership remains active until the end of the current billing period." },
  { q: "Does membership include court time?", a: "No. Pochi Ma Buoni does not own or book venues. Members arrange play — and any venue fees — directly." },
  { q: "What if a payment fails?", a: "We'll email you and Stripe will retry automatically. Access is paused if the payment can't be completed after a short grace period." },
];

export default function MembershipPage() {
  return (
    <>
      <PageIntro
        eyebrow="Membership"
        title="One membership. Thoughtfully priced."
        lede={<p>A single tier, so that every member has the same experience of the community.</p>}
      />
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col border border-ink bg-ink p-8 text-paper sm:p-12">
          <p className="eyebrow !text-paper/50">Member</p>
          <p className="mt-8 flex items-baseline gap-2">
            <span className="display text-8xl">${BRAND.priceMonthlyUsd}</span>
            <span className="text-sm uppercase tracking-[0.16em] text-paper/60">USD / month</span>
          </p>
          <p className="mt-6 text-paper/65">Billed monthly after approval. Cancel any time.</p>
          <Button asChild size="lg" variant="inverse" className="mt-12 self-start">
            <Link href="/apply">Apply for membership</Link>
          </Button>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-4 py-5">
              <Check aria-hidden className="mt-1 size-4 shrink-0 text-gold" />
              <span className="text-lg">{item}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="border-t border-border bg-ivory">
        <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
          <h2 className="display text-4xl">Questions</h2>
          <dl className="mt-10 divide-y divide-border border-y border-border">
            {FAQ.map((f) => (
              <div key={f.q} className="grid gap-2 py-6 md:grid-cols-[1fr_1.6fr] md:gap-8">
                <dt className="font-serif text-xl">{f.q}</dt>
                <dd className="text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
