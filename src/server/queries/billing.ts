import "server-only";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { FREE_DOCUMENT_LIMIT } from "@/lib/constants";
import { getStripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { subscriptions, usageCounters } from "@/server/db/schema";

export type BillingPaymentMethod = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export type BillingInvoice = {
  id: string;
  created: number;
  description: string;
  amount: number; // cents
  currency: string;
  status: string;
  pdfUrl: string | null;
};

export type BillingData = {
  plan: "free" | "pro";
  status: "active" | "past_due" | "canceled" | "trialing" | null;
  used: number;
  limit: number | null;
  resetDate: string; // ISO — first day of next month
  currentPeriodEnd: string | null; // ISO
  price: { amount: number; currency: string; interval: string } | null;
  paymentMethod: BillingPaymentMethod | null;
  invoices: BillingInvoice[];
};

function currentPeriod(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function firstOfNextMonth(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString();
}

/** Everything the billing page needs: plan/usage from the DB, plus payment
 *  method + history from Stripe for Pro users (SPEC §8). */
export async function getBillingData(): Promise<BillingData> {
  const period = currentPeriod();
  const resetDate = firstOfNextMonth();

  const { userId } = await auth();
  if (!userId) {
    return {
      plan: "free",
      status: null,
      used: 0,
      limit: FREE_DOCUMENT_LIMIT,
      resetDate,
      currentPeriodEnd: null,
      price: null,
      paymentMethod: null,
      invoices: [],
    };
  }

  const [sub, counter] = await Promise.all([
    db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, userId) }),
    db.query.usageCounters.findFirst({
      where: and(eq(usageCounters.userId, userId), eq(usageCounters.period, period)),
      columns: { documentsUsed: true },
    }),
  ]);

  const plan = sub?.plan ?? "free";
  const data: BillingData = {
    plan,
    status: sub?.status ?? null,
    used: counter?.documentsUsed ?? 0,
    limit: plan === "pro" ? null : FREE_DOCUMENT_LIMIT,
    resetDate,
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
    price: null,
    paymentMethod: null,
    invoices: [],
  };

  if (plan === "pro" && sub?.stripeSubscriptionId && sub.stripeCustomerId) {
    try {
      const stripe = getStripe();
      const [stripeSub, invoiceList] = await Promise.all([
        stripe.subscriptions.retrieve(sub.stripeSubscriptionId, {
          expand: ["default_payment_method"],
        }),
        stripe.invoices.list({ customer: sub.stripeCustomerId, limit: 10 }),
      ]);

      const priceItem = stripeSub.items.data[0]?.price;
      if (priceItem) {
        data.price = {
          amount: priceItem.unit_amount ?? 0,
          currency: priceItem.currency.toUpperCase(),
          interval: priceItem.recurring?.interval ?? "month",
        };
      }

      const pm = stripeSub.default_payment_method;
      if (pm && typeof pm !== "string" && pm.card) {
        data.paymentMethod = {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        };
      }

      data.invoices = invoiceList.data
        .filter((inv): inv is typeof inv & { id: string } => Boolean(inv.id))
        .map((inv) => ({
          id: inv.id,
          created: inv.created,
          description: inv.lines.data[0]?.description ?? "Subscription",
          amount: inv.amount_paid,
          currency: inv.currency.toUpperCase(),
          status: inv.status ?? "",
          pdfUrl: inv.invoice_pdf ?? inv.hosted_invoice_url ?? null,
        }));
    } catch (err) {
      console.error("Failed to load Stripe billing data:", err);
    }
  }

  return data;
}
