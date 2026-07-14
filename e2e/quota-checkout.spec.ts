import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

import { FREE_USER } from "./credentials";

/**
 * (2) Free user at quota → pricing → Stripe test checkout → quota lifted.
 *
 * Prereqs: run `pnpm e2e:setup` (creates the free user at 5/5), AND
 * `stripe listen --forward-to localhost:3000/api/stripe/webhook` running so the
 * webhook flips the plan to Pro (the UI never trusts ?success=true — SPEC §6).
 */
test("free user hits quota, upgrades via checkout, and the limit is lifted", async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.loaded({ page });
  await clerk.signIn({ page, signInParams: { strategy: "email_code", identifier: FREE_USER.email } });

  // At quota, the upload page shows the Pro-lock overlay with an upgrade path.
  await page.goto("/app/upload");
  await expect(page.getByText(/used all 5 free documents/i)).toBeVisible();

  // Go to pricing and start checkout (monthly).
  await page.goto("/pricing");
  await page.getByRole("button", { name: /Upgrade to Pro|€9\/mo|Get started/i }).first().click();

  // Stripe-hosted Checkout.
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
  const emailField = page.getByPlaceholder("you@example.com");
  if (await emailField.isVisible().catch(() => false)) await emailField.fill(FREE_USER.email);
  await page.getByPlaceholder("1234 1234 1234 1234").fill("4242 4242 4242 4242");
  await page.getByPlaceholder("MM / YY").fill("12 / 34");
  await page.getByPlaceholder("CVC").fill("123");
  const name = page.getByPlaceholder("Full name on card");
  if (await name.isVisible().catch(() => false)) await name.fill("E2E Free");
  const zip = page.getByPlaceholder("12345");
  if (await zip.isVisible().catch(() => false)) await zip.fill("12345");
  await page.getByTestId("hosted-payment-submit-button").click();

  // Back in the app. The webhook (via `stripe listen`) flips the plan to Pro;
  // the billing page only reflects it after a reload, so poll with reloads.
  await page.waitForURL(/\/app\/billing/, { timeout: 30_000 });
  await expect(async () => {
    await page.reload();
    await expect(page.getByText("Pro", { exact: true }).first()).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 45_000 });

  // Quota is lifted — the upload page no longer shows the limit overlay.
  await page.goto("/app/upload");
  await expect(page.getByText(/used all 5 free documents/i)).toBeHidden();
});
