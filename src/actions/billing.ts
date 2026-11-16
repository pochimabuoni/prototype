"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/billing/stripe";
import { hasEntitlement } from "@/lib/auth/stage";
import { isStripeConfigured, serverEnv } from "@/lib/env.server";
import { rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/env";

/**
 * Starts Stripe Checkout for the $60/month membership. Only approved members
 * (role MEMBER) without a live subscription may start checkout. Access is
 * granted later, exclusively by the verified webhook — never by the redirect.
 */
export async function startCheckout() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?next=/onboarding");
  if (viewer.role !== "MEMBER" || viewer.accountStatus !== "ACTIVE") redirect("/application-status");
  if (hasEntitlement(viewer.subscription?.status ?? null, viewer.subscription?.current_period_end ?? null)) redirect("/onboarding");
  if (!isStripeConfigured()) redirect("/onboarding?billing=unconfigured");
  if (!(await rateLimit("checkout", viewer.id))) redirect("/onboarding?billing=rate-limited");

  const stripe = getStripe();
  const admin = createAdminClient();

  // Reuse or create the Stripe customer.
  const { data: user } = await admin.from("users").select("stripe_customer_id").eq("id", viewer.id).single();
  let customerId = user?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create(
      { email: viewer.email, metadata: { user_id: viewer.id } },
      { idempotencyKey: `customer-${viewer.id}` },
    );
    customerId = customer.id;
    await admin.from("users").update({ stripe_customer_id: customerId }).eq("id", viewer.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: viewer.id,
    line_items: [{ price: serverEnv.stripePriceId(), quantity: 1 }],
    subscription_data: { metadata: { user_id: viewer.id } },
    metadata: { user_id: viewer.id },
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    success_url: siteUrl("/onboarding?checkout=success"),
    cancel_url: siteUrl("/onboarding?checkout=cancelled"),
  });
  if (!session.url) redirect("/onboarding?billing=error");
  redirect(session.url);
}

/** Opens the Stripe customer portal (payment method, invoices, cancellation). */
export async function openBillingPortal() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?next=/settings");
  if (!isStripeConfigured()) redirect("/settings?billing=unconfigured");
  const admin = createAdminClient();
  const { data: user } = await admin.from("users").select("stripe_customer_id").eq("id", viewer.id).single();
  if (!user?.stripe_customer_id) redirect("/onboarding");
  const portal = await getStripe().billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: siteUrl("/settings"),
  });
  redirect(portal.url);
}
