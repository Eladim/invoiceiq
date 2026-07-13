"use server";

import { randomUUID } from "node:crypto";

import { auth, currentUser } from "@clerk/nextjs/server";
import { del, put } from "@vercel/blob";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { FREE_DOCUMENT_LIMIT } from "@/lib/constants";
import { env } from "@/lib/env";
import {
  EXTENSION_FOR_MIME,
  sniffMimeType,
  uploadFileSchema,
} from "@/lib/validations/upload";
import { db } from "@/server/db";
import { withTransaction } from "@/server/db/transaction";
import { invoices, subscriptions, usageCounters, users } from "@/server/db/schema";
import { runExtractionForInvoice } from "@/server/extraction/run";

export type UploadResult =
  | { ok: true; invoiceId: string }
  | {
      ok: false;
      code: "unauthorized" | "invalid_file" | "quota_exceeded" | "upload_failed";
      message: string;
    };

/** Thrown inside the transaction to trigger a rollback when the quota is hit. */
class QuotaExceededError extends Error {}

function currentPeriod(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * SPEC §3 steps 1–3: validate the file (type/size + magic bytes), enforce the
 * free-tier quota, store the file in Vercel Blob, and create the invoice row
 * with status='processing'. AI extraction (steps 4+) is a later step.
 */
export async function uploadInvoice(formData: FormData): Promise<UploadResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, code: "unauthorized", message: "You must be signed in." };
  }

  // 1. Shape validation (size + declared type).
  const parsed = uploadFileSchema.safeParse({ file: formData.get("file") });
  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid_file",
      message: parsed.error.issues[0]?.message ?? "Invalid file.",
    };
  }
  const { file } = parsed.data;

  // 1b. Sniff real content from magic bytes — never trust the declared type.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffMimeType(bytes);
  if (!mime) {
    return {
      ok: false,
      code: "invalid_file",
      message: "This file isn't a valid PDF, PNG, or JPG.",
    };
  }

  // 2. Cheap pre-check to avoid uploading when the free limit is already spent.
  //    The transaction below is the authoritative, race-safe enforcement.
  const period = currentPeriod();
  const preUsage = await db.query.usageCounters.findFirst({
    where: (u, { and, eq: eqOp }) =>
      and(eqOp(u.userId, userId), eqOp(u.period, period)),
    columns: { documentsUsed: true },
  });
  const preSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { plan: true },
  });
  if ((preSub?.plan ?? "free") === "free" && (preUsage?.documentsUsed ?? 0) >= FREE_DOCUMENT_LIMIT) {
    return {
      ok: false,
      code: "quota_exceeded",
      message: `You've used all ${FREE_DOCUMENT_LIMIT} free documents this month.`,
    };
  }

  if (!env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      code: "upload_failed",
      message: "File storage is not configured (set BLOB_READ_WRITE_TOKEN).",
    };
  }

  // 3. Store the file in Vercel Blob.
  let blobUrl: string;
  try {
    const ext = EXTENSION_FOR_MIME[mime];
    const blob = await put(`invoices/${userId}/${randomUUID()}.${ext}`, file, {
      // The provisioned Blob store is private; invoice documents are sensitive.
      access: "private",
      contentType: mime,
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    blobUrl = blob.url;
  } catch (err) {
    console.error("Blob upload failed:", err);
    return { ok: false, code: "upload_failed", message: "Could not store the file. Try again." };
  }

  // 3b. Atomically: ensure the user exists, increment usage, enforce quota,
  //     and create the invoice row — all in one transaction (SPEC §4).
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    `${userId}@users.invoiceiq.app`;
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;

  try {
    const invoiceId = await withTransaction(async (tx) => {
      await tx
        .insert(users)
        .values({ id: userId, email, name })
        .onConflictDoUpdate({ target: users.id, set: { email, name } });

      const sub = await tx.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
        columns: { plan: true },
      });
      const plan = sub?.plan ?? "free";

      // Atomic upsert-increment; the row lock makes concurrent uploads safe.
      const [counter] = await tx
        .insert(usageCounters)
        .values({ userId, period, documentsUsed: 1 })
        .onConflictDoUpdate({
          target: [usageCounters.userId, usageCounters.period],
          set: { documentsUsed: sql`${usageCounters.documentsUsed} + 1` },
        })
        .returning({ used: usageCounters.documentsUsed });

      if (plan === "free" && counter.used > FREE_DOCUMENT_LIMIT) {
        throw new QuotaExceededError();
      }

      const [invoice] = await tx
        .insert(invoices)
        .values({
          userId,
          blobUrl,
          originalFilename: file.name,
          status: "processing",
        })
        .returning({ id: invoices.id });

      return invoice.id;
    });

    // Kick off AI extraction after the response is sent (SPEC §3 steps 4–7).
    after(() => runExtractionForInvoice(invoiceId));

    revalidatePath("/app", "layout");
    return { ok: true, invoiceId };
  } catch (err) {
    // Roll back the stored file so we don't leak an orphan blob.
    await del(blobUrl, { token: env.BLOB_READ_WRITE_TOKEN }).catch(() => {});

    if (err instanceof QuotaExceededError) {
      return {
        ok: false,
        code: "quota_exceeded",
        message: `You've used all ${FREE_DOCUMENT_LIMIT} free documents this month.`,
      };
    }
    console.error("Invoice creation failed:", err);
    return { ok: false, code: "upload_failed", message: "Something went wrong. Try again." };
  }
}
