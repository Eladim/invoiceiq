import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ChevronDown, ScanLine } from "lucide-react";

import { PricingClient } from "@/components/marketing/pricing-client";

export const metadata: Metadata = {
  title: "Pricing · InvoiceIQ",
  description: "Simple pricing — start free, upgrade to Pro for unlimited invoice extraction.",
};

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from the billing page whenever you like — you keep Pro until the end of the current period, then drop back to Free with your data intact.",
  },
  {
    q: "What counts as a document?",
    a: "Each invoice or receipt you upload and extract counts as one document toward your monthly limit. Free includes 5 per month; Pro is unlimited.",
  },
  {
    q: "Is my data private?",
    a: "Your files are stored in private, access-controlled storage — only you can view them, and you can delete any invoice (and its file) at any time.",
  },
  {
    q: "What file types are supported?",
    a: "PDF, PNG, and JPG, up to 10 MB per file.",
  },
  {
    q: "Do you offer refunds?",
    a: "This is a portfolio demo running in Stripe test mode, so no real charges are made. In a real deployment, we'd handle refunds via the billing portal.",
  },
];

export default async function PricingPage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      {/* Public header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ScanLine className="size-5 text-indigo-600" />
            InvoiceIQ
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {isSignedIn ? (
              <Link
                href="/app"
                className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-3.5 font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="px-3 py-2 font-medium text-slate-600 hover:text-slate-900">
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-3.5 font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-14">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Start free with 5 documents a month. Upgrade to Pro for unlimited extraction, analytics
            and CSV export.
          </p>
        </div>

        <div className="mt-8">
          <PricingClient isSignedIn={isSignedIn} />
        </div>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-center text-lg font-semibold">Frequently asked questions</h2>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-5">
            {FAQ.map((item) => (
              <details key={item.q} className="group border-b border-slate-100 py-4 last:border-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-900">
                  {item.q}
                  <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} InvoiceIQ · Built with Stripe, OpenAI, and Vercel
      </footer>
    </div>
  );
}
