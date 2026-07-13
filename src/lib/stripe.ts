import Stripe from "stripe";

import { env } from "@/lib/env";

let client: Stripe | null = null;

/** Lazily-constructed Stripe client. Throws if the secret key isn't set. */
export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  client ??= new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });
  return client;
}
