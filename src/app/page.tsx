import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileDown,
  FileText,
  List,
  PencilLine,
  Play,
  Quote,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "InvoiceIQ — Stop retyping invoices",
  description:
    "Drop in a PDF or photo and AI pulls out the vendor, totals, due dates and every line item in seconds — turning paperwork into searchable, exportable spend data.",
};

const STEPS = [
  {
    icon: UploadCloud,
    n: "01",
    title: "Upload",
    body: "Drag in PDFs, scans or phone photos — even crumpled receipts. Batch upload up to 50 at once.",
  },
  {
    icon: Sparkles,
    n: "02",
    title: "AI extracts",
    body: "Vendor, dates, totals, VAT and every line item are pulled into structured fields with confidence scores.",
  },
  {
    icon: BarChart3,
    n: "03",
    title: "Analyze",
    body: "See spend by vendor and month, catch duplicates, and export clean CSVs for your accountant.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI extraction",
    body: "Vendor, totals, dates and VAT read from any layout — PDFs, scans, photos. No templates, ever.",
  },
  {
    icon: List,
    title: "Line-item detail",
    body: "Every row of every invoice captured — descriptions, quantities, unit prices — not just the grand total.",
  },
  {
    icon: BarChart3,
    title: "Spend analytics",
    body: "Monthly trends, top vendors and category breakdowns from the data you already receive.",
  },
  {
    icon: FileDown,
    title: "CSV export",
    body: "One click to a clean, accountant-ready CSV. Works with Excel, Xero and QuickBooks imports.",
  },
  {
    icon: PencilLine,
    title: "Inline corrections",
    body: "Fix a misread field in place; InvoiceIQ learns that vendor’s quirks for next time.",
  },
  {
    icon: ShieldCheck,
    title: "Secure storage",
    body: "Originals encrypted at rest in EU data centres, with full history. GDPR compliant by default.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white font-sans text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/[0.82] backdrop-blur-[14px]">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-[30px] items-center justify-center rounded-[9px] bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.35)]">
              <ScanLine className="size-4" strokeWidth={2.4} />
            </span>
            <span className="text-base font-bold tracking-[-0.02em]">InvoiceIQ</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <a href="#how" className="rounded-lg px-3.5 py-1.5 text-[13.5px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              How it works
            </a>
            <a href="#features" className="rounded-lg px-3.5 py-1.5 text-[13.5px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Features
            </a>
            <Link href="/pricing" className="rounded-lg px-3.5 py-1.5 text-[13.5px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/sign-in" className="rounded-lg px-3.5 py-1.5 text-[13.5px] font-semibold text-slate-700 hover:bg-slate-100">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-indigo-600 px-4 py-2 text-[13.5px] font-semibold text-white shadow-[0_4px_14px_rgba(79,70,229,0.30)] transition-transform hover:-translate-y-px hover:bg-indigo-700"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 75%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-32 size-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(79,70,229,0.14), transparent 65%)" }}
        />
        <div className="relative mx-auto grid max-w-[1120px] items-center gap-14 px-6 py-[88px] lg:grid-cols-2 lg:pb-24">
          <div className="flex min-w-0 flex-col items-start gap-[22px]">
            <span
              data-iql-anim
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-[5px] text-[12.5px] font-semibold text-indigo-700"
              style={{ animation: "iql-rise .7s cubic-bezier(.22,1,.36,1) both" }}
            >
              <span
                data-iql-anim
                className="size-[7px] rounded-full bg-indigo-600"
                style={{ animation: "iql-pulse 2s ease-in-out infinite" }}
              />
              AI-powered invoice extraction
            </span>
            <h1
              data-iql-anim
              className="text-[clamp(40px,5.4vw,62px)] font-extrabold leading-[1.04] tracking-[-0.035em] text-pretty"
              style={{ animation: "iql-rise .7s cubic-bezier(.22,1,.36,1) .08s both" }}
            >
              Stop retyping{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                invoices
              </span>
            </h1>
            <p
              data-iql-anim
              className="max-w-[440px] text-[17px] leading-[1.65] text-pretty text-slate-600"
              style={{ animation: "iql-rise .7s cubic-bezier(.22,1,.36,1) .16s both" }}
            >
              Drop in a PDF or photo and our AI pulls out the vendor, totals, due dates and every line
              item — in seconds, not evenings.
            </p>
            <div
              data-iql-anim
              className="flex flex-wrap items-center gap-3"
              style={{ animation: "iql-rise .7s cubic-bezier(.22,1,.36,1) .24s both" }}
            >
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-[22px] py-[13px] text-[15px] font-semibold text-white shadow-[0_8px_22px_rgba(79,70,229,0.32)] transition-transform hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Start free — 5 invoices/month
                <ArrowRight className="size-4" strokeWidth={2.4} />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[15px] font-semibold text-slate-900 transition-transform hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
              >
                <Play className="size-4 fill-current" strokeWidth={2.2} />
                View live demo
              </Link>
            </div>
            <div
              data-iql-anim
              className="text-[13px] text-slate-400"
              style={{ animation: "iql-rise .7s cubic-bezier(.22,1,.36,1) .32s both" }}
            >
              No credit card required · Free forever plan
            </div>
          </div>

          <HeroMock />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-[1120px] scroll-mt-20 px-6 pt-24 pb-[84px]">
        <div className="iql-reveal flex flex-col gap-2.5 text-center">
          <div className="text-[12.5px] font-bold tracking-[0.1em] text-indigo-600 uppercase">How it works</div>
          <h2 className="text-[clamp(28px,3.4vw,38px)] font-extrabold tracking-[-0.03em]">
            From paper pile to clean data
          </h2>
          <p className="mx-auto max-w-[460px] text-[15.5px] text-pretty text-slate-500">
            Three steps. No templates to configure, no fields to map.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.title}
              className="iql-reveal flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-7"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <s.icon className="size-[21px]" />
                </div>
                <span className="text-[13px] font-bold text-slate-300">{s.n}</span>
              </div>
              <div className="text-[16.5px] font-bold">{s.title}</div>
              <p className="text-sm leading-[1.6] text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1120px] px-6 py-22">
          <div className="iql-reveal flex flex-col gap-2.5 text-center">
            <div className="text-[12.5px] font-bold tracking-[0.1em] text-indigo-600 uppercase">Features</div>
            <h2 className="text-[clamp(28px,3.4vw,38px)] font-extrabold tracking-[-0.03em]">
              Everything between inbox and ledger
            </h2>
          </div>
          <div className="mt-11 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="iql-reveal flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              >
                <div className="flex size-10 items-center justify-center rounded-[11px] bg-indigo-50 text-indigo-600">
                  <f.icon className="size-[19px]" />
                </div>
                <div className="text-[15.5px] font-bold">{f.title}</div>
                <p className="text-[13.5px] leading-[1.6] text-slate-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-slate-900">
        <div className="iql-reveal mx-auto flex max-w-[860px] flex-col items-center gap-[26px] px-6 py-22 text-center">
          <Quote className="size-9 fill-indigo-600 text-indigo-600" />
          <blockquote className="text-[clamp(20px,2.6vw,27px)] font-semibold leading-[1.5] tracking-[-0.015em] text-pretty text-slate-100">
            InvoiceIQ turned my Sunday-evening bookkeeping chore into a five-minute job. I photograph
            invoices as they arrive and the numbers are just… there, correct, in a spreadsheet.
          </blockquote>
          <div className="flex items-center gap-3.5">
            <div className="flex size-[42px] items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              MK
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-100">Marta Kase</div>
              <div className="text-[12.5px] text-slate-400">Owner, Kase Catering OÜ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section id="pricing" className="mx-auto max-w-[1120px] scroll-mt-20 px-6 py-24">
        <div className="iql-reveal flex flex-col gap-2.5 text-center">
          <div className="text-[12.5px] font-bold tracking-[0.1em] text-indigo-600 uppercase">Pricing</div>
          <h2 className="text-[clamp(28px,3.4vw,38px)] font-extrabold tracking-[-0.03em]">
            Start free, upgrade when it pays off
          </h2>
        </div>
        <div className="mx-auto mt-11 grid max-w-[720px] gap-5 sm:grid-cols-2">
          <div className="iql-reveal flex flex-col rounded-2xl border border-slate-200 bg-white p-7">
            <div className="text-[15px] font-bold">Free</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[34px] font-extrabold tracking-[-0.03em]">€0</span>
              <span className="text-[13px] text-slate-400">/ month</span>
            </div>
            <div className="mt-1 text-[13.5px] text-slate-500">
              5 invoices a month, AI extraction and the dashboard. Free forever.
            </div>
            <Link
              href="/sign-up"
              className="mt-5 block rounded-[10px] border border-slate-300 bg-white py-2.5 text-center text-sm font-semibold text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              Get started free
            </Link>
          </div>
          <div className="iql-reveal relative flex flex-col rounded-2xl border-2 border-indigo-600 bg-white p-[27px] shadow-[0_4px_20px_rgba(79,70,229,0.10)]">
            <span className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold tracking-[0.04em] text-white uppercase">
              Most popular
            </span>
            <div className="text-[15px] font-bold text-indigo-700">Pro</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[34px] font-extrabold tracking-[-0.03em]">€9</span>
              <span className="text-[13px] text-slate-400">/ month</span>
            </div>
            <div className="mt-1 text-[13.5px] text-slate-500">
              Unlimited invoices, spend analytics, CSV export and priority processing.
            </div>
            <Link
              href="/pricing"
              className="mt-5 block rounded-[10px] bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-[0_6px_16px_rgba(79,70,229,0.28)] transition-colors hover:bg-indigo-700"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
        <div className="mt-6 text-center text-sm">
          <Link href="/pricing" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Compare plans in detail →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-12 px-6 pt-14 pb-10">
          <div className="flex max-w-[260px] flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-[26px] items-center justify-center rounded-lg bg-indigo-600 text-white">
                <ScanLine className="size-3.5" strokeWidth={2.4} />
              </span>
              <span className="text-[14.5px] font-bold tracking-[-0.02em]">InvoiceIQ</span>
            </div>
            <p className="text-[13px] leading-[1.6] text-slate-500">
              AI invoice extraction for small businesses. Built in the EU, GDPR compliant.
            </p>
          </div>
          <div className="flex flex-wrap gap-16">
            <FooterCol
              heading="Product"
              links={[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "/pricing" },
                { label: "Live demo", href: "/demo" },
              ]}
            />
            <FooterCol
              heading="Company"
              links={[
                { label: "About", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Contact", href: "#" },
              ]}
            />
            <FooterCol
              heading="Legal"
              links={[
                { label: "Privacy", href: "#" },
                { label: "Terms", href: "#" },
                { label: "Security", href: "#" },
              ]}
            />
          </div>
        </div>
        <div className="mx-auto max-w-[1120px] px-6 pb-8 text-[12.5px] text-slate-400">
          © {new Date().getFullYear()} InvoiceIQ. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-xs font-bold tracking-[0.07em] text-slate-400 uppercase">{heading}</div>
      {links.map((l) =>
        l.href.startsWith("#") ? (
          <a key={l.label} href={l.href} className="text-[13.5px] text-slate-600 hover:text-slate-900">
            {l.label}
          </a>
        ) : (
          <Link key={l.label} href={l.href} className="text-[13.5px] text-slate-600 hover:text-slate-900">
            {l.label}
          </Link>
        ),
      )}
    </div>
  );
}

