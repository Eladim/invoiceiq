"use server";

import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import type { FieldConfidence } from "@/server/db/schema";
import { updateInvoiceSchema } from "@/lib/validations/invoice-update";
import { db } from "@/server/db";
import { invoices, lineItems } from "@/server/db/schema";
import { withTransaction } from "@/server/db/transaction";
import { runExtractionForInvoice } from "@/server/extraction/run";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type DeleteInvoiceResult = ActionResult;

const money = (n: number | null) => (n === null ? null : n.toFixed(2));

/**
 * Delete an invoice the caller owns, plus its stored file. Line items cascade
 * via the FK. Ownership is enforced in the query (SPEC §5) — never trust the id.
 */
export async function deleteInvoice(id: string): Promise<DeleteInvoiceResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in." };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Invalid invoice." };

  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.userId, userId)),
    columns: { id: true, blobUrl: true },
  });
  if (!invoice) return { ok: false, error: "Invoice not found." };

  if (env.BLOB_READ_WRITE_TOKEN) {
    await del(invoice.blobUrl, { token: env.BLOB_READ_WRITE_TOKEN }).catch(() => {});
  }
  await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));

  revalidatePath("/app/invoices");
  revalidatePath("/app", "layout");
  return { ok: true };
}

/**
 * Apply inline edits to an invoice + its line items (SPEC §8). Zod-validated,
 * ownership-checked, atomic. Fields the user changed are marked high-confidence.
 */
export async function updateInvoice(input: unknown): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in." };

  const parsed = updateInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }
  const data = parsed.data;

  const existing = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, data.id), eq(invoices.userId, userId)),
    columns: { id: true, confidence: true },
  });
  if (!existing) return { ok: false, error: "Invoice not found." };

  const confidence: FieldConfidence = { ...(existing.confidence ?? {}) };
  for (const key of data.changedFields) confidence[key] = "high";

  await withTransaction(async (tx) => {
    await tx
      .update(invoices)
      .set({
        vendorName: data.vendorName,
        vendorAddress: data.vendorAddress,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        currency: data.currency,
        category: data.category,
        subtotal: money(data.subtotal),
        tax: money(data.tax),
        total: money(data.total),
        confidence,
      })
      .where(and(eq(invoices.id, data.id), eq(invoices.userId, userId)));

    await tx.delete(lineItems).where(eq(lineItems.invoiceId, data.id));
    if (data.lineItems.length > 0) {
      await tx.insert(lineItems).values(
        data.lineItems.map((li) => ({
          invoiceId: data.id,
          description: li.description,
          quantity: li.quantity === null ? null : String(li.quantity),
          unitPrice: money(li.unitPrice),
          amount: li.amount.toFixed(2),
        })),
      );
    }
  });

  revalidatePath(`/app/invoices/${data.id}`);
  revalidatePath("/app/invoices");
  return { ok: true };
}

/** Re-run AI extraction on an invoice (owner-checked). */
export async function reprocessInvoice(id: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in." };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Invalid invoice." };

  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.userId, userId)),
    columns: { id: true },
  });
  if (!invoice) return { ok: false, error: "Invoice not found." };

  await db
    .update(invoices)
    .set({ status: "processing", failureReason: null })
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));

  after(() => runExtractionForInvoice(id));
  revalidatePath(`/app/invoices/${id}`);
  return { ok: true };
}
