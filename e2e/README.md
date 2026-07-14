# E2E tests (Playwright)

Two flows (SPEC success criteria):

1. **upload.spec.ts** — demo user signs in, uploads a fixture invoice, an extraction result appears.
2. **quota-checkout.spec.ts** — free user at quota → pricing → Stripe test checkout → quota lifted.

## Prerequisites

These tests drive **real** Clerk / Stripe / OpenAI / Blob, so they need live setup:

1. `npx playwright install chromium` (one-time — download the browser).
2. Env vars (in `.env`, read by the tests):
   - `E2E_DEMO_EMAIL` / `E2E_DEMO_PASSWORD` — a Clerk user **not** at the free quota (or Pro), for test 1.
   - `E2E_FREE_EMAIL` / `E2E_FREE_PASSWORD` — a **free** Clerk user already at **5/5** documents this month, for test 2.
   - Existing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` (used by Clerk's testing tokens), `BLOB_READ_WRITE_TOKEN`, `OPENAI_API_KEY`, and the Stripe keys.
   - Tests without their credentials set are **skipped** (not failed).
3. For **test 2 only**: run `stripe listen --forward-to localhost:3000/api/stripe/webhook` in a separate terminal so the webhook flips the plan to Pro (the UI never trusts `?success=true`).
4. Replace `e2e/fixtures/sample-invoice.png` (a placeholder) with a **real invoice image** if you want test 1 to assert the green "Extracted" success state specifically; otherwise it asserts any terminal result.

## Run

```
pnpm dev                 # or let Playwright start it (webServer)
pnpm test:e2e            # runs both specs
pnpm test:e2e --ui       # interactive
```

> Note: the checkout test automates Stripe's hosted checkout page, whose DOM/selectors can change; adjust the field selectors in `quota-checkout.spec.ts` if Stripe updates their form.