/** Hero mock: an invoice being read — scan line sweeps the document while
    extracted fields pop in, then the loop restarts. CSS-only, no JS. */
function HeroMock() {
  const chips = [
    { label: "Vendor", value: "Baltic Office Supplies OÜ", anim: "iql-chip1", valueClass: "text-slate-900" },
    { label: "Total", value: "€1,284.50", anim: "iql-chip2", valueClass: "text-emerald-600 font-bold" },
    { label: "Due date", value: "Aug 12, 2026", anim: "iql-chip3", valueClass: "text-slate-900" },
  ];
  return (
    <div
      data-iql-anim
      className="relative min-w-0"
      style={{ animation: "iql-rise .8s cubic-bezier(.22,1,.36,1) .2s both" }}
    >
      <div
        data-iql-anim
        className="relative rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
        style={{ animation: "iql-float 7s ease-in-out infinite" }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText className="size-[17px] shrink-0 text-slate-500" strokeWidth={2} />
            <span className="truncate text-[13px] font-semibold text-slate-700">invoice_2041.pdf</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap text-indigo-700">
            <span
              data-iql-anim
              className="size-[7px] rounded-full bg-indigo-600"
              style={{ animation: "iql-pulse 1.4s ease-in-out infinite" }}
            />
            AI extracting
          </div>
        </div>

        <div className="flex flex-wrap gap-[18px] pt-4">
          {/* Faux document + scan line */}
          <div className="relative box-border h-[252px] flex-none basis-[190px] overflow-hidden rounded-xl border border-slate-200 bg-[#fcfcfd] p-4">
            <div className="flex items-start justify-between">
              <div className="size-[34px] rounded-lg bg-slate-100" />
              <div className="flex flex-col items-end gap-1.5">
                <div className="h-[7px] w-[58px] rounded bg-slate-200" />
                <div className="h-[7px] w-10 rounded bg-slate-100" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-[7px]">
              <div className="h-2 w-[74%] rounded bg-slate-200" />
              <div className="h-2 w-[52%] rounded bg-slate-100" />
            </div>
            <div className="mt-[18px] flex flex-col gap-[9px]">
              {[
                ["52%", "20%"],
                ["60%", "16%"],
                ["45%", "22%"],
                ["56%", "18%"],
              ].map(([a, b], i) => (
                <div key={i} className="flex justify-between gap-2">
                  <div className="h-[7px] rounded bg-slate-100" style={{ width: a }} />
                  <div className="h-[7px] rounded bg-slate-200" style={{ width: b }} />
                </div>
              ))}
            </div>
            <div className="absolute right-4 bottom-3.5 left-4 flex items-center justify-between border-t border-slate-200 pt-2.5">
              <div className="h-2 w-[34%] rounded bg-slate-200" />
              <div className="h-2.5 w-[26%] rounded bg-indigo-200" />
            </div>
            {/* Scan sweep */}
            <div
              data-iql-anim
              className="pointer-events-none absolute inset-x-0 top-0 h-[52px]"
              style={{ animation: "iql-scan 5.6s ease-in-out infinite" }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, rgba(79,70,229,0.10) 60%, rgba(79,70,229,0.22))",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.8)]" />
            </div>
          </div>

          {/* Extracted fields */}
          <div className="flex min-w-[190px] flex-1 flex-col gap-2.5">
            <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
              Extracted fields
            </div>
            {chips.map((chip) => (
              <div
                key={chip.label}
                data-iql-anim
                className="flex items-center gap-2.5 rounded-[11px] border border-slate-200 bg-white px-3 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
                style={{ animation: `${chip.anim} 5.6s ease-in-out infinite` }}
              >
                <span className="flex size-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="size-[11px]" strokeWidth={3} />
                </span>
                <div className="min-w-0">
                  <div className="text-[10.5px] font-semibold tracking-[0.05em] text-slate-400 uppercase">
                    {chip.label}
                  </div>
                  <div className={`truncate text-[13.5px] font-semibold ${chip.valueClass}`}>
                    {chip.value}
                  </div>
                </div>
              </div>
            ))}
            <div
              data-iql-anim
              className="inline-flex items-center gap-1.5 self-start rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
              style={{ animation: "iql-badge 5.6s ease-in-out infinite" }}
            >
              <List className="size-[13px]" strokeWidth={2.2} />
              12 line items detected
            </div>
          </div>
        </div>
      </div>

      {/* Floating "parsed" badge */}
      <div
        data-iql-anim
        className="absolute -bottom-4 right-4 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-[12.5px] font-semibold text-white shadow-[0_10px_26px_rgba(15,23,42,0.28)]"
        style={{ animation: "iql-badge 5.6s ease-in-out infinite" }}
      >
        <Zap className="size-3.5 text-emerald-400" strokeWidth={2.4} fill="currentColor" />
        Parsed in 2.3s
      </div>
    </div>
  );
}
