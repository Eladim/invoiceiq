import "server-only";

import type Stripe from "stripe";
import { eq } from "drizzle-orm";

import { sendWelcomeEmail } from "@/lib/email";
import { getStripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { subscriptions, users } from "@/server/db/schema";

type Plan = "free" | "pro";
type SubStatus = "active" | "past_due" | "canceled" | "trialing";

function mapStatus(status: Stripe.Subscription.Status): SubStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    default:
      // canceled, incomplete, incomplete_expired, paused
      return "canceled";
  }
}

// Past-due keeps Pro access (grace period); only a canceled sub drops to free.
const planForStatus = (status: SubStatus): Plan => (status === "canceled" ? "free" : "pro");

function periodEnd(sub: Stripe.Subscription): Date | null {
  const end = sub.items.data[0]?.current_period_end;
  return end ? new Date(end * 1000) : null;
}

const customerId = (sub: Stripe.Subscription): string =>
  typeof sub.customer === "string" ? sub.customer : sub.customer.id;

/**
 * Ensure a `users` row exists so the subscription FK holds even when the Clerk
 * `user.created` webhook hasn't synced yet (common in local dev, or if that
 * webhook lags in production). Never clobbers an existing row.
 */
async function ensureUser(
  userId: string,
  email: string | null,
  name: string | null,
): Promise<void> {
  await db
    .insert(users)
    .values({ id: userId, email: email ?? `${userId}@users.invoiceiq.app`, name })
    .onConflictDoNothing({ target: users.id });
}

/** Idempotent upsert of the user's subscription row from a Stripe subscription. */
async function upsertFromSubscription(userId: string, sub: Stripe.Subscription): Promise<void> {
  // If the user no longer exists (e.g. account deleted while Stripe was still
  // sending events), there's nothing to sync — skip instead of FK-erroring.
  const exists = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true },
  });
  if (!exists) return;

  const status = mapStatus(sub.status);
  const row = {
    userId,
    stripeCustomerId: customerId(sub),
    stripeSubscriptionId: sub.id,
    plan: planForStatus(status),
    status,
    currentPeriodEnd: periodEnd(sub),
  };
  await db
    .insert(subscriptions)
    .values(row)
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: row.stripeCustomerId,
        stripeSubscriptionId: row.stripeSubscriptionId,
        plan: row.plan,
        status: row.status,
        currentPeriodEnd: row.currentPeriodEnd,
      },
    });
}

/**
 * Sync a verified Stripe event into the subscriptions table (SPEC §6).
 * Handlers are idempotent — replaying the same event yields the same DB state.
 */
export async function syncStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id ?? session.metadata?.userId;
      const subId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!userId || !subId) return;

      // Create the user row up front (Stripe collects name+email at checkout) so
      // the subscription insert can't FK-fail if Clerk hasn't synced the user.
      await ensureUser(
        userId,
        session.customer_details?.email ?? session.customer_email ?? null,
        session.customer_details?.name ?? null,
      );

      // Detect the free→pro transition so a webhook replay doesn't re-send.
      const prior = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
        columns: { plan: true },
      });

      const sub = await getStripe().subscriptions.retrieve(subId);
      await upsertFromSubscription(userId, sub);

      if (prior?.plan !== "pro" && planForStatus(mapStatus(sub.status)) === "pro") {
        await sendWelcomeEmail({
          to: session.customer_details?.email ?? session.customer_email ?? "",
          name: session.customer_details?.name ?? null,
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const userId = sub.metadata?.userId;
      if (!userId) return;
      await upsertFromSubscription(userId, sub);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const details = invoice.parent?.subscription_details;
      const subId = details
        ? typeof details.subscription === "string"
          ? details.subscription
          : details.subscription?.id
        : undefined;
      if (!subId) return;
      await db
        .update(subscriptions)
        .set({ status: "past_due" })
        .where(eq(subscriptions.stripeSubscriptionId, subId));
      break;
    }

    default:
      break;
  }
}
