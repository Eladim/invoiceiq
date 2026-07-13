import type { Metadata } from "next";
import { CircleCheck, CreditCard, Download } from "lucide-react";

import { ManageSubscriptionButton } from "@/components/app/billing/manage-subscription-button";
import { PastDueBanner } from "@/components/app/billing/past-due-banner";
import { UpgradePanel } from "@/components/app/billing/upgrade-panel";
import { formatLongDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getBillingData } from "@/server/queries/billing";

export const metadata: Metadata = { title: "Billing · InvoiceIQ" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const billing = await getBillingData();
  const success = (await searchParams).success === "true";
  const isPro = billing.plan === "pro";
  const priceLabel = billing.price
    ? `${formatMoney(billing.price.amount / 100, billing.price.currency)}/${
        billing.price.interval === "year" ? "yr" : "mo"
      }`
    : "€9/mo";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your plan and payment method.</p>

      {billing.status === "past_due" && <PastDueBanner />}

      {/* DB is the source of truth — plan only flips when the webhook lands. */}
      {success && !isPro && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CircleCheck className="size-4 shrink-0" />
          Payment received — your plan will update in a moment.
        </div>
      )}

      {/* Current plan card */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-slate-900">{isPro ? "Pro" : "Free"}</p>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  isPro ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500",
                )}
              >
                {isPro ? "Active" : "Free plan"}
              </span>
            </div>
            {isPro ? (
              <p className="mt-1 text-sm text-slate-500">
                {priceLabel}
                {billing.currentPeriodEnd && ` · renews ${formatLongDate(billing.currentPeriodEnd)}`}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">€0 — up to 5 documents per month</p>
            )}
          </div>
          {isPro && <ManageSubscriptionButton />}
        </div>

        {/* Free: usage meter */}
        {!isPro && billing.limit !== null && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-slate-500">
                {billing.used} of {billing.limit} documents used
              </span>
              <span className="text-xs text-slate-400">
                resets {formatLongDate(billing.resetDate)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  billing.used >= billing.limit ? "bg-amber-500" : "bg-indigo-600",
                )}
                style={{ width: `${Math.min(100, (billing.used / billing.limit) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Pro: payment method */}
        {isPro && billing.paymentMethod && (
          <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4 text-sm">
            <CreditCard className="size-4 text-slate-400" />
            <span className="font-medium text-slate-700 capitalize">{billing.paymentMethod.brand}</span>
            <span className="text-slate-500">•••• {billing.paymentMethod.last4}</span>
            <span className="text-slate-400">
              exp {String(billing.paymentMethod.expMonth).padStart(2, "0")}/{billing.paymentMethod.expYear}
            </span>
          </div>
        )}
      </div>

      {/* Free: upgrade panel */}
      {!isPro && (
        <div className="mt-4">
          <UpgradePanel />
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-slate-300">
            <p className="text-slate-400"># Test mode — use this card at checkout</p>
            <p className="mt-1 text-slate-100">4242 4242 4242 4242 · any future date · any CVC</p>
          </div>
        </div>
      )}

      {/* Pro: billing history */}
      {isPro && billing.invoices.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">
            Billing history
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="w-10 px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {billing.invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5 text-slate-600">{formatLongDate(inv.created)}</td>
                  <td className="px-4 py-2.5 text-slate-600">{inv.description}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                    {formatMoney(inv.amount / 100, inv.currency)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        inv.status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {inv.pdfUrl && (
                      <a
                        href={inv.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Download invoice"
                        className="inline-flex rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Download className="size-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
