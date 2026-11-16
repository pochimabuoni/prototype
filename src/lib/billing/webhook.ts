import "server-only";
import type Stripe from "stripe";
import type { AdminSupabase } from "@/lib/supabase/admin";
import { syncSubscription, notifyPaymentFailed, invoiceSubscriptionId } from "./sync";
import { idOf } from "./subscription-mapping";

export const HANDLED_EVENTS = new Set<string>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.paid",
  "invoice.payment_failed",
]);

export interface WebhookDeps {
  admin: AdminSupabase;
  sync?: typeof syncSubscription;
  paymentFailed?: typeof notifyPaymentFailed;
}

/**
 * Processes a VERIFIED Stripe event exactly once.
 * Returns "duplicate" when the event id was already processed.
 */
export async function processStripeEvent(event: Stripe.Event, deps: WebhookDeps): Promise<"processed" | "ignored" | "duplicate"> {
  const { admin } = deps;
  const sync = deps.sync ?? syncSubscription;
  const paymentFailed = deps.paymentFailed ?? notifyPaymentFailed;

  if (!HANDLED_EVENTS.has(event.type)) return "ignored";

  // Idempotency ledger: the primary key rejects replays.
  const { error: ledgerError } = await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  if (ledgerError) {
    if (ledgerError.code === "23505") return "duplicate";
    throw new Error(`stripe_events insert failed: ${ledgerError.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const userId = session.client_reference_id ?? session.metadata?.user_id;
          const customerId = idOf(session.customer);
          if (userId && customerId) {
            await admin.from("users").update({ stripe_customer_id: customerId }).eq("id", userId).is("stripe_customer_id", null);
          }
          await sync(admin, idOf(session.subscription)!);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        const sub = event.data.object as Stripe.Subscription;
        await sync(admin, sub.id);
        break;
      }
      case "invoice.paid": {
        const subId = invoiceSubscriptionId(event.data.object as Stripe.Invoice);
        if (subId) await sync(admin, subId);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoiceSubscriptionId(invoice);
        if (subId) await sync(admin, subId);
        const customerId = idOf(invoice.customer);
        if (customerId) await paymentFailed(admin, customerId);
        break;
      }
    }
    return "processed";
  } catch (e) {
    // Release the ledger entry so Stripe's retry can process the event again.
    await admin.from("stripe_events").delete().eq("id", event.id);
    throw e;
  }
}
