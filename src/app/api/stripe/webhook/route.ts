import type Stripe from "stripe";

import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { syncStripeEvent } from "@/server/stripe/sync";

/**
 * Stripe webhook (SPEC §6). Verifies the signature with STRIPE_WEBHOOK_SECRET,
 * then syncs subscription state to the DB. Stripe is the source of truth for
 * the DB; the DB is the source of truth for the UI.
 */
export async function POST(req: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Webhook is not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await syncStripeEvent(event);
  } catch (err) {
    console.error(`Stripe webhook handler error (${event.type}):`, err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
