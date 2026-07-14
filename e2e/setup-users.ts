/**
 * e2e:setup — provisions the two dedicated E2E test users, idempotently.
 *
 * - Creates (or reuses) the Clerk users from credentials.ts.
 * - Resets their app data so each test run starts from a known state:
 *     demo → free, 0/5 used (can upload)
 *     free → free, 5/5 used (at quota), any Stripe sub canceled
 *
 * Run: pnpm e2e:setup   (loads .env via --env-file)
 */
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import Stripe from "stripe";

import * as schema from "../src/server/db/schema";
import { invoices, subscriptions, usageCounters, users } from "../src/server/db/schema";
import { DEMO_USER, FREE_USER } from "./credentials";

const CLERK_API = "https://api.clerk.com/v1";
const databaseUrl = process.env.DATABASE_URL;
const clerkKey = process.env.CLERK_SECRET_KEY;
if (!databaseUrl || !clerkKey) {
  throw new Error("DATABASE_URL and CLERK_SECRET_KEY are required (run via pnpm e2e:setup).");
}

const db = drizzle(neon(databaseUrl), { schema });
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" })
  : null;

const currentPeriod = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

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
      last_name: rest.join(" ") || "User",
    }),
  });
  if (!res.ok) {
    throw new Error(`Clerk createUser failed for ${email}: ${res.status} ${await res.text()}`);
  }
  const user = await res.json();
  return user.id as string;
}

async function cancelStripeSubs(userId: string) {
  if (!stripe) return;
  const subs = await stripe.subscriptions.list({ status: "all", limit: 100 });
  for (const s of subs.data) {
    if (
      s.metadata?.userId === userId &&
      !["canceled", "incomplete_expired"].includes(s.status)
    ) {
      await stripe.subscriptions.cancel(s.id);
    }
  }
}

async function resetUser(clerkId: string, email: string, name: string, usedDocs: number) {
  await db
    .insert(users)
    .values({ id: clerkId, email, name })
    .onConflictDoUpdate({ target: users.id, set: { email, name } });

  await cancelStripeSubs(clerkId);
  await db.delete(subscriptions).where(eq(subscriptions.userId, clerkId));
  await db.delete(invoices).where(eq(invoices.userId, clerkId)); // cascades line items

  await db.delete(usageCounters).where(eq(usageCounters.userId, clerkId));
  if (usedDocs > 0) {
    await db
      .insert(usageCounters)
      .values({ userId: clerkId, period: currentPeriod(), documentsUsed: usedDocs });
  }
}

async function main() {
  const demoId = await ensureClerkUser(DEMO_USER.email, DEMO_USER.password, DEMO_USER.name);
  await resetUser(demoId, DEMO_USER.email, DEMO_USER.name, 0);

  const freeId = await ensureClerkUser(FREE_USER.email, FREE_USER.password, FREE_USER.name);
  await resetUser(freeId, FREE_USER.email, FREE_USER.name, 5);

  console.log("✓ e2e:setup complete");
  console.log(`  demo (free, 0/5): ${DEMO_USER.email} → ${demoId}`);
  console.log(`  free (free, 5/5): ${FREE_USER.email} → ${freeId}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("e2e:setup failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
