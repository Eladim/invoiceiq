"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function BillingActions({ plan }: { plan: "free" | "pro" }) {
  const [pending, setPending] = useState<string | null>(null);

  async function go(path: string, body?: unknown) {
    setPending(path);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        window.alert("Something went wrong. Please try again.");
        setPending(null);
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      window.alert("Something went wrong. Please try again.");
      setPending(null);
    }
  }

  if (plan === "pro") {
    return (
      <button
        onClick={() => go("/api/stripe/portal")}
        disabled={pending !== null}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Manage subscription
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => go("/api/stripe/checkout", { interval: "monthly" })}
        disabled={pending !== null}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending?.includes("checkout") && <Loader2 className="size-4 animate-spin" />}
        Upgrade — €9/mo
      </button>
      <button
        onClick={() => go("/api/stripe/checkout", { interval: "yearly" })}
        disabled={pending !== null}
        className="inline-flex h-9 items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
      >
        Upgrade — €90/yr (2 months free)
      </button>
    </div>
  );
}
