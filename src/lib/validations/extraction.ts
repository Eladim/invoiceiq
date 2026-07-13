import { z } from "zod";

export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;

export const INVOICE_CATEGORIES = [
  "software",
  "office",
  "travel",
  "utilities",
  "marketing",
  "other",
] as const;

/**
 * Extraction schema (SPEC §7) — mirrored into the model's structured output.
 * Dates are plain strings (the prompt asks for ISO 8601); Zod v4 moved the
 * `.date()` string format to `z.iso.date()`, and structured outputs ignore
 * format constraints anyway, so a string keeps the model call strict-safe.
 */
const confidenceLevel = z.enum(CONFIDENCE_LEVELS);

// Fixed-key object (not z.record) so OpenAI strict Structured Outputs accepts
// it — strict mode requires every property named and required.
const confidenceSchema = z.object({
  vendor_name: confidenceLevel,
  vendor_address: confidenceLevel,
  invoice_number: confidenceLevel,
  invoice_date: confidenceLevel,
  due_date: confidenceLevel,
  currency: confidenceLevel,
  subtotal: confidenceLevel,
  tax: confidenceLevel,
  total: confidenceLevel,
  category: confidenceLevel,
});

export const extractionSchema = z.object({
  vendor_name: z.string().nullable(),
  vendor_address: z.string().nullable(),
  invoice_number: z.string().nullable(),
  invoice_date: z.string().nullable(),
  due_date: z.string().nullable(),
  currency: z.string().nullable(),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  total: z.number().nullable(),
  category: z.enum(INVOICE_CATEGORIES),
  line_items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().nullable(),
      unit_price: z.number().nullable(),
      amount: z.number(),
    }),
  ),
  confidence: confidenceSchema,
});

export type Extraction = z.infer<typeof extractionSchema>;
export type ExtractionLineItem = Extraction["line_items"][number];

/** SPEC §7 consistency guard tolerance. */
export const LINE_ITEM_TOLERANCE = 0.05;

/**
 * True when the line items sum to the subtotal within tolerance (SPEC §7).
 * When there's no subtotal or no line items there's nothing to check, so we
 * treat it as consistent (no flag).
 */
export function lineItemsSumMatchesSubtotal(
  subtotal: number | null,
  items: readonly { amount: number }[],
  tolerance = LINE_ITEM_TOLERANCE,
): boolean {
  if (subtotal === null || items.length === 0) return true;
  const sum = items.reduce((acc, li) => acc + li.amount, 0);
  return Math.abs(sum - subtotal) < tolerance;
}

/** Heuristic to reject junk uploads that parsed but carry no invoice data. */
export function looksLikeInvoice(data: Extraction): boolean {
  return (
    Boolean(data.vendor_name) ||
    data.total !== null ||
    data.subtotal !== null ||
    data.line_items.length > 0
  );
}
