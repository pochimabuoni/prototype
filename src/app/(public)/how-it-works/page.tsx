import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site/page-intro";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How It Works",
  description: "From application to your first game: how Pochi Ma Buoni introduces compatible members.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS = [
  { title: "Apply", body: "Share the sports you play and at what level, the neighbourhood you're based in, the hours you're usually free, and a little about yourself." },
  { title: "Admission", body: "Our team reviews each application personally. Approved applicants receive an email invitation; others may be placed on the waitlist as the community grows." },
  { title: "Activate", body: "Sign in with your email, activate the $60 monthly membership through secure Stripe checkout, and complete your member profile." },
  { title: "Discover", body: "Browse members suggested for each of your sports. Every suggestion shows a compatibility score and the plain-language reasons behind it." },
  { title: "Connect", body: "Send a short request to connect. Once accepted, you can message privately within Pochi Ma Buoni — no phone numbers needed." },
  { title: "Play", body: "Invite a member to play: propose a sport, date, time and a general venue. You make the booking yourselves wherever you prefer to play." },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="How it works"
        title="From application to first serve."
        lede={<p>Pochi Ma Buoni handles introductions and coordination. The playing — and the choice of venue — is yours.</p>}
      />
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <ol className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-4 bg-paper p-8 sm:p-10">
              <span className="font-serif text-5xl text-gold">{i + 1}</span>
              <h2 className="font-serif text-3xl">{s.title}</h2>
              <p className="leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="border-y border-border bg-ivory">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 md:grid-cols-2">
          <div>
            <p className="eyebrow">The compatibility score</p>
            <h2 className="display mt-6 text-4xl">Transparent by design.</h2>
          </div>
          <div className="space-y-5 leading-relaxed text-graphite/85">
            <p>
              Two members are only ever suggested to one another if they share a sport. We then weigh how much your weekly
              availability overlaps (35%), how close your levels are (30%), how near your neighbourhoods sit (20%), and whether
              you enjoy the same formats (15%).
            </p>
            <p>
              If someone hasn&apos;t told us something — say, their preferred formats — we don&apos;t penalise them. We score what we
              know and tell you exactly what that was.
            </p>
            <p className="text-sm text-muted-foreground">
              We never use or reveal exact addresses. Location is matched at neighbourhood level only.
            </p>
          </div>
        </div>
      </section>
      <section className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-5 py-20 sm:px-8">
        <p className="max-w-xl text-muted-foreground">
          A note on venues: Pochi Ma Buoni does not own, operate or reserve any sports facility. Members arrange play at
          independent public and private venues and are responsible for any bookings and fees.
        </p>
        <Button asChild size="lg">
          <Link href="/apply">Begin your application</Link>
        </Button>
      </section>
    </>
  );
}
