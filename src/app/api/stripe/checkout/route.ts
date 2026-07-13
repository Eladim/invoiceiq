import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";

const bodySchema = z.object({ interval: z.enum(["monthly", "yearly"]) });

/** Create a Stripe Checkout Session for the Pro plan (SPEC §6). */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_MONTHLY || !env.STRIPE_PRICE_YEARLY) {
    return new Response("Stripe is not configured", { status: 500 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Invalid request", { status: 400 });

  const price =
    parsed.data.interval === "yearly" ? env.STRIPE_PRICE_YEARLY : env.STRIPE_PRICE_MONTHLY;

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;

  // Reuse an existing Stripe customer so we don't create duplicates.
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { stripeCustomerId: true },
  });

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    // client_reference_id + metadata carry the app user id into webhooks (SPEC §6).
    client_reference_id: userId,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
    ...(existing?.stripeCustomerId
      ? { customer: existing.stripeCustomerId }
      : { customer_email: email }),
    allow_promotion_codes: true,
    success_url: `${origin}/app/billing?success=true`,
    cancel_url: `${origin}/pricing`,
  });

  return Response.json({ url: session.url });
}
