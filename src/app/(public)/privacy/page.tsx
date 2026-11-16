import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy (Draft)",
  description: "Draft privacy policy for Pochi Ma Buoni, pending legal review.",
  alternates: { canonical: "/privacy" },
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" updated="November 2026">
      <section>
        <h2>1. Who we are</h2>
        <p>
          This policy explains how [LEGAL ENTITY NAME] (&ldquo;Pochi Ma Buoni&rdquo;) collects and uses personal information when you
          apply for or use our membership platform.
        </p>
      </section>
      <section>
        <h2>2. Information we collect</h2>
        <ul>
          <li><strong>Application details:</strong> name, email, date of birth, NYC neighbourhood, optional occupation or university, sports and levels, general weekly availability, introduction and motivation, optional referral code and photograph.</li>
          <li><strong>Member profile:</strong> display name, photograph, biography, neighbourhood, sports, levels, formats, availability and visibility preferences.</li>
          <li><strong>Activity:</strong> connection requests, invitations, messages, blocks and reports you make.</li>
          <li><strong>Billing:</strong> subscription status and Stripe customer identifiers. Card details are handled by Stripe and never stored by us.</li>
          <li><strong>Technical:</strong> sign-in records, IP address used for security and rate limiting, and essential cookies for authentication.</li>
        </ul>
      </section>
      <section>
        <h2>3. Location</h2>
        <p>
          We ask only for a neighbourhood, never an address, and we do not collect device GPS location. Other members see your
          neighbourhood only. Venue suggestions in invitations are free text that you choose to share with one member.
        </p>
      </section>
      <section>
        <h2>4. How we use information</h2>
        <ul>
          <li>To review applications and administer memberships.</li>
          <li>To suggest compatible members using a transparent scoring method based on sport, level, availability, neighbourhood and format.</li>
          <li>To deliver messages and invitations between members.</li>
          <li>To process payments and send transactional emails.</li>
          <li>To keep the community safe, investigate reports, and enforce our Terms.</li>
        </ul>
        <p>We do not sell personal information. [CONFIRM ANY ANALYTICS / MARKETING USE WITH COUNSEL.]</p>
      </section>
      <section>
        <h2>5. Who can see your information</h2>
        <p>
          Your email address and date of birth are never shown to other members. Profiles are visible only to active members,
          and you can restrict yours to connections or hide it entirely. Administrators may access account information to
          operate and safeguard the Service; administrative actions are logged.
        </p>
      </section>
      <section>
        <h2>6. Service providers</h2>
        <p>We use Supabase (database, authentication and storage), Stripe (payments), Resend (email) and Vercel (hosting). [CONFIRM DATA PROCESSING AGREEMENTS AND DATA LOCATIONS.]</p>
      </section>
      <section>
        <h2>7. Your choices and rights</h2>
        <ul>
          <li>Edit your profile and visibility at any time.</li>
          <li>Download a copy of your data from account settings.</li>
          <li>Delete your account from account settings; this cancels your subscription and removes your profile.</li>
          <li>[STATE-SPECIFIC RIGHTS, E.G. UNDER NEW YORK OR OTHER APPLICABLE LAW, TO BE CONFIRMED BY COUNSEL.]</li>
        </ul>
      </section>
      <section>
        <h2>8. Retention</h2>
        <p>[RETENTION PERIODS FOR DECLINED APPLICATIONS, DELETED ACCOUNTS, MESSAGES, REPORTS AND AUDIT LOGS TO BE CONFIRMED.]</p>
      </section>
      <section>
        <h2>9. Security</h2>
        <p>We use access controls at the database level, encrypted connections, private file storage with time-limited links, and audit logs for administrative actions. No system is perfectly secure.</p>
      </section>
      <section>
        <h2>10. Contact</h2>
        <p>Privacy questions: [PRIVACY CONTACT EMAIL].</p>
      </section>
    </LegalDocument>
  );
}
