# InvoiceIQ — Technical Specification

AI-powered invoice & receipt parser for small businesses. Upload invoices → AI extracts structured data → dashboard analytics → Stripe subscription gating.

---

## 1. Overview

**Problem:** Small businesses manually retype invoice data into spreadsheets/accounting tools. It's slow and error-prone.

**Solution:** Upload a PDF/image invoice. AI extracts vendor, dates, line items, and totals into structured, searchable data with spend analytics.

**Business model:** Freemium SaaS. Free = 5 documents/month. Pro (€9/mo or €90/yr) = unlimited documents + CSV export + analytics.

**Success criteria (for the portfolio):** a reviewer can sign in with demo credentials, upload a sample invoice, see extraction happen live, hit the free-tier limit, upgrade via Stripe test checkout, and see the limit lifted — all in under 3 minutes.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + TypeScript | Current stable major (16.2 LTS); job's bonus skill, best Vercel integration |
| UI | Tailwind CSS v4 + shadcn/ui | Fast, modern, consistent |
| Database | Postgres on Neon | Serverless, free tier, branches for dev |
| ORM | Drizzle | Type-safe, lightweight, great with Neon |
| Auth | Clerk | Fast setup, prebuilt components, orgs later |
| AI | OpenAI API (gpt-5.6-luna) with Structured Outputs | Vision + guaranteed JSON schema output; see §7 model choice |
| Payments | Stripe (Checkout + Billing Portal + Webhooks) | Required by the job posting |
| File storage | Vercel Blob | Zero-config on Vercel |
| Validation | Zod | Validate AI output + all API inputs |
| Charts | Recharts | Simple, good-looking dashboards |
| Email | Resend (optional) | Receipt / limit-warning emails |
| Testing | Vitest (units) + Playwright (1-2 E2E happy paths) | Shows engineering maturity |

---

## 3. Architecture

```
Browser ──> Next.js (Vercel)
             ├─ Server Actions / Route Handlers
             │    ├─ POST /api/upload        → Vercel Blob + create invoice row (status: processing)
             │    ├─ POST /api/extract       → Claude API → Zod validate → save line items
             │    ├─ POST /api/stripe/checkout → Stripe Checkout Session
             │    ├─ POST /api/stripe/webhook  → sync subscription state to DB
             │    └─ GET  /api/export        → CSV (Pro only)
             ├─ Clerk middleware (auth on all /app routes)
             └─ Neon Postgres (Drizzle)
```

