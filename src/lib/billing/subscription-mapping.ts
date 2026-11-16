import type Stripe from "stripe";
import type { TablesInsert, Enums } from "@/types/database";

const KNOWN_STATUSES: readonly Enums<"subscription_status">[] = [
  "incomplete", "incomplete_expired", "trialing", "active", "past_due", "canceled", "unpaid", "paused",
];

const ts = (secs: number | null | undefined) => (secs ? new Date(secs * 1000).toISOString() : null);

export function idOf(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

/**
 * Pure mapping from a Stripe Subscription to our `subscriptions` row.
 * Period end lives on subscription items in current API versions.
 */
export function mapStripeSubscription(sub: Stripe.Subscription, userId: string): TablesInsert<"subscriptions"> {
  const item = sub.items?.data?.[0];
  const status = (KNOWN_STATUSES as readonly string[]).includes(sub.status)
    ? (sub.status as Enums<"subscription_status">)
    : "incomplete";
  const periodEnds = (sub.items?.data ?? []).map((i) => i.current_period_end).filter(Boolean);
  return {
    user_id: userId,
    stripe_customer_id: idOf(sub.customer)!,
    stripe_subscription_id: sub.id,
    stripe_price_id: item?.price?.id ?? null,
    status,
    unit_amount: item?.price?.unit_amount ?? null,
    currency: item?.price?.currency ?? sub.currency ?? "usd",
    current_period_end: ts(periodEnds.length ? Math.min(...periodEnds) : null),
    cancel_at_period_end: sub.cancel_at_period_end || Boolean(sub.cancel_at),
    canceled_at: ts(sub.canceled_at),
    ended_at: ts(sub.ended_at),
  };
}

/** Status transitions that warrant member-facing emails. */
export function subscriptionTransition(
  previous: Enums<"subscription_status"> | null,
  next: Enums<"subscription_status">,
): "activated" | "canceled" | null {
  const live = (s: string | null) => s === "active" || s === "trialing";
  if (!live(previous) && live(next) && previous !== "past_due") return "activated";
  if (previous !== "canceled" && next === "canceled") return "canceled";
  return null;
}
