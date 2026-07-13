"use client";

import { useState, useTransition } from "react";
import { Loader2, TriangleAlert, X } from "lucide-react";

import { startStripeFlow } from "@/lib/stripe-redirect";

export function PastDueBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();
  if (dismissed) return null;

  function updatePayment() {
    startTransition(async () => {
      try {
        await startStripeFlow("/api/stripe/portal");
      } catch {
        /* leave the banner in place on failure */
      }
    });
  }

  return (
    <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div className="flex-1">
        <p className="font-medium text-amber-800">Your last payment failed</p>
        <p className="text-amber-700">
          Update your payment method to keep your Pro features.{" "}
          <button
            onClick={updatePayment}
            disabled={pending}
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 disabled:opacity-50"
          >
            {pending && <Loader2 className="size-3 animate-spin" />}
            Update payment method
          </button>
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="rounded-md p-0.5 text-amber-600 transition-colors hover:bg-amber-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
