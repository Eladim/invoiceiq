"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DEMO_EMAIL } from "@/lib/demo";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { invoices, subscriptions, users } from "@/server/db/schema";

export type ActionResult = { ok: true } | { ok: false; error: string };

function emailOf(user: { primaryEmailAddress?: { emailAddress: string } | null; emailAddresses?: { emailAddress: string }[] }): string {
  return user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? "";
}

const profileSchema = z.object({
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
});

/**
 * Update the caller's display name. Clerk owns the profile, so we write there
 * first; the local `users.name` is kept in sync (also covered by the Clerk
 * user.updated webhook, but we update directly so the change is immediate).
 */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in." };

  const user = await currentUser();
  if (user && emailOf(user) === DEMO_EMAIL) {
    return { ok: false, error: "The shared demo account can't be edited." };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please enter a valid name." };
  const { firstName, lastName } = parsed.data;

  try {
    const clerk = await clerkClient();
    await clerk.users.updateUser(userId, { firstName, lastName });

    const name = [firstName, lastName].filter(Boolean).join(" ") || null;
    await db.update(users).set({ name }).where(eq(users.id, userId));

    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (err) {
    console.error("updateProfile failed:", err);
    return { ok: false, error: "Couldn't save your changes. Please try again." };
  }
}

/**
 * Permanently delete the caller's account and all data (SPEC §8 Danger zone):
 * cancel any Stripe subscription, delete stored invoice files, delete the Clerk
 * user, then remove the local row (invoices, line items, usage and subscription
 * cascade via FKs). Best-effort on external services so a partial failure can't
 * strand the user; the DB row is the last thing removed.
 */
export async function deleteAccount(): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in." };

  // Confirm the caller matches the session before anything destructive.
  const user = await currentUser();
  if (!user || user.id !== userId) return { ok: false, error: "Not signed in." };

  // The public demo account is shared — never let a visitor delete it.
  if (emailOf(user) === DEMO_EMAIL) {
    return { ok: false, error: "The shared demo account can't be deleted." };
  }

  // 1. Cancel the Stripe subscription so billing stops (best-effort).
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { stripeSubscriptionId: true },
  });
  if (sub?.stripeSubscriptionId && env.STRIPE_SECRET_KEY) {
    try {
      await getStripe().subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (err) {
      console.error("Stripe cancel during account deletion failed:", err);
    }
  }

  // 2. Delete stored invoice files (best-effort — DB cascade removes the rows).
  if (env.BLOB_READ_WRITE_TOKEN) {
    const rows = await db.query.invoices.findMany({
      where: eq(invoices.userId, userId),
      columns: { blobUrl: true },
    });
    await Promise.all(
      rows.map((r) =>
        del(r.blobUrl, { token: env.BLOB_READ_WRITE_TOKEN }).catch(() => {}),
      ),
    );
  }

  // 3. Delete the Clerk user. Do this before the DB row so a failure here leaves
  //    the account intact and recoverable rather than orphaning auth.
  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);
  } catch (err) {
    console.error("Clerk user deletion failed:", err);
    return { ok: false, error: "Couldn't delete your account. Please try again." };
  }

  // 4. Remove the local row; invoices, line items, usage and subscription
  //    cascade via ON DELETE CASCADE.
  await db.delete(users).where(eq(users.id, userId));

  return { ok: true };
}
