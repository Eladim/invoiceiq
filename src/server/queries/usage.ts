import "server-only";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { FREE_DOCUMENT_LIMIT } from "@/lib/constants";
import { db } from "@/server/db";
import { subscriptions, usageCounters } from "@/server/db/schema";

export type UsageSummary = {
  plan: "free" | "pro";
  used: number;
  /** null = unlimited (Pro). */
  limit: number | null;
};

function currentPeriod(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Usage + plan for the signed-in user in the current billing period.
 * Falls back to a free/empty summary when no rows exist yet.
 */
export async function getCurrentUsage(): Promise<UsageSummary> {
  const { userId } = await auth();
  if (!userId) {
    return { plan: "free", used: 0, limit: FREE_DOCUMENT_LIMIT };
  }

  const [subscription, counter] = await Promise.all([
    db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
      columns: { plan: true },
    }),
    db.query.usageCounters.findFirst({
      where: and(
        eq(usageCounters.userId, userId),
        eq(usageCounters.period, currentPeriod()),
      ),
      columns: { documentsUsed: true },
    }),
  ]);

  const plan = subscription?.plan ?? "free";
  return {
    plan,
    used: counter?.documentsUsed ?? 0,
    limit: plan === "pro" ? null : FREE_DOCUMENT_LIMIT,
  };
}
