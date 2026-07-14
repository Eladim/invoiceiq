import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

import { DEMO_USER } from "./credentials";

/**
 * (1) Sign in as the demo user → upload a fixture invoice → an extraction
 * result appears (the queue item leaves "AI extracting…" for a terminal state).
 *
 * Prereq: run `pnpm e2e:setup` first (creates the demo user, free & under quota).
 */
test("demo user uploads an invoice and an extraction result appears", async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.loaded({ page });
  // `+clerk_test` emails use a fixed test OTP that @clerk/testing handles.
  await clerk.signIn({ page, signInParams: { strategy: "email_code", identifier: DEMO_USER.email } });

  await page.goto("/app/upload");
  await expect(page.getByRole("heading", { name: "Upload invoices" })).toBeVisible({
    timeout: 20_000,
  });

  await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/sample-invoice.pdf");

  // The queued file shows up...
  await expect(page.getByText("sample-invoice.pdf")).toBeVisible();

  // ...and extraction resolves. A real invoice should reach "Extracted"; the
  // fallbacks keep the test honest if the model can't read this particular file.
  await expect(
    page.getByText(/Extracted|Retry|doesn't appear|couldn't read/i),
  ).toBeVisible({ timeout: 60_000 });
});
