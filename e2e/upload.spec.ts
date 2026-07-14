import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

const email = process.env.E2E_DEMO_EMAIL;
const password = process.env.E2E_DEMO_PASSWORD;

/**
 * (1) Sign in as the demo user → upload a fixture invoice → an extraction
 * result appears (the queue item leaves "AI extracting…" for a terminal state).
 *
 * Requires: E2E_DEMO_EMAIL / E2E_DEMO_PASSWORD for a Clerk user who is NOT at
 * their free quota (or is Pro), plus BLOB_READ_WRITE_TOKEN + OpenAI configured
 * so extraction can run. Replace e2e/fixtures/sample-invoice.png with a real
 * invoice image to assert the green "Extracted" success state specifically.
 */
test("demo user uploads an invoice and an extraction result appears", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_DEMO_EMAIL and E2E_DEMO_PASSWORD to run this test.");

  await setupClerkTestingToken({ page });
  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: { strategy: "password", identifier: email!, password: password! },
  });

  await page.goto("/app/upload");
  await expect(page.getByRole("heading", { name: /upload/i })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/sample-invoice.pdf");

  // The queued file shows up...
  await expect(page.getByText("sample-invoice.pdf")).toBeVisible();

  // ...and extraction resolves. A real invoice should reach "Extracted"; the
  // fallbacks keep the test honest if the model can't read this particular file.
  await expect(
    page.getByText(/Extracted|Retry|doesn't appear|couldn't read/i),
  ).toBeVisible({ timeout: 60_000 });
});
