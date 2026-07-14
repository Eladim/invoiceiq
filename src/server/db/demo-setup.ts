/**
 * demo:setup — provisions the public demo account (idempotent).
 * Creates/reuses the demo Clerk user, then seeds it with sample invoices.
 * Run: pnpm demo:setup
 */
import { DEMO_EMAIL, DEMO_NAME } from "../../lib/demo";
import { seedDemoData } from "./seed-data";

const CLERK_API = "https://api.clerk.com/v1";
const clerkKey = process.env.CLERK_SECRET_KEY;
if (!clerkKey) {
  throw new Error("CLERK_SECRET_KEY is required (run via pnpm demo:setup).");
}

async function ensureClerkUser(email: string, password: string, name: string): Promise<string> {
  const headers = { Authorization: `Bearer ${clerkKey}`, "Content-Type": "application/json" };

  const found = await fetch(`${CLERK_API}/users?email_address=${encodeURIComponent(email)}`, {
    headers,
  });
  if (found.ok) {
    const data = await found.json();
    if (Array.isArray(data) && data.length > 0) return data[0].id as string;
  }

  const [first, ...rest] = name.split(" ");
  const res = await fetch(`${CLERK_API}/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email_address: [email],
      password,
      first_name: first,
      last_name: rest.join(" ") || "Account",
    }),
  });
  if (!res.ok) {
    throw new Error(`Clerk createUser failed for ${email}: ${res.status} ${await res.text()}`);
  }
  const user = await res.json();
  return user.id as string;
}

async function main() {
  const id = await ensureClerkUser(DEMO_EMAIL, "Inv0iceIQ-demo-2026!", DEMO_NAME);
  // Free plan, with room to upload a few (2/5) so reviewers can try extraction.
  const r = await seedDemoData(id, { email: DEMO_EMAIL, name: DEMO_NAME, usageThisMonth: 2 });
  console.log(`✓ demo account ready: ${DEMO_EMAIL} → ${id}`);
  console.log(`  ${r.invoices} invoices, ${r.usage}/5 used this month`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("demo:setup failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
