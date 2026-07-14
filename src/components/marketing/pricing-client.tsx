"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { startStripeFlow } from "@/lib/stripe-redirect";

const FREE_FEATURES = ["5 documents / month", "AI extraction", "Line-item detail", "Basic dashboard"];
const PRO_FEATURES = [
  "Unlimited documents",
  "Spend analytics",
  "CSV export",
  "Priority processing",
  "Everything in Free",
];

export function PricingClient({ isSignedIn }: { isSignedIn: boolean }) {
  const router = useRouter();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function onPro() {
    setError(null);
    if (!isSignedIn) {
      router.push("/sign-up");
      return;
    }
    startTransition(async () => {
      try {
        await startStripeFlow("/api/stripe/checkout", { interval });
      } catch {
        setError("Couldn't start checkout. Please try again.");
      }
    });
  }

  function copyCard() {
    navigator.clipboard.writeText("4242 4242 4242 4242").then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <>
      {/* monthly / yearly toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-sm font-medium">
          <button
            onClick={() => setInterval("monthly")}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              interval === "monthly" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors",
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

      {/* cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Free */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-500">Free</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            €0<span className="text-base font-medium text-slate-400"> /month</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">For trying things out.</p>
          <ul className="mt-5 flex-1 space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="size-4 text-slate-400" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href={isSignedIn ? "/app" : "/sign-up"}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            {isSignedIn ? "Go to dashboard" : "Get started free"}
          </Link>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col rounded-2xl border-2 border-indigo-600 bg-white p-6 shadow-sm">
          <span className="absolute -top-3 left-6 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            Most popular
          </span>
          <p className="text-sm font-semibold text-indigo-600">Pro</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {interval === "monthly" ? "€9" : "€90"}
            <span className="text-base font-medium text-slate-400">
              {interval === "monthly" ? " /month" : " /year"}
            </span>
          </p>
          <p className="mt-1 text-sm text-slate-500">For businesses that scan a lot.</p>
          <ul className="mt-5 flex-1 space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="size-4 text-indigo-600" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={onPro}
            disabled={pending}
            className="mt-6 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isSignedIn ? `Upgrade — ${interval === "monthly" ? "€9/mo" : "€90/yr"}` : "Get started"}
          </button>
          {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
        </div>
      </div>

      {/* test-card callout */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="font-mono text-xs text-slate-300">
            <p className="text-slate-400"># Test mode</p>
            <p className="mt-1 text-slate-100">
              Use card <span className="font-semibold">4242 4242 4242 4242</span>, any future date, any CVC.
            </p>
          </div>
          <button
            onClick={copyCard}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 font-mono text-xs text-slate-300 transition-colors hover:bg-slate-800"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </>
  );
}
