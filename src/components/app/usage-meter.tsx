import Link from "next/link";

import type { UsageSummary } from "@/server/queries/usage";
import { cn } from "@/lib/utils";

export function UsageMeter({ usage }: { usage: UsageSummary }) {
  const { plan, used, limit } = usage;

  if (plan === "pro" || limit === null) {
    return (
      <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
        <p className="text-sm font-medium text-sidebar-foreground">Pro plan</p>
        <p className="mt-0.5 text-xs text-sidebar-foreground/60">Unlimited documents</p>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((used / limit) * 100));
  const atLimit = used >= limit;

  return (
    <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-sidebar-foreground/70">Usage this month</p>
        <p className="text-xs tabular-nums text-sidebar-foreground/60">
          {used} / {limit}
        </p>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sidebar-border"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-label="Documents used this month"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            atLimit ? "bg-destructive" : "bg-sidebar-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <Link
        href="/app/billing"
        className="mt-3 inline-block text-xs font-medium text-sidebar-foreground underline-offset-4 hover:underline"
      >
        {atLimit ? "Limit reached — upgrade" : "Upgrade to Pro"}
      </Link>
    </div>
  );
}
