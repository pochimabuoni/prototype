import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { processStripeEvent } from "@/lib/billing/webhook";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook endpoint. The ONLY path by which membership entitlements are
 * granted or revoked. Signature verification uses the raw request body.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const payload = await request.text();
  let event;
  try {
    event = await getStripe().webhooks.constructEventAsync(payload, signature, serverEnv.stripeWebhookSecret());
  } catch (e) {
    console.warn("[stripe-webhook] signature verification failed", (e as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const result = await processStripeEvent(event, { admin: createAdminClient() });
    return NextResponse.json({ received: true, result });
  } catch (e) {
    console.error("[stripe-webhook] processing failed", event.type, event.id, e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