**Key flow — extraction pipeline:**
1. Client uploads file (drag-drop, max 10 MB, pdf/png/jpg only, validated client + server side).
2. Server checks tier quota → rejects with 402 if free limit reached.
3. File → Vercel Blob; invoice row created with `status='processing'`.
4. Server calls OpenAI API: file (as image/PDF) + extraction prompt + JSON schema via Structured Outputs.
5. Response validated with Zod. On failure → 1 retry with error feedback → else `status='failed'` with a user-readable reason.
6. Invoice + line items saved, `status='completed'`. Client polls or uses router.refresh() to show result.
7. Confidence flags: any field the model marks low-confidence renders with a warning icon; user can edit inline (shows you don't blindly trust AI output — big interview talking point).

---

## 4. Database Schema (Drizzle / Postgres)

```
users            — synced from Clerk webhook
  id (clerk id, pk), email, name, created_at

subscriptions
  id pk, user_id fk unique, stripe_customer_id, stripe_subscription_id,
  plan enum('free','pro') default 'free',
  status enum('active','past_due','canceled','trialing'),
  current_period_end timestamptz, created_at, updated_at

invoices
  id uuid pk, user_id fk, blob_url, original_filename,
  status enum('processing','completed','failed'),
  failure_reason text null,
  vendor_name text, vendor_address text,
  invoice_number text, invoice_date date, due_date date,
  currency char(3), subtotal numeric(12,2), tax numeric(12,2), total numeric(12,2),
  category enum('software','office','travel','utilities','marketing','other'),
  confidence jsonb,           -- per-field confidence from the model
  raw_extraction jsonb,       -- full AI response for debugging/audit
  created_at, updated_at
  index (user_id, created_at), index (user_id, vendor_name)

line_items
  id uuid pk, invoice_id fk cascade,
  description text, quantity numeric, unit_price numeric(12,2), amount numeric(12,2)

usage_counters
  user_id fk, period char(7) ('YYYY-MM'), documents_used int default 0,
  pk (user_id, period)        -- quota check = 1 indexed read
```

**Quota rule:** increment `usage_counters` inside the same transaction that creates the invoice row. Free tier check: `documents_used >= 5 AND plan = 'free'` → block.

---

## 5. API Surface

Prefer Server Actions for mutations from your own UI; Route Handlers where an HTTP endpoint is required (webhooks, polling).

| Endpoint / Action | Auth | Purpose |
|---|---|---|
| `uploadInvoice` (action) | user | Validate file, quota check, store blob, create row, kick off extraction |
| `GET /api/invoices/:id/status` | owner | Poll extraction status |
| `updateInvoice` (action) | owner | Inline field corrections |
| `deleteInvoice` (action) | owner | Delete row + blob |
| `POST /api/stripe/checkout` | user | Create Checkout Session (price id from env) |
| `POST /api/stripe/portal` | user | Billing Portal session |
| `POST /api/stripe/webhook` | Stripe sig | See §6 |
| `GET /api/export` | Pro only | CSV of invoices + line items |

**Every** input crosses a Zod schema. Every handler checks ownership (`invoice.user_id === auth.userId`) — never trust ids from the client.

---

## 6. Stripe Integration (the part reviewers scrutinize)

**Products:** one product "InvoiceIQ Pro", two prices (monthly €9, yearly €90). Configure in test mode; put `4242 4242 4242 4242` hint directly on the pricing page.

**Checkout:** server creates Checkout Session with `client_reference_id = userId` and `customer_email`. Success → `/app/billing?success=true`; cancel → `/pricing`.

**Webhooks to handle (minimum):**

- `checkout.session.completed` → create/attach customer, set plan='pro', status='active'
- `customer.subscription.updated` → sync status + `current_period_end` (handles renewals, plan switches)
- `customer.subscription.deleted` → plan='free' (downgrade, keep data, re-apply quota)
- `invoice.payment_failed` → status='past_due' → show banner in app

**Rules:**
- Verify signature with `stripe.webhooks.constructEvent` — reject anything unsigned.
- Webhook handlers must be idempotent (upsert by `stripe_subscription_id`).
- The DB is the source of truth for the UI; Stripe is the source of truth for the DB. Never trust `?success=true` to flip the plan — only the webhook does.
- Test locally with `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

---

## 7. AI Extraction Detail

**Model choice: `gpt-5.6-luna`.** Cheapest GPT-5.6 tier ($1/1M input, $6/1M output, $0.10/1M cached input) but far stronger at document reading than nano-class models. Cost per invoice (~2,000 tokens in, ~700 out) ≈ $0.006 — 100 invoices ≈ $0.62, so extraction quality wins over price at portfolio scale; a botched extraction during a reviewer demo is the worst outcome. Rules:

- Model name in env var (`OPENAI_MODEL=gpt-5.6-luna`) so switching tiers is a one-line change — mention this in the README.
- Keep the system prompt static so repeat extractions hit the $0.10/1M cached-input rate.

**Model call:** OpenAI with Structured Outputs — pass `response_format: { type: "json_schema", strict: true }` with a schema mirroring the Zod schema (or use the SDK's `zodResponseFormat` helper, which converts your Zod schema directly). Guarantees JSON shape.

**Prompt skeleton:**
- System: "You extract structured data from invoices/receipts. If a field is not present, return null — never invent values. Return a confidence of low/medium/high per top-level field."
- User: the document (image or PDF pages) + "Extract into the provided schema. Normalize dates to ISO 8601 and amounts to plain decimals."

**Zod schema (mirror in tool input_schema):**
```ts
const Extraction = z.object({
  vendor_name: z.string().nullable(),
  vendor_address: z.string().nullable(),
  invoice_number: z.string().nullable(),
  invoice_date: z.string().date().nullable(),
  due_date: z.string().date().nullable(),
  currency: z.string().length(3).nullable(),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  total: z.number().nullable(),
  category: z.enum(['software','office','travel','utilities','marketing','other']),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().nullable(),
    unit_price: z.number().nullable(),
    amount: z.number(),
  })),
  confidence: z.record(z.enum(['low','medium','high'])),
});
```

**Guards:** consistency check (`abs(sum(line_items.amount) − subtotal) < 0.05` else flag), 1 retry on Zod failure feeding the validation error back to the model, graceful `failed` status with reason ("This doesn't appear to be an invoice") for junk uploads.

---

## 8. Pages & Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Landing page |
| `/pricing` | public | Tiers + test-card hint |
| `/sign-in`, `/sign-up` | public | Clerk components, demo credentials shown |
| `/app` | auth | Dashboard: stats + charts + recent invoices |
| `/app/invoices` | auth | Table: search, filter, sort, pagination |
| `/app/invoices/[id]` | auth | Detail: doc preview ↔ extracted data, inline edit |
| `/app/upload` | auth | Drag-drop upload + live extraction progress |
| `/app/billing` | auth | Plan, usage meter, upgrade / portal buttons |
| `/app/settings` | auth | Profile, delete account |

---

## 9. Non-Functional Requirements

- **Security:** all AI/Stripe keys server-side only; ownership checks everywhere; file type sniffed server-side (magic bytes, not just extension); rate-limit upload endpoint (e.g. 10/min via Upstash).
- **UX states:** every page has loading (skeletons), empty (helpful illustration + CTA), and error states. No blank screens ever.
- **Performance:** server components by default; client components only for interactivity; paginate invoice list (cursor-based, 20/page).
- **Seed script:** `pnpm seed` creates the demo user with ~30 realistic invoices across 6 months and 8 vendors so charts look alive.
- **README:** problem → demo gif → architecture diagram → stack decisions ("why Drizzle over Prisma") → local setup → env var table.
- **Repo hygiene:** conventional commits, `.env.example`, CI running typecheck + tests on push (GitHub Actions).

---

## 10. Milestones (4 weeks)

| Week | Deliverable |
|---|---|
| 1 | Repo, CI (typecheck + lint + Vitest on push), Clerk auth + webhook handler unit tests, DB schema + migrations, app shell (sidebar/nav), upload → blob storage, deploy to Vercel day 1 |
| 2 | Extraction pipeline end-to-end (+ unit tests for Zod validation & consistency checks), invoice list + detail pages, inline editing, failure handling |
| 3 | Stripe checkout + webhooks (+ unit tests for webhook idempotency) + portal, quota enforcement, billing page, pricing page |
| 4 | Dashboard analytics, landing page, seed data, Playwright E2E (sign-up → upload → extraction visible; upgrade flow), polish all states, README, 2-min demo video |

---
---

# Page-by-Page Design Prompts

Paste each into Claude / v0 / Cursor. First set the shared context once, then use the per-page prompts.

## Shared context (prepend to every prompt or set once per session)

> You are designing pages for **InvoiceIQ**, a SaaS that uses AI to extract structured data from uploaded invoices for small businesses. Stack: Next.js App Router, Tailwind CSS, shadcn/ui, lucide-react icons, Recharts for charts. Design language: clean modern SaaS — generous whitespace, `slate` neutrals, `indigo-600` as the primary accent, `emerald` for success/money, `amber` for warnings, rounded-xl cards with subtle borders (no heavy shadows), Inter font, dark-mode friendly. All pages responsive, mobile-first. Include realistic sample data, never lorem ipsum. Include loading skeleton, empty state, and error state variants for data-driven views.

## 1. Landing page `/`

> Design a landing page for InvoiceIQ. Hero: bold headline "Stop retyping invoices" with subline about AI extraction in seconds, primary CTA "Start free — 5 invoices/month" and secondary "View live demo". Right side of hero: a mock of the app showing an invoice being parsed — a document thumbnail with animated scan line and extracted fields (vendor, total, due date) appearing as green-checked chips. Below: 3-step "How it works" (Upload → AI extracts → Analyze) with icons; a features grid of 6 cards (AI extraction, line-item detail, spend analytics, CSV export, inline corrections, secure storage); a single testimonial band; pricing teaser with two cards (Free / Pro €9) linking to /pricing; footer with links. Sticky top nav with logo, Pricing, Sign in, and a CTA button. Subtle grid-pattern background in the hero only.

## 2. Pricing page `/pricing`

> Design a pricing page with a monthly/yearly toggle (yearly shows "2 months free" badge). Two cards: **Free** — €0, 5 documents/month, basic dashboard, checked/dimmed feature list; **Pro** — €9/mo, highlighted with indigo border and "Most popular" badge, unlimited documents, analytics, CSV export, priority processing. Each card has a full-width CTA. Below the cards: a callout box styled as a terminal/code block telling reviewers "Test mode — use card 4242 4242 4242 4242, any future date, any CVC" with a copy button. Then a 5-item FAQ accordion (cancel anytime, what counts as a document, data privacy, supported file types, refunds).

## 3. Auth pages `/sign-in`, `/sign-up`

> Design a split-screen auth page. Left half: the Clerk sign-in component area centered on white, with the InvoiceIQ logo above. Below the form, a distinct dashed-border card labeled "Reviewing my portfolio?" containing demo credentials (demo@invoiceiq.app / demo1234) with copy buttons and a one-click "Use demo account" button. Right half (hidden on mobile): indigo-950 panel with a product screenshot at a slight tilt, a short value-prop quote, and small trust badges (Stripe, OpenAI, Vercel logos as "Built with").

## 4. Dashboard `/app`

> Design the main dashboard for the app shell (persistent left sidebar: logo, nav — Dashboard, Invoices, Upload, Billing, Settings — with active state, usage meter pinned at the bottom showing "3 of 5 documents used" with a progress bar and an Upgrade link; top bar with page title, search, and Clerk user button). Dashboard content: greeting header with "Upload invoice" primary button; 4 stat cards (Total spend this month with % delta, Invoices processed, Pending review count, Upcoming payments due) each with an icon and sparkline; below, a 2/3 + 1/3 grid — left: "Spend over time" area chart (6 months, Recharts) with range tabs (3m/6m/1y); right: "Top vendors" horizontal bar list with vendor initials avatars and amounts; bottom: "Recent invoices" table (5 rows: vendor, date, total, status badge — completed green / processing amber pulse / failed red) with "View all" link. Include the empty-state variant: friendly illustration, "No invoices yet", big upload CTA.

## 5. Upload page `/app/upload`

> Design an upload experience. Centered large drop zone (dashed border, cloud-upload icon, "Drag & drop invoices or click to browse", "PDF, PNG, JPG · max 10 MB") that highlights indigo on drag-over. Below, an upload queue list where each file is a card progressing through states: uploading (progress bar) → "AI extracting…" (animated shimmer over a skeleton of the fields being read, with a small scanning animation on the file thumbnail) → success (card expands to show extracted vendor, date, total as chips with a "Review" button) → or error (red border, reason like "This file doesn't appear to be an invoice", with Retry and Remove). If the user is on the free tier at their limit, show the drop zone disabled with an overlay card: lock icon, "You've used all 5 free documents this month", Upgrade CTA. Support multiple simultaneous files.

## 6. Invoices list `/app/invoices`

> Design a data-table page for invoices. Toolbar: search input (vendor or invoice #), filter dropdowns (status, category, date range picker), and an "Export CSV" button that shows a Pro-lock tooltip for free users. Table columns: checkbox, vendor (with monogram avatar), invoice #, date, due date, category (colored soft badge per category), total (right-aligned, tabular numbers), status badge, row-actions kebab (View, Edit, Delete). Sortable column headers, sticky header, cursor pagination footer ("Showing 1–20 of 143"). Bulk-select action bar slides in from bottom when rows are checked (Delete selected, Export selected). Include skeleton-row loading variant and a no-results variant for empty filter matches ("No invoices match — clear filters").

## 7. Invoice detail `/app/invoices/[id]`

> Design a two-pane invoice review screen. Header: back link, vendor name as title, status badge, actions (Export, Delete, "Reprocess with AI"). Left pane (55%): the original document preview in a bordered container with zoom controls and page navigation for multi-page PDFs. Right pane (45%): extracted data as editable sections — Summary card (invoice #, dates, category select) and Amounts card (subtotal, tax, total); each field shows a small confidence indicator (green dot high, amber dot low — amber fields get a subtle highlighted background and a tooltip "AI wasn't sure — please verify"); clicking a field turns it into an inline input with save/cancel. Below: line-items table (description, qty, unit price, amount) with editable rows and a footer sum that turns red with a warning icon if line items don't add up to the subtotal. Save bar appears at the bottom only when there are unsaved changes.

## 8. Billing page `/app/billing`

> Design a billing/subscription page. Current-plan card: plan name with badge, price, renewal date, "Manage subscription" button (opens Stripe portal) for Pro — or for free users, a usage section (progress bar "3 of 5 documents used, resets Aug 1") and an upgrade panel comparing Free vs Pro in two compact columns with an "Upgrade to Pro" indigo CTA. Below: payment method row (card brand icon, •••• 4242, expiry) and a billing-history table (date, description, amount, status, invoice PDF download icon). Include a dismissible amber banner variant for `past_due` status: "Your last payment failed — update your payment method to keep Pro features."

## 9. Settings page `/app/settings`

> Design a simple settings page with a two-tab layout (Profile, Danger zone). Profile: avatar upload, name and email fields (email read-only, managed by auth provider), save button. Danger zone: red-bordered card with "Delete account and all data" — clicking opens a confirmation dialog requiring the user to type DELETE, explaining that invoices, files, and the subscription will be permanently removed.

---

## Design prompt usage tips

- Generate one page at a time; feed the previous page's output back so components stay consistent.
- After generating, ask a follow-up: "Extract the repeated pieces (StatCard, StatusBadge, EmptyState, DataTable) into reusable components."
- Ask for the dark-mode variant only after the light version is right.
