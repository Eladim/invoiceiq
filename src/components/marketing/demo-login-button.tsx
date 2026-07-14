"use client";

import { Loader2, Sparkles } from "lucide-react";

import { useDemoLogin } from "@/lib/use-demo-login";

export function DemoLoginButton() {
  const { startDemo, pending, error } = useDemoLogin();

  return (
    <div className="w-full max-w-[25rem] rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
      <p className="text-sm font-semibold text-slate-700">Reviewing my portfolio?</p>
      <p className="mt-1 text-xs text-slate-500">
        Jump straight into a demo account preloaded with sample invoices and analytics.
      </p>
      <button
        onClick={startDemo}
        disabled={pending}
        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Use demo account
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600">Couldn&rsquo;t start the demo. Please try again.</p>
      )}
    </div>
  );
}
