import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env.server";

let stripe: Stripe | null = null;

/** Lazily constructed Stripe client (API version pinned by the SDK). */
export function getStripe(): Stripe {
  stripe ??= new Stripe(serverEnv.stripeSecretKey(), {
    appInfo: { name: "pochi-ma-buoni" },
    maxNetworkRetries: 2,
  });
  return stripe;
}
