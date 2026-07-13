"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { startStripeFlow } from "@/lib/stripe-redirect";

const FREE_FEATURES = ["5 documents / month", "AI extraction", "Basic dashboard"];
const PRO_FEATURES = [
  "Unlimited documents",
  "Spend analytics",
  "CSV export",
  "Priority processing",
];

export function UpgradePanel() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function upgrade() {
    setError(null);
    startTransition(async () => {
      try {
        await startStripeFlow("/api/stripe/checkout", { interval });
      } catch {
        setError("Couldn't start checkout. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700">Upgrade to Pro</h2>
        {/* monthly / yearly toggle */}
        <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-xs font-medium">
          <button
            onClick={() => setInterval("monthly")}
            className={cn(
              "rounded-md px-2.5 py-1 transition-colors",
              interval === "monthly" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors",
              interval === "yearly" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900",
            )}
          >
            Yearly
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                interval === "yearly" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700",
              )}
            >
              2 months free
            </span>
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Free column */}
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500">Free</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900">
            €0<span className="text-sm font-medium text-slate-400"> /mo</span>
          </p>
          <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            Current plan
          </span>
          <ul className="mt-3 space-y-1.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="size-3.5 text-slate-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro column */}
        <div className="rounded-lg border-2 border-indigo-600 bg-indigo-50/30 p-4">
          <p className="text-xs font-semibold text-indigo-600">Pro</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900">
            {interval === "monthly" ? "€9" : "€90"}
            <span className="text-sm font-medium text-slate-400">
              {interval === "monthly" ? " /mo" : " /yr"}
            </span>
          </p>
          <ul className="mt-[1.375rem] space-y-1.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="size-3.5 text-indigo-600" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={upgrade}
        disabled={pending}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Upgrade to Pro — {interval === "monthly" ? "€9/mo" : "€90/yr"}
      </button>
      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
