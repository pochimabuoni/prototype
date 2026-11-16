import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Terms of Service (Draft)",
  description: "Draft terms of service for Pochi Ma Buoni, pending legal review.",
  alternates: { canonical: "/terms" },
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" updated="November 2026">
      <section>
        <h2>1. About these terms</h2>
        <p>
          These Terms govern your use of the Pochi Ma Buoni website and members&apos; platform (the &ldquo;Service&rdquo;), operated by
          [LEGAL ENTITY NAME], a [STATE] [ENTITY TYPE] (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By applying for or using a membership you
          agree to these Terms.
        </p>
      </section>
      <section>
        <h2>2. What the Service is — and is not</h2>
        <p>
          Pochi Ma Buoni is a private social network that helps approved members find and communicate with other members who
          wish to play sports together. We facilitate introductions and coordination only.
        </p>
        <ul>
          <li>We do not own, operate, manage, control or reserve any sports facility, court, field, pool, course or venue.</li>
          <li>Any venue suggested by a member is chosen by members independently. Bookings, fees and venue rules are solely between members and the venue operator.</li>
          <li>We do not provide coaching, refereeing, supervision, medical services or equipment.</li>
          <li>The Service is not a dating service.</li>
        </ul>
      </section>
      <section>
        <h2>3. Eligibility and admission</h2>
        <p>
          You must be at least 18 years old to apply. Membership is by application and is granted at our discretion. We may
          approve, decline or waitlist any application, and we are not obliged to give reasons. You must provide accurate
          information and keep it up to date.
        </p>
      </section>
      <section>
        <h2>4. Membership fees and billing</h2>
        <p>
          Membership costs US$60 per month (plus any applicable taxes), billed in advance on a recurring monthly basis through
          our payment processor, Stripe. We do not store your full card details. Your membership renews automatically until
          cancelled. You may cancel at any time through the billing portal; cancellation takes effect at the end of the current
          billing period. [REFUND POLICY TO BE CONFIRMED BY COUNSEL — e.g. fees are non-refundable except where required by law.]
          If a payment fails, access may be suspended after a short grace period until payment is completed.
        </p>
      </section>
      <section>
        <h2>5. Assumption of risk and personal responsibility</h2>
        <p>
          Sports and physical activity carry inherent risks, including the risk of serious injury, illness or death. You
          participate in any activity arranged with other members voluntarily and at your own risk. You are responsible for
          assessing your own fitness and health, using appropriate equipment, and following venue rules and applicable law.
          [ASSUMPTION OF RISK AND RELEASE LANGUAGE TO BE FINALISED BY COUNSEL FOR NEW YORK LAW.]
        </p>
      </section>
      <section>
        <h2>6. Meeting other members safely</h2>
        <p>
          We review applications but we do not conduct criminal background checks [UNLESS OTHERWISE DECIDED], and we cannot
          guarantee the identity, conduct or skill of any member. Meet in public venues, tell someone where you are going, and
          use the in-app block and report tools if anything concerns you. In an emergency, contact 911.
        </p>
      </section>
      <section>
        <h2>7. Member conduct</h2>
        <ul>
          <li>Treat other members with courtesy and respect, on and off the court.</li>
          <li>No harassment, discrimination, threats, solicitation, spam or commercial promotion.</li>
          <li>Do not share another member&apos;s information outside the Service without their consent.</li>
          <li>Do not misrepresent your identity, age, or level of play.</li>
          <li>Honour invitations you accept, or cancel with reasonable notice.</li>
        </ul>
        <p>We may suspend or terminate memberships that breach these Terms, with or without notice where appropriate.</p>
      </section>
      <section>
        <h2>8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for any injury, loss or damage arising from activities
          arranged between members, from the condition or operation of any third-party venue, or from the conduct of any member.
          [LIABILITY CAP, EXCLUSIONS AND INDEMNITY LANGUAGE TO BE DRAFTED BY COUNSEL.]
        </p>
      </section>
      <section>
        <h2>9. Termination and account deletion</h2>
        <p>You may delete your account at any time from your settings. Deletion cancels any active subscription and removes your profile from the community.</p>
      </section>
      <section>
        <h2>10. Governing law and disputes</h2>
        <p>[GOVERNING LAW, VENUE AND DISPUTE RESOLUTION PROVISIONS TO BE PROVIDED BY COUNSEL.]</p>
      </section>
      <section>
        <h2>11. Contact</h2>
        <p>Questions about these Terms: [LEGAL CONTACT EMAIL] · [REGISTERED ADDRESS].</p>
      </section>
    </LegalDocument>
  );
}
