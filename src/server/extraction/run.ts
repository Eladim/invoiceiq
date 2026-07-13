import "server-only";

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { eq } from "drizzle-orm";

import { env } from "@/lib/env";
import { extractionSchema } from "@/lib/validations/extraction";
import { db } from "@/server/db";
import { invoices, lineItems } from "@/server/db/schema";
import { withTransaction } from "@/server/db/transaction";
import { extractInvoiceData } from "./pipeline";

const SYSTEM_PROMPT =
  "You extract structured data from invoices/receipts. If a field is not present, return null — never invent values. Return a confidence of low/medium/high per top-level field.";

const USER_PROMPT =
  "Extract into the provided schema. Normalize dates to ISO 8601 and amounts to plain decimals.";

const money = (n: number | null) => (n === null ? null : n.toFixed(2));

/**
 * SPEC §3 steps 4–7: fetch the stored file, call the model via Structured
 * Outputs, validate/retry, apply the consistency check, and persist the result
 * (status='completed' with fields + line items, or 'failed' with a reason).
 * Runs in the background after upload; never throws to its caller.
 */
export async function runExtractionForInvoice(invoiceId: string): Promise<void> {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    columns: { id: true, blobUrl: true },
  });
  if (!invoice) return;

  try {
    // Fetch the stored file and inline it as a data URL for the model.
    const response = await fetch(invoice.blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file (${response.status})`);
    }
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const base64 = Buffer.from(await response.arrayBuffer()).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    const filePart: ChatCompletionContentPart = contentType.includes("pdf")
      ? { type: "file", file: { file_data: dataUrl, filename: "invoice.pdf" } }
      : { type: "image_url", image_url: { url: dataUrl } };

    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const outcome = await extractInvoiceData(async (feedback) => {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: [{ type: "text", text: USER_PROMPT }, filePart] },
      ];
      if (feedback) {
        messages.push({
          role: "user",
          content: `Your previous response failed validation: ${feedback}. Return corrected JSON matching the schema exactly.`,
        });
      }

      const completion = await client.chat.completions.parse({
        model: env.OPENAI_MODEL,
        messages,
        response_format: zodResponseFormat(extractionSchema, "extraction"),
      });
      return completion.choices[0]?.message?.parsed ?? null;
    });

    if (outcome.status === "failed") {
      await db
        .update(invoices)
        .set({ status: "failed", failureReason: outcome.reason })
        .where(eq(invoices.id, invoiceId));
      return;
    }

    // Downgrade the money fields' confidence when the totals don't reconcile.
    const { data } = outcome;
    const confidence = { ...data.confidence };
    if (outcome.flagged) {
      confidence.subtotal = "low";
      confidence.total = "low";
    }

    await withTransaction(async (tx) => {
      await tx
        .update(invoices)
        .set({
          status: "completed",
          failureReason: null,
          vendorName: data.vendor_name,
          vendorAddress: data.vendor_address,
          invoiceNumber: data.invoice_number,
          invoiceDate: data.invoice_date,
          dueDate: data.due_date,
          currency: data.currency,
          subtotal: money(data.subtotal),
          tax: money(data.tax),
          total: money(data.total),
          category: data.category,
          confidence,
          rawExtraction: data,
        })
        .where(eq(invoices.id, invoiceId));

      // Replace any prior line items (supports reprocessing).
      await tx.delete(lineItems).where(eq(lineItems.invoiceId, invoiceId));
      if (data.line_items.length > 0) {
        await tx.insert(lineItems).values(
          data.line_items.map((li) => ({
            invoiceId,
            description: li.description,
            quantity: li.quantity === null ? null : String(li.quantity),
            unitPrice: money(li.unit_price),
            amount: li.amount.toFixed(2),
          })),
        );
      }
    });
  } catch (err) {
    console.error(`Extraction failed for invoice ${invoiceId}:`, err);
    await db
      .update(invoices)
      .set({ status: "failed", failureReason: "Extraction failed. Please try again." })
      .where(eq(invoices.id, invoiceId))
      .catch(() => {});
  }
}
