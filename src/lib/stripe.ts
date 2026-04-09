import "server-only";

import Stripe from "stripe";

import { env } from "@/lib/env";

declare global {
  var __kenmatchStripe: Stripe | undefined;
}

export function stripeEnabled() {
  return Boolean(env.STRIPE_SECRET_KEY && env.KENMATCH_PUBLIC_ORIGIN);
}

export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured for this deployment.");
  }

  if (!globalThis.__kenmatchStripe) {
    globalThis.__kenmatchStripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
  }

  return globalThis.__kenmatchStripe;
}
