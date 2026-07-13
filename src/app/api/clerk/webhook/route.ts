import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";

/**
 * Clerk webhook — keeps the local `users` table in sync with Clerk (SPEC §4).
 * verifyWebhook() checks the Standard Webhooks signature using
 * CLERK_WEBHOOK_SIGNING_SECRET; unsigned/invalid requests are rejected.
 * This route is intentionally public (proxy.ts only protects /app).
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, primary_email_address_id, first_name, last_name } = evt.data;

        const email =
          email_addresses.find((e) => e.id === primary_email_address_id)?.email_address ??
          email_addresses[0]?.email_address;

        if (!email) {
          console.error(`Clerk webhook ${evt.type}: user ${id} has no email address`);
          return new Response("User has no email address", { status: 400 });
        }

        const name = [first_name, last_name].filter(Boolean).join(" ") || null;

        await db
          .insert(users)
          .values({ id, email, name })
          .onConflictDoUpdate({ target: users.id, set: { email, name } });
        break;
      }

      case "user.deleted": {
        if (evt.data.id) {
          await db.delete(users).where(eq(users.id, evt.data.id));
        }
        break;
      }

      default:
        // Ignore event types we don't sync.
        break;
    }
  } catch (err) {
    console.error(`Clerk webhook handler error for ${evt.type}:`, err);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
