import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

/**
 * "Use demo account" on the sign-in page signs into the seeded demo account
 * (one click, via a Clerk sign-in token) and lands on the dashboard.
 *
 * Prereq: run `pnpm demo:setup` first (creates + seeds the demo account).
 */
test("Use demo account signs in and lands on the dashboard", async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto("/sign-in");

  await page.getByRole("button", { name: /use demo account/i }).click();

  await page.waitForURL(/\/app(\/|$)/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible({
    timeout: 20_000,
  });
});
