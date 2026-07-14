import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { UsageSummary } from "@/server/queries/usage";
import { cn } from "@/lib/utils";

export function UsageMeter({ usage }: { usage: UsageSummary }) {
  const { plan, used, limit } = usage;

  if (plan === "pro" || limit === null) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <p className="text-[11.5px] font-semibold text-slate-600">Pro plan</p>
        <p className="mt-1 text-[11.5px] text-slate-400">Unlimited documents</p>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((used / limit) * 100));
  const atLimit = used >= limit;
  const nearLimit = used >= limit - 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11.5px] font-semibold text-slate-600">Usage this month</span>
        <span className="text-[11.5px] font-semibold tabular-nums text-slate-700">
          {used} / {limit}
        </span>
      </div>
      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-label="Documents used this month"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            atLimit ? "bg-red-500" : nearLimit ? "bg-amber-500" : "bg-indigo-600",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[11.5px] text-slate-400">{used} of {limit} documents used</p>
      <Link
        href="/app/billing"
        className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
      >
        {atLimit ? "Limit reached — upgrade" : "Upgrade to Pro"}
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
