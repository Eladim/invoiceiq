import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";

import { BillingActions } from "@/components/app/billing-actions";
import { getCurrentUsage } from "@/server/queries/usage";

export const metadata: Metadata = { title: "Billing · InvoiceIQ" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usage = await getCurrentUsage();
  const success = (await searchParams).success === "true";
  const isPro = usage.plan === "pro";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your plan and payment method.</p>

      {/* DB is the source of truth — the plan flips only when the webhook lands. */}
      {success && !isPro && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CircleCheck className="size-4 shrink-0" />
          Payment received — your plan will update in a moment.
        </div>
      )}

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Current plan</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-900">
              {isPro ? "Pro" : "Free"}
            </p>
          </div>
          <BillingActions plan={usage.plan} />
        </div>

        {!isPro && usage.limit !== null && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-slate-500">Documents this month</span>
              <span className="tabular-nums text-slate-700">
                {usage.used} of {usage.limit}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600"
                style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {!isPro && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-slate-300">
          <p className="text-slate-400"># Test mode — use this card at checkout</p>
          <p className="mt-1 text-slate-100">4242 4242 4242 4242 · any future date · any CVC</p>
        </div>
      )}
    </div>
  );
}
