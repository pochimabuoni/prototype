import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/auth/viewer";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MemberStage } from "@/lib/auth/stage";

export const metadata: Metadata = {
  title: "Application Status",
  description: "Check the status of your Pochi Ma Buoni membership application.",
  alternates: { canonical: "/application-status" },
};

const COPY: Partial<Record<MemberStage, { badge: string; title: string; body: string; variant: "outline" | "gold" | "success" | "muted" }>> = {
  NO_APPLICATION: {
    badge: "No application",
    title: "We don't have an application for this email yet.",
    body: "If you applied with a different address, sign in with that one instead. Otherwise, you're welcome to apply.",
    variant: "muted",
  },
  APPLICATION_PENDING: {
    badge: "Under review",
    title: "Your application is with our membership team.",
    body: "Every application is read personally. We'll email you as soon as a decision has been made — there's nothing more you need to do.",
    variant: "outline",
  },
  APPLICATION_WAITLISTED: {
    badge: "Waitlisted",
    title: "You're on our waitlist.",
    body: "We admit members in small groups to keep the community balanced. Your application remains on file and we'll be in touch as places open.",
    variant: "gold",
  },
  APPLICATION_REJECTED: {
    badge: "Not admitted",
    title: "We're unable to offer membership at this time.",
    body: "Thank you for applying. Our community is deliberately small and these decisions are never easy.",
    variant: "muted",
  },
};

export default async function ApplicationStatusPage() {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <section className="mx-auto grid max-w-7xl gap-16 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-28">
        <div>
          <p className="eyebrow">Application status</p>
          <h1 className="display mt-6 text-5xl sm:text-6xl">Where things stand.</h1>
          <p className="mt-6 max-w-md text-lg text-graphite/80">
            To protect your privacy, application status is only shown after you confirm your email. Enter the address you
            applied with and we&apos;ll send you a secure link.
          </p>
        </div>
        <div className="border border-border bg-card p-8 sm:p-10">
          <SignInForm next="/application-status" submitLabel="Send me a secure link" />
        </div>
      </section>
    );
  }

  const memberStages: MemberStage[] = ["AWAITING_PAYMENT", "PAYMENT_ISSUE", "PROFILE_INCOMPLETE", "ACTIVE", "ADMIN"];
  const isApproved = memberStages.includes(viewer.stage);
  const copy = COPY[viewer.stage];

  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <p className="eyebrow">Application status</p>
      {viewer.application ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Submitted {new Date(viewer.application.created_at).toLocaleDateString("en-US", { dateStyle: "long" })} · {viewer.email}
        </p>
      ) : null}
      <div className="mt-10 border border-border bg-card p-8 sm:p-12">
        {isApproved ? (
          <>
            <Badge variant="success">Approved</Badge>
            <h1 className="display mt-6 text-4xl sm:text-5xl">Welcome to Pochi Ma Buoni.</h1>
            <p className="mt-6 text-lg text-graphite/80">
              {viewer.stage === "ACTIVE" || viewer.stage === "ADMIN"
                ? "Your membership is active."
                : "Your application has been approved. Activate your membership to join the community."}
            </p>
            <Button asChild size="lg" className="mt-10">
              <Link href={viewer.stage === "ACTIVE" ? "/home" : viewer.stage === "ADMIN" ? "/admin" : "/onboarding"}>
                {viewer.stage === "ACTIVE" || viewer.stage === "ADMIN" ? "Enter the club" : "Continue to activation"}
              </Link>
            </Button>
          </>
        ) : copy ? (
          <>
            <Badge variant={copy.variant}>{copy.badge}</Badge>
            <h1 className="display mt-6 text-4xl sm:text-5xl">{copy.title}</h1>
            <p className="mt-6 text-lg text-graphite/80">{copy.body}</p>
            {viewer.stage === "NO_APPLICATION" ? (
              <Button asChild size="lg" className="mt-10">
                <Link href="/apply">Apply for membership</Link>
              </Button>
            ) : null}
          </>
        ) : (
          <p className="text-lg">Your account is currently suspended. Please contact the membership team.</p>
        )}
      </div>
    </section>
  );
}
