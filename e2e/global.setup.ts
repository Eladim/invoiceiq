import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

// Configures Clerk testing tokens (bypasses bot protection) using the app's
// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY.
setup("clerk setup", async () => {
  await clerkSetup();
});
