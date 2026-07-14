import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileSpreadsheet,
  ListChecks,
  PencilLine,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
} from "lucide-react";

export const metadata: Metadata = {
  title: "InvoiceIQ — Stop retyping invoices",
  description:
    "Upload an invoice, let AI extract vendor, dates, line items and totals in seconds, and turn it into searchable spend analytics.",
};

const STEPS = [
  { icon: UploadCloud, title: "Upload", body: "Drag & drop a PDF, PNG or JPG — or several at once." },
  { icon: Sparkles, title: "AI extracts", body: "Vendor, dates, line items and totals, read in seconds." },
  { icon: BarChart3, title: "Analyze", body: "Search, filter and see your spend trends and top vendors." },
];

const FEATURES = [
  { icon: ScanLine, title: "AI extraction", body: "Structured vendor, dates, currency and totals from any invoice or receipt." },
  { icon: ListChecks, title: "Line-item detail", body: "Every line captured — description, quantity, unit price and amount." },
  { icon: BarChart3, title: "Spend analytics", body: "Monthly spend trends, top vendors and category breakdowns." },
  { icon: FileSpreadsheet, title: "CSV export", body: "Export invoices and line items to CSV for your accounting tools." },
  { icon: PencilLine, title: "Inline corrections", body: "Low-confidence fields are flagged so you can verify and edit inline." },
  { icon: ShieldCheck, title: "Secure storage", body: "Files kept in private, access-controlled storage — only you can see them." },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
              <ScanLine className="size-4" />
            </span>
            InvoiceIQ
          </Link>
          <nav className="flex items-center gap-1.5 text-sm">
            <Link href="/pricing" className="px-3 py-2 font-medium text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
            <Link href="/sign-in" className="px-3 py-2 font-medium text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-3.5 font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(#eef2f7 1px, transparent 1px), linear-gradient(90deg, #eef2f7 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="size-3.5" />
              AI-powered invoice parsing
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Stop retyping invoices
            </h1>
            <p className="mt-4 max-w-md text-lg text-pretty text-slate-600">
              Upload an invoice and InvoiceIQ extracts the vendor, dates, line items and totals in
              seconds — turning paperwork into searchable, exportable spend data.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                Start free — 5 invoices/month
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                View live demo
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-400">No credit card required · PDF, PNG, JPG</p>
          </div>

          <HeroMock />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <s.icon className="size-6" />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-xs font-bold text-indigo-400">{i + 1}</span>
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
              </div>
              <p className="mt-1.5 text-sm text-pretty text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight">Everything you need</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500">
            From extraction to analytics — the whole invoice workflow in one place.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-[0_4px_18px_rgba(15,23,42,0.06)]"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-pretty text-slate-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <div className="flex justify-center gap-0.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="size-5 fill-current" />
          ))}
        </div>
        <blockquote className="mt-5 text-xl font-medium text-pretty text-slate-800 sm:text-2xl">
          &ldquo;We used to spend hours retyping supplier invoices into spreadsheets. Now they&rsquo;re
          extracted and categorized before I finish my coffee.&rdquo;
        </blockquote>
        <div className="mt-5 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">Maya Kowalski</span> · Ops Lead, Northwind
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight">Simple pricing</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold text-slate-500">Free</p>
              <p className="mt-2 text-3xl font-bold">
                €0<span className="text-base font-medium text-slate-400"> /mo</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">5 documents a month.</p>
              <Link
                href="/pricing"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                See details
              </Link>
            </div>
            <div className="relative flex flex-col rounded-2xl border-2 border-indigo-600 bg-white p-6">
              <span className="absolute -top-3 left-6 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                Most popular
              </span>
              <p className="text-sm font-semibold text-indigo-600">Pro</p>
              <p className="mt-2 text-3xl font-bold">
                €9<span className="text-base font-medium text-slate-400"> /mo</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">Unlimited documents + analytics + export.</p>
              <Link
                href="/pricing"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-700">
            <ScanLine className="size-4 text-indigo-600" />
            InvoiceIQ
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
            <Link href="/sign-in" className="hover:text-slate-900">Sign in</Link>
            <Link href="/sign-up" className="hover:text-slate-900">Get started</Link>
          </nav>
          <span className="text-slate-400">© {new Date().getFullYear()} InvoiceIQ</span>
        </div>
      </footer>
    </div>
  );
}

/** Hero mock: a document thumbnail with an animated scan line and extracted chips. */
function HeroMock() {
  const chips = [
    { label: "Vendor", value: "Acme Supplies Co." },
    { label: "Total", value: "$1,284.50" },
    { label: "Due date", value: "Apr 13, 2026" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
        <div className="flex items-center gap-2 pb-3">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs text-slate-400">acme-invoice.pdf</span>
        </div>

        <div className="grid grid-cols-[1fr_1.1fr] gap-3">
          {/* Faux document with scan line */}
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="space-y-1.5">
              <div className="h-2 w-2/3 rounded bg-slate-300" />
              <div className="h-1.5 w-1/2 rounded bg-slate-200" />
              <div className="mt-3 h-1.5 w-full rounded bg-slate-200" />
              <div className="h-1.5 w-full rounded bg-slate-200" />
              <div className="h-1.5 w-4/5 rounded bg-slate-200" />
              <div className="mt-3 h-1.5 w-full rounded bg-slate-200" />
              <div className="h-1.5 w-3/4 rounded bg-slate-200" />
              <div className="mt-3 h-2 w-1/3 rounded bg-slate-300" />
            </div>
            <div
              className="absolute right-2 left-2 h-0.5 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_10px_rgba(79,70,229,0.8)]"
              style={{ animation: "iq-scan 2.2s ease-in-out infinite", top: "8%" }}
            />
          </div>

          {/* Extracted chips */}
          <div className="flex flex-col justify-center gap-2">
            {chips.map((chip, i) => (
              <div
                key={chip.label}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                style={{ animation: `iq-pop .4s ease both ${0.3 + i * 0.35}s` }}
              >
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                    {chip.label}
                  </span>
                  <span className="block truncate text-xs font-semibold text-slate-800">{chip.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
