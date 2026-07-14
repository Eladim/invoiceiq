// Fixed credentials for the dedicated E2E test users (test-mode only).
// `pnpm e2e:setup` creates/reuses these in Clerk and resets their data.
// `+clerk_test@example.com` = Clerk's designated test emails (valid format, no
// real email sent, safe for automated tests).
export const DEMO_USER = {
  email: "e2e-demo+clerk_test@example.com",
  password: "Inv0iceIQ-e2e-2026!",
  name: "E2E Demo",
};

export const FREE_USER = {
  email: "e2e-free+clerk_test@example.com",
  password: "Inv0iceIQ-e2e-2026!",
  name: "E2E Free",
};
