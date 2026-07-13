import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";

/** Create a Stripe Billing Portal session for the signed-in user (SPEC §6). */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  if (!env.STRIPE_SECRET_KEY) return new Response("Stripe is not configured", { status: 500 });

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { stripeCustomerId: true },
  });
  if (!sub?.stripeCustomerId) {
    return new Response("No billing account yet", { status: 400 });
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const portal = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${origin}/app/billing`,
  });

  return Response.json({ url: portal.url });
}
