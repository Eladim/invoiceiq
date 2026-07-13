"use server";

import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { env } from "@/lib/env";
import { db } from "@/server/db";
import { invoices } from "@/server/db/schema";

export type DeleteInvoiceResult = { ok: true } | { ok: false; error: string };

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
