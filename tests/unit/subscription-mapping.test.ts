import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { mapStripeSubscription, subscriptionTransition } from "@/lib/billing/subscription-mapping";

const sub = (overrides: Partial<Stripe.Subscription> = {}) =>
  ({
    id: "sub_1",
    customer: "cus_1",
    status: "active",
    currency: "usd",
    cancel_at_period_end: false,
    cancel_at: null,
    canceled_at: null,
    ended_at: null,
    items: { data: [{ current_period_end: 1_800_000_000, price: { id: "price_1", unit_amount: 6000, currency: "usd" } }] },
    ...overrides,
  }) as unknown as Stripe.Subscription;

describe("mapStripeSubscription", () => {
  it("maps Stripe fields to our row", () => {
    const row = mapStripeSubscription(sub(), "user-1");
    expect(row).toMatchObject({
      user_id: "user-1",
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_1",
      stripe_price_id: "price_1",
      status: "active",
      unit_amount: 6000,
      cancel_at_period_end: false,
    });
    expect(row.current_period_end).toBe(new Date(1_800_000_000 * 1000).toISOString());
  });
  it("treats a scheduled cancel_at as cancelling at period end", () => {
    expect(mapStripeSubscription(sub({ cancel_at: 1_900_000_000 }), "u").cancel_at_period_end).toBe(true);
  });
  it("accepts expanded customer objects", () => {
    expect(mapStripeSubscription(sub({ customer: { id: "cus_x" } as Stripe.Customer }), "u").stripe_customer_id).toBe("cus_x");
  });
});

describe("subscriptionTransition", () => {
  it("detects activation and cancellation, ignores recovery from past_due", () => {
    expect(subscriptionTransition(null, "active")).toBe("activated");
    expect(subscriptionTransition("incomplete", "active")).toBe("activated");
    expect(subscriptionTransition("past_due", "active")).toBeNull();
    expect(subscriptionTransition("active", "canceled")).toBe("canceled");
    expect(subscriptionTransition("canceled", "canceled")).toBeNull();
    expect(subscriptionTransition("active", "active")).toBeNull();
  });
});
