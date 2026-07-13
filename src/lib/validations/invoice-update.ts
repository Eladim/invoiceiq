import { z } from "zod";

import { INVOICE_CATEGORIES } from "./invoice-filters";

/** Maps an editable field to its key in the `confidence` jsonb (snake_case). */
export const CONFIDENCE_KEYS = {
  vendorName: "vendor_name",
  vendorAddress: "vendor_address",
  invoiceNumber: "invoice_number",
  invoiceDate: "invoice_date",
  dueDate: "due_date",
  currency: "currency",
  category: "category",
  subtotal: "subtotal",
  tax: "tax",
  total: "total",
} as const;

export type EditableField = keyof typeof CONFIDENCE_KEYS;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date (YYYY-MM-DD)");

export const lineItemInputSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.number().nullable(),
  unitPrice: z.number().nullable(),
  amount: z.number(),
});

export const updateInvoiceSchema = z.object({
  id: z.uuid(),
  vendorName: z.string().max(200).nullable(),
  vendorAddress: z.string().max(1000).nullable(),
  invoiceNumber: z.string().max(100).nullable(),
  invoiceDate: isoDate.nullable(),
  dueDate: isoDate.nullable(),
  currency: z.string().length(3, "Use a 3-letter currency code").nullable(),
  category: z.enum(INVOICE_CATEGORIES).nullable(),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  total: z.number().nullable(),
  lineItems: z.array(lineItemInputSchema).max(200),
  /** Confidence keys of fields the user changed — bumped to 'high' on save. */
  changedFields: z.array(z.string()).default([]),
});

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
