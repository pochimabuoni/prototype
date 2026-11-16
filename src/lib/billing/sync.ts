import "server-only";
import type Stripe from "stripe";
import type { AdminSupabase } from "@/lib/supabase/admin";
import { getStripe } from "./stripe";
import { mapStripeSubscription, subscriptionTransition, idOf } from "./subscription-mapping";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";
import { siteUrl } from "@/lib/env";

/** Resolve our user id for a Stripe subscription/customer. */
async function resolveUserId(admin: AdminSupabase, sub: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = sub.metadata?.user_id;
  if (fromMetadata) {
    const { data } = await admin.from("users").select("id").eq("id", fromMetadata).maybeSingle();
    if (data) return data.id;
  }
  const customerId = idOf(sub.customer);
  if (!customerId) return null;
  const { data } = await admin.from("users").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  return data?.id ?? null;
}

/**
 * Source of truth for entitlements. Always re-fetches the subscription from
 * Stripe (so out-of-order webhook delivery cannot regress state) and upserts
 * our row. Sends lifecycle emails on meaningful transitions.
 */
export async function syncSubscription(admin: AdminSupabase, subscriptionId: string) {
  const sub = await getStripe().subscriptions.retrieve(subscriptionId);
  const userId = await resolveUserId(admin, sub);
  if (!userId) {
    console.warn("[billing] subscription without matching user", sub.id);
    return;
  }

  const { data: existing } = await admin
    .from("subscriptions")
    .select("status, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  // A member has one membership. If an older subscription is replaced by a new
  // one, only a live subscription may overwrite a different existing row.
  if (existing && existing.stripe_subscription_id !== sub.id) {
    const incomingLive = ["active", "trialing", "past_due"].includes(sub.status);
    const existingLive = ["active", "trialing", "past_due"].includes(existing.status);
    if (!incomingLive && existingLive) return;
  }

  const row = { ...mapStripeSubscription(sub, userId), stripe_updated_at: new Date().toISOString() };
  const { error } = await admin.from("subscriptions").upsert(row, { onConflict: "user_id" });
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);

  await admin.from("users").update({ stripe_customer_id: row.stripe_customer_id }).eq("id", userId);

  const transition = subscriptionTransition(existing?.stripe_subscription_id === sub.id ? existing.status : null, row.status!);
  if (transition) await notify(admin, userId, transition);
}

async function notify(admin: AdminSupabase, userId: string, kind: "activated" | "canceled") {
  const [{ data: user }, { data: profile }, { data: app }] = await Promise.all([
    admin.from("users").select("email").eq("id", userId).single(),
    admin.from("member_profiles").select("first_name").eq("user_id", userId).maybeSingle(),
    admin.from("membership_applications").select("full_name").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
  ]);
  if (!user) return;
  const firstName = profile?.first_name ?? app?.[0]?.full_name.split(/\s+/)[0] ?? "there";
  const content =
    kind === "activated"
      ? emailTemplates.membershipActivated({ firstName, profileUrl: siteUrl("/onboarding") })
      : emailTemplates.subscriptionCanceled({ firstName, rejoinUrl: siteUrl("/onboarding") });
  await sendEmail(user.email, content);
}

export async function notifyPaymentFailed(admin: AdminSupabase, customerId: string) {
  const { data: user } = await admin.from("users").select("id, email").eq("stripe_customer_id", customerId).maybeSingle();
  if (!user) return;
  const { data: profile } = await admin.from("member_profiles").select("first_name").eq("user_id", user.id).maybeSingle();
  await sendEmail(
    user.email,
    emailTemplates.paymentFailed({ firstName: profile?.first_name ?? "there", billingUrl: siteUrl("/settings#billing") }),
  );
}

/** Subscription id referenced by an invoice (current and legacy API shapes). */
export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const fromParent = invoice.parent?.subscription_details?.subscription;
  if (fromParent) return idOf(fromParent);
  const legacy = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  return idOf(legacy ?? null);
}
