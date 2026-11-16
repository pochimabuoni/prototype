"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Shown after returning from Stripe Checkout. We do NOT trust the redirect;
 * we poll the server until the verified webhook has activated the membership.
 */
export function PendingActivation() {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  useEffect(() => {
    if (attempts >= 20) return;
    const t = setTimeout(() => {
      setAttempts((a) => a + 1);
      router.refresh();
    }, 3000);
    return () => clearTimeout(t);
  }, [attempts, router]);
  return (
    <div role="status" aria-live="polite" className="border border-border bg-ivory p-6">
      <p className="font-serif text-2xl">Confirming your payment…</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {attempts < 20
          ? "Stripe is confirming your subscription. This usually takes a few seconds."
          : "This is taking longer than usual. You'll receive an email as soon as your membership is active — you can safely leave this page."}
      </p>
    </div>
  );
}
