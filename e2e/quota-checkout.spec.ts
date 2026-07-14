import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

const email = process.env.E2E_FREE_EMAIL;
const password = process.env.E2E_FREE_PASSWORD;

/**
 * (2) Free user at quota → pricing → Stripe test checkout → quota lifted.
 *
 * Requires: E2E_FREE_EMAIL / E2E_FREE_PASSWORD for a FREE Clerk user already at
 * 5/5 documents this month, AND `stripe listen --forward-to
 * localhost:3000/api/stripe/webhook` running so the webhook flips the plan to
 * Pro (the UI never trusts ?success=true — SPEC §6).
 */
test("free user hits quota, upgrades via checkout, and the limit is lifted", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_FREE_EMAIL and E2E_FREE_PASSWORD to run this test.");

  await setupClerkTestingToken({ page });
  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: { strategy: "password", identifier: email!, password: password! },
  });

  // At quota, the upload page shows the Pro-lock overlay with an upgrade path.
  await page.goto("/app/upload");
  await expect(page.getByText(/used all 5 free documents/i)).toBeVisible();

  // Go to pricing and start checkout (monthly).
  await page.goto("/pricing");
  await page.getByRole("button", { name: /Upgrade to Pro|€9\/mo|Get started/i }).first().click();

  // Stripe-hosted Checkout.
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
  await page.getByPlaceholder("1234 1234 1234 1234").fill("4242 4242 4242 4242");
  await page.getByPlaceholder("MM / YY").fill("12 / 34");
  await page.getByPlaceholder("CVC").fill("123");
  const name = page.getByPlaceholder("Full name on card");
  if (await name.isVisible().catch(() => false)) await name.fill("Demo User");
  await page.getByTestId("hosted-payment-submit-button").click();

  // Back in the app; the webhook (via `stripe listen`) flips the plan to Pro.
  await page.waitForURL(/\/app\/billing/, { timeout: 30_000 });
  await expect(page.getByText(/^Pro$/)).toBeVisible({ timeout: 30_000 });

  // Quota is lifted — the upload page no longer shows the limit overlay.
  await page.goto("/app/upload");
  await expect(page.getByText(/used all 5 free documents/i)).toBeHidden();
});
