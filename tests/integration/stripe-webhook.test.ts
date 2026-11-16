import { beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import type Stripe_ from "stripe";

/**
 * Integration tests for the Stripe webhook: real signature verification with
 * the Stripe SDK, the route handler, and the idempotent event processor with
 * an in-memory stand-in for the Supabase service-role client.
 */

// ---- In-memory admin client ------------------------------------------------
type Row = Record<string, unknown>;
function createFakeAdmin() {
  const tables: Record<string, Row[]> = { stripe_events: [], users: [], subscriptions: [] };
  const from = (table: string) => {
    const filters: [string, unknown][] = [];
    const api = {
      insert: async (row: Row) => {
        if (table === "stripe_events" && tables.stripe_events.some((r) => r.id === row.id)) {
          return { error: { code: "23505", message: "duplicate key" } };
        }
        tables[table]!.push(row);
        return { error: null };
      },
      delete: () => ({ eq: async (col: string, val: unknown) => { tables[table] = tables[table]!.filter((r) => r[col] !== val); return { error: null }; } }),
      update: () => {
        const chain = { eq: () => chain, is: () => chain, then: (res: (v: { error: null }) => void) => res({ error: null }) };
        return chain;
      },
      select: () => api,
      eq: (c: string, v: unknown) => { filters.push([c, v]); return api; },
    };
    return api;
  };
  return { tables, from };
}

const fakeAdmin = createFakeAdmin();
const sync = vi.fn(async () => {});
const paymentFailed = vi.fn(async () => {});

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fakeAdmin }));
vi.mock("@/lib/billing/sync", () => ({
  syncSubscription: (...args: unknown[]) => sync(...(args as [])),
  notifyPaymentFailed: (...args: unknown[]) => paymentFailed(...(args as [])),
  invoiceSubscriptionId: (inv: { parent?: { subscription_details?: { subscription?: string } } }) => inv.parent?.subscription_details?.subscription ?? null,
}));

const WEBHOOK_SECRET = "whsec_test_secret_for_unit_tests_only";
process.env.STRIPE_SECRET_KEY = "sk_test_placeholder_not_a_real_key";
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

const stripe = new Stripe("sk_test_placeholder_not_a_real_key");

function event(type: string, object: Record<string, unknown>, id = `evt_${Math.random().toString(36).slice(2)}`) {
  return { id, object: "event", type, api_version: "2026-10-28.endive", created: 1, livemode: false, pending_webhooks: 1, request: null, data: { object } };
}

async function post(body: string, signature?: string) {
  const { POST } = await import("@/app/api/stripe/webhook/route");
  const { NextRequest } = await import("next/server");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (signature) headers["stripe-signature"] = signature;
  return POST(new NextRequest("http://localhost/api/stripe/webhook", { method: "POST", body, headers }));
}

beforeEach(() => {
  fakeAdmin.tables.stripe_events = [];
  sync.mockReset();
  sync.mockImplementation(async () => {});
  paymentFailed.mockReset();
});

describe("POST /api/stripe/webhook", () => {
  it("rejects requests without a signature", async () => {
    const res = await post("{}");
    expect(res.status).toBe(400);
  });

  it("rejects forged signatures", async () => {
    const body = JSON.stringify(event("customer.subscription.updated", { id: "sub_1" }));
    const forged = stripe.webhooks.generateTestHeaderString({ payload: body, secret: "whsec_wrong" });
    const res = await post(body, forged);
    expect(res.status).toBe(400);
    expect(sync).not.toHaveBeenCalled();
  });

  it("rejects a tampered body even with a once-valid signature", async () => {
    const body = JSON.stringify(event("customer.subscription.updated", { id: "sub_1" }));
    const sig = stripe.webhooks.generateTestHeaderString({ payload: body, secret: WEBHOOK_SECRET });
    const res = await post(body.replace("sub_1", "sub_2"), sig);
    expect(res.status).toBe(400);
  });

  it("verifies, processes once, and ignores replays (idempotency)", async () => {
    const body = JSON.stringify(event("customer.subscription.updated", { id: "sub_123" }, "evt_fixed"));
    const sig = stripe.webhooks.generateTestHeaderString({ payload: body, secret: WEBHOOK_SECRET });
    const first = await post(body, sig);
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ result: "processed" });
    const second = await post(body, sig);
    expect(await second.json()).toMatchObject({ result: "duplicate" });
    expect(sync).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledWith(fakeAdmin, "sub_123");
  });

  it("returns 500 and releases the ledger so Stripe can retry after a failure", async () => {
    sync.mockRejectedValueOnce(new Error("db down"));
    const body = JSON.stringify(event("customer.subscription.deleted", { id: "sub_9" }, "evt_retry"));
    const sig = stripe.webhooks.generateTestHeaderString({ payload: body, secret: WEBHOOK_SECRET });
    expect((await post(body, sig)).status).toBe(500);
    expect(fakeAdmin.tables.stripe_events.find((e) => e.id === "evt_retry")).toBeUndefined();
    expect((await post(body, sig)).status).toBe(200);
  });
});

describe("processStripeEvent", () => {
  it("syncs the subscription created by Checkout", async () => {
    const { processStripeEvent } = await import("@/lib/billing/webhook");
    const ev = event("checkout.session.completed", { mode: "subscription", subscription: "sub_new", customer: "cus_1", client_reference_id: "user-1" });
    await processStripeEvent(ev as unknown as Stripe_.Event, { admin: fakeAdmin as never });
    expect(sync).toHaveBeenCalledWith(fakeAdmin, "sub_new");
  });

  it("handles failed payments: re-syncs status and emails the member", async () => {
    const { processStripeEvent } = await import("@/lib/billing/webhook");
    const ev = event("invoice.payment_failed", { customer: "cus_9", parent: { subscription_details: { subscription: "sub_9" } } });
    await processStripeEvent(ev as unknown as Stripe_.Event, { admin: fakeAdmin as never });
    expect(sync).toHaveBeenCalledWith(fakeAdmin, "sub_9");
    expect(paymentFailed).toHaveBeenCalledWith(fakeAdmin, "cus_9");
  });

  it("ignores unrelated event types without touching the ledger", async () => {
    const { processStripeEvent } = await import("@/lib/billing/webhook");
    const r = await processStripeEvent(event("charge.refunded", {}) as unknown as Stripe_.Event, { admin: fakeAdmin as never });
    expect(r).toBe("ignored");
    expect(fakeAdmin.tables.stripe_events).toHaveLength(0);
  });
});
