# E2E tests (Playwright)

Two flows (SPEC success criteria):

1. **upload.spec.ts** — demo user signs in, uploads a fixture invoice, an extraction result appears.
2. **quota-checkout.spec.ts** — free user at quota → pricing → Stripe test checkout → quota lifted.

## Setup

The tests sign in through **Clerk** (real auth), so they need real Clerk users —
`pnpm e2e:setup` provisions them for you (idempotent create-or-reuse) and resets
their data each run:

- `e2e-demo@invoiceiq.test` → free, **0/5** used (can upload) — test 1
- `e2e-free@invoiceiq.test` → free, **5/5** used, any Stripe sub canceled — test 2

Credentials live in `e2e/credentials.ts` (test-mode only).

### One-time
```
npx playwright install chromium
```
Needs (already in `.env`): `DATABASE_URL`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`,
`BLOB_READ_WRITE_TOKEN`, `OPENAI_API_KEY`. Clerk instance must allow **password sign-in**.

## Run
```
pnpm e2e:setup                                              # create/reset the 2 test users
stripe listen --forward-to localhost:3000/api/stripe/webhook   # test 2 only, keep running
pnpm dev                                                    # or let Playwright start it
pnpm test:e2e
```

Re-run `pnpm e2e:setup` before each run of test 2 (it upgrades the free user to Pro,
so the starting "at quota" state must be reset).

> Note: the checkout test automates Stripe's hosted page, whose selectors can change —
> adjust `quota-checkout.spec.ts` if Stripe updates their form.
