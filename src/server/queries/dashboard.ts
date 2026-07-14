import "server-only";

import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { invoices } from "@/server/db/schema";
import type { InvoiceRow } from "./invoices";

export type MonthlySpend = { key: string; label: string; total: number };

export type DashboardData = {
  totalInvoices: number;
  spendThisMonth: number;
  spendDeltaPct: number | null;
  invoicesProcessed: number;
  pendingReview: number;
  upcomingDueCount: number;
  upcomingDueSum: number;
  currency: string;
  monthlySpend: MonthlySpend[]; // last 12 months, gaps filled
  topVendors: { vendor: string; total: number }[];
  recentInvoices: InvoiceRow[];
  // Last-6-month trend series for the stat-card sparklines.
  sparklines: {
    spend: number[];
    processed: number[];
    pending: number[];
    upcoming: number[];
  };
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // Build the last 12 month buckets.
  const months: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
    });
  }
  const start12 = `${months[0].key}-01`;

  const [monthlyRows, dueRows, statRows, vendorRows, recentInvoices] = await Promise.all([
    // Per-month completed metrics (by invoice_date) over the last 12 months.
    db
      .select({
        month: sql<string>`to_char(${invoices.invoiceDate}, 'YYYY-MM')`,
        spend: sql<string>`coalesce(sum(${invoices.total}), 0)`,
        processed: sql<number>`cast(count(*) as int)`,
        pending: sql<number>`cast(count(*) filter (where ${invoices.confidence}::text ilike '%"low"%') as int)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          eq(invoices.status, "completed"),
          isNotNull(invoices.invoiceDate),
          gte(invoices.invoiceDate, start12),
        ),
      )
      .groupBy(sql`to_char(${invoices.invoiceDate}, 'YYYY-MM')`),

    // Invoices per month by due date (for the "upcoming due" sparkline).
    db
      .select({
        month: sql<string>`to_char(${invoices.dueDate}, 'YYYY-MM')`,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          eq(invoices.status, "completed"),
          isNotNull(invoices.dueDate),
          gte(invoices.dueDate, start12),
        ),
      )
      .groupBy(sql`to_char(${invoices.dueDate}, 'YYYY-MM')`),

    // Headline counts (FILTER-ed aggregates, one pass).
    db
      .select({
        totalInvoices: sql<number>`cast(count(*) as int)`,
        completed: sql<number>`cast(count(*) filter (where ${invoices.status} = 'completed') as int)`,
        pendingReview: sql<number>`cast(count(*) filter (where ${invoices.status} = 'completed' and ${invoices.confidence}::text ilike '%"low"%') as int)`,
        upcomingCount: sql<number>`cast(count(*) filter (where ${invoices.status} = 'completed' and ${invoices.dueDate} >= ${today}::date) as int)`,
        upcomingSum: sql<string>`coalesce(sum(${invoices.total}) filter (where ${invoices.status} = 'completed' and ${invoices.dueDate} >= ${today}::date), 0)`,
        currency: sql<string | null>`max(${invoices.currency})`,
      })
      .from(invoices)
      .where(eq(invoices.userId, userId)),

    // Top vendors by completed spend.
    db
      .select({
        vendor: invoices.vendorName,
        total: sql<string>`coalesce(sum(${invoices.total}), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          eq(invoices.status, "completed"),
          isNotNull(invoices.vendorName),
        ),
      )
      .groupBy(invoices.vendorName)
      .orderBy(sql`sum(${invoices.total}) desc nulls last`)
      .limit(5),

    // Most recent invoices (any status).
    db
      .select({
        id: invoices.id,
        vendorName: invoices.vendorName,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        category: invoices.category,
        total: invoices.total,
        currency: invoices.currency,
        status: invoices.status,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt))
      .limit(5),
  ]);

  const spendByMonth = new Map(monthlyRows.map((r) => [r.month, Number(r.spend)]));
  const processedByMonth = new Map(monthlyRows.map((r) => [r.month, r.processed]));
  const pendingByMonth = new Map(monthlyRows.map((r) => [r.month, r.pending]));
  const dueByMonth = new Map(dueRows.map((r) => [r.month, r.count]));

  const monthlySpend: MonthlySpend[] = months.map((m) => ({
    key: m.key,
    label: m.label,
    total: spendByMonth.get(m.key) ?? 0,
  }));

  const last6 = months.slice(6);
  const sparklines = {
    spend: last6.map((m) => spendByMonth.get(m.key) ?? 0),
    processed: last6.map((m) => processedByMonth.get(m.key) ?? 0),
    pending: last6.map((m) => pendingByMonth.get(m.key) ?? 0),
    upcoming: last6.map((m) => dueByMonth.get(m.key) ?? 0),
  };

  const thisMonth = monthlySpend[11]?.total ?? 0;
  const lastMonth = monthlySpend[10]?.total ?? 0;
  const spendDeltaPct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;

  const stats = statRows[0];

  return {
    totalInvoices: stats?.totalInvoices ?? 0,
    spendThisMonth: thisMonth,
    spendDeltaPct,
    invoicesProcessed: stats?.completed ?? 0,
    pendingReview: stats?.pendingReview ?? 0,
    upcomingDueCount: stats?.upcomingCount ?? 0,
    upcomingDueSum: Number(stats?.upcomingSum ?? 0),
    currency: stats?.currency ?? "USD",
    monthlySpend,
    topVendors: vendorRows.map((v) => ({ vendor: v.vendor ?? "Unknown", total: Number(v.total) })),
    recentInvoices,
    sparklines,
  };
}
