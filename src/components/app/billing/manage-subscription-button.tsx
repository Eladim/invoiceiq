"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { startStripeFlow } from "@/lib/stripe-redirect";

export function ManageSubscriptionButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function manage() {
    setError(false);
    startTransition(async () => {
      try {
        await startStripeFlow("/api/stripe/portal");
      } catch {
        setError(true);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={manage}
        disabled={pending}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50",
          className,
        )}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
        Manage subscription
      </button>
      {error && <span className="text-xs text-red-600">Couldn&rsquo;t open the portal.</span>}
    </div>
  );
}
