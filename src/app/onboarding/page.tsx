import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { requireViewer } from "@/lib/auth/viewer";
import { AppMain } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PendingActivation } from "@/components/app/pending-activation";
import { ProfileForm } from "@/components/profile/profile-form";
import { startCheckout, openBillingPortal } from "@/actions/billing";
import { getActiveSports } from "@/lib/data/sports";
import { loadProfileFormValues } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/domain/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Activate your membership", robots: { index: false } };

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const viewer = await requireViewer("/onboarding");
  const params = await searchParams;

  if (viewer.stage === "ACTIVE") redirect("/home");
  if (viewer.stage === "ADMIN") redirect("/admin");
  if (viewer.stage === "SUSPENDED") redirect("/suspended");
  if (!["AWAITING_PAYMENT", "PAYMENT_ISSUE", "PROFILE_INCOMPLETE"].includes(viewer.stage)) redirect("/application-status");

  const paid = viewer.stage === "PROFILE_INCOMPLETE";
  const steps = [
    { label: "Application approved", done: true },
    { label: "Account created", done: true },
    { label: "Membership activated", done: paid },
    { label: "Profile completed", done: false },
  ];

  return (
    <AppMain className="max-w-5xl">
      <p className="eyebrow">Welcome</p>
      <h1 className="display mt-4 text-5xl sm:text-6xl">{paid ? "One last step." : "Activate your membership."}</h1>
      <ol className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.label} className={cn("flex items-center gap-3 bg-paper p-4 text-sm", !s.done && i === steps.findIndex((x) => !x.done) && "bg-ivory")}>
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border text-xs", s.done ? "border-ink bg-ink text-paper" : "border-sand")}>
              {s.done ? <Check className="size-3" /> : i + 1}
            </span>
            {s.label}
          </li>
        ))}
      </ol>

      <div className="mt-12">
        {paid ? (
          <ProfileStep userId={viewer.id} />
        ) : params.checkout === "success" ? (
          <PendingActivation />
        ) : (
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4 text-lg text-graphite/85">
              {viewer.stage === "PAYMENT_ISSUE" ? (
                <Alert variant="destructive">
                  There&apos;s a problem with your latest membership payment. Please update your payment method to restore access.
                </Alert>
              ) : null}
              {params.checkout === "cancelled" ? <Alert>Checkout was cancelled — you haven&apos;t been charged.</Alert> : null}
              {params.billing === "unconfigured" ? (
                <Alert variant="destructive">Billing is not configured in this environment (missing Stripe keys).</Alert>
              ) : null}
              {params.billing === "rate-limited" ? <Alert variant="destructive">Too many attempts. Please try again later.</Alert> : null}
              <p>
                Membership is ${BRAND.priceMonthlyUsd} per month, billed securely by Stripe. You can cancel at any time from your
                account settings.
              </p>
              <p className="text-base text-muted-foreground">
                Your access begins as soon as Stripe confirms the subscription with us — usually within seconds.
              </p>
            </div>
            <div className="flex flex-col gap-6 border border-ink bg-ink p-8 text-paper">
              <p className="eyebrow !text-paper/50">Membership</p>
              <p className="flex items-baseline gap-2">
                <span className="display text-7xl">${BRAND.priceMonthlyUsd}</span>
                <span className="text-xs uppercase tracking-[0.16em] text-paper/60">/ month</span>
              </p>
              {viewer.stage === "PAYMENT_ISSUE" ? (
                <form action={openBillingPortal}>
                  <Button type="submit" variant="inverse" size="lg" className="w-full">Update payment method</Button>
                </form>
              ) : (
                <form action={startCheckout}>
                  <Button type="submit" variant="inverse" size="lg" className="w-full">Activate membership</Button>
                </form>
              )}
              <p className="text-xs text-paper/50">You&apos;ll be redirected to Stripe&apos;s secure checkout. We never see or store card details.</p>
            </div>
          </div>
        )}
      </div>
    </AppMain>
  );
}

async function ProfileStep({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [sports, initial] = await Promise.all([getActiveSports(), loadProfileFormValues(supabase, userId)]);
  return (
    <div>
      <p className="mb-10 max-w-2xl text-lg text-graphite/80">
        Your membership is active. Confirm how you&apos;d like to appear to other members — we&apos;ve started from your
        application.
      </p>
      <ProfileForm sports={sports} initial={initial} submitLabel="Complete profile & enter" redirectTo="/home" />
    </div>
  );
}
