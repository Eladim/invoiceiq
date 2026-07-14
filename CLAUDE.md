@AGENTS.md

# InvoiceIQ

AI invoice parser SaaS. Full spec in SPEC.md — read it before large tasks.

## Stack
Next.js 16 App Router + TS strict, Tailwind v4 + shadcn/ui, Drizzle + Neon Postgres,
Clerk auth, Stripe subscriptions, OpenAI gpt-5.6-luna via Structured Outputs, Vercel Blob.

## Conventions
- Server Components by default; "use client" only when interactive.
- Mutations = Server Actions in src/server/actions/; HTTP-required endpoints (webhooks, polling) = route handlers in src/app/api/.
- All external input crosses a Zod schema in src/lib/validations/.
- Every DB query scoped to the authenticated user — check ownership, never trust client ids.
- DB schema in src/server/db/schema.ts; use drizzle-kit migrations, never push raw SQL.
- Secrets only via process.env, typed in src/lib/env.ts (validate with Zod at boot). Model name from OPENAI_MODEL.
- UI: shadcn/ui components; every data view has loading, empty, and error states.
- Money = numeric strings from DB, format with Intl.NumberFormat. Dates ISO 8601.
- Conventional commits (feat:, fix:, chore:). Small commits per feature.
- Don't run git commit — the user commits. After any substantial change, end the reply with a suggested conventional-commit message for them to use.

## Commands
pnpm dev / pnpm build / pnpm lint / pnpm typecheck / pnpm test
pnpm db:generate / pnpm db:migrate / pnpm db:seed
pnpm demo:setup — create/reset the public demo account (re-run to reset its data + usage to 2/5)
pnpm e2e:setup — provision the two +clerk_test E2E users; pnpm test:e2e — run Playwright (needs `npx playwright install chromium`)
stripe listen --forward-to localhost:3000/api/stripe/webhook

## Definition of done
Typecheck passes, feature works against real services in dev, deployed preview works.

## Notes
- Extraction is live: `gpt-5.6-luna` is a real model; `run.ts` reads the private blob via `get(..., { access: "private" })` and calls Structured Outputs. `confidence` must stay a fixed-key object (not `z.record`) for OpenAI strict mode.