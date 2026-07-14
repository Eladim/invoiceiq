import type { Metadata } from "next";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { CalendarClock, FileCheck2, FileText, TriangleAlert, Upload, Wallet } from "lucide-react";

import { SpendChart } from "@/components/app/dashboard/spend-chart";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { TopVendors } from "@/components/app/dashboard/top-vendors";
import { StatusBadge } from "@/components/app/invoices/badges";
import { formatDate, formatMoney } from "@/lib/format";
import { getDashboardData } from "@/server/queries/dashboard";

export const metadata: Metadata = { title: "Dashboard · InvoiceIQ" };

export default async function DashboardPage() {
  const { userId } = await auth();
  const [data, user] = await Promise.all([
    userId ? getDashboardData(userId) : Promise.resolve(null),
    currentUser(),
  ]);

  if (!data || data.totalInvoices === 0) {
    return <EmptyDashboard />;
  }

  const { currency } = data;
  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : "Welcome back";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{greeting}</h1>
          <p className="mt-1 text-sm text-slate-500">Your spend and invoice activity at a glance.</p>
        </div>
        <Link
          href="/app/upload"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <Upload className="size-4" />
          Upload invoice
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Spend this month"
          value={formatMoney(data.spendThisMonth, currency)}
          deltaPct={data.spendDeltaPct}
          spark={data.sparklines.spend}
        />
        <StatCard
          icon={FileCheck2}
          label="Invoices processed"
          value={String(data.invoicesProcessed)}
          subtitle="Completed all-time"
          spark={data.sparklines.processed}
          sparkClassName="text-emerald-500"
        />
        <StatCard
          icon={TriangleAlert}
          label="Pending review"
          value={String(data.pendingReview)}
          subtitle="Low-confidence fields"
          spark={data.sparklines.pending}
          sparkClassName="text-amber-500"
        />
        <StatCard
          icon={CalendarClock}
          label="Upcoming due"
          value={String(data.upcomingDueCount)}
          subtitle={
            data.upcomingDueCount > 0 ? formatMoney(data.upcomingDueSum, currency) : "Nothing due"
          }
          spark={data.sparklines.upcoming}
          sparkClassName="text-slate-400"
        />
      </div>

      {/* Chart + top vendors */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendChart data={data.monthlySpend} currency={currency} />
        </div>
        <TopVendors vendors={data.topVendors} currency={currency} />
      </div>

      {/* Recent invoices */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-700">Recent invoices</h2>
          <Link href="/app/invoices" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View all
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-4 py-2 font-medium">Vendor</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 text-right font-medium">Total</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.recentInvoices.map((inv) => (
              <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/app/invoices/${inv.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {inv.vendorName ?? "Untitled invoice"}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                  {formatMoney(inv.total, inv.currency)}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <FileText className="size-6" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">No invoices yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload your first invoice and your spend analytics will appear here.
          </p>
        </div>
        <Link
          href="/app/upload"
          className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <Upload className="size-4" />
          Upload invoice
        </Link>
      </div>
    </div>
  );
}
