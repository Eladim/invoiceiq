"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { Loader2, Sparkles } from "lucide-react";

import { useDemoLogin } from "@/lib/use-demo-login";

/**
 * Auto-signs the visitor into the seeded demo account and forwards to /app.
 * Linked from the landing page's "View live demo" CTA so reviewers skip the
 * sign-in page entirely; a full-screen loader covers the sign-in round-trip.
 */
export default function DemoPage() {
  const clerk = useClerk();
  const { startDemo, error } = useDemoLogin();
  const started = useRef(false);

  useEffect(() => {
    // Wait for Clerk to load before touching clerk.client, and run the sign-in once.
    if (!clerk.loaded || started.current) return;
    started.current = true;
    void startDemo();
  }, [clerk.loaded, startDemo]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm">
        <Sparkles className="size-6" />
      </div>

      {error ? (
        <>
          <p className="text-sm font-semibold text-slate-900">Couldn&rsquo;t start the demo.</p>
          <p className="max-w-xs text-xs text-slate-500">
            Something went wrong signing you in. You can try again from the sign-in page.
          </p>
          <Link
            href="/sign-in"
            className="mt-1 inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Go to sign in
          </Link>
        </>
      ) : (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Loader2 className="size-4 animate-spin text-indigo-600" />
            Setting up your demo&hellip;
          </p>
          <p className="max-w-xs text-xs text-slate-500">
            Signing you into a demo account preloaded with sample invoices and analytics.
          </p>
        </>
      )}
    </div>
  );
}
