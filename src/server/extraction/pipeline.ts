import {
  extractionSchema,
  lineItemsSumMatchesSubtotal,
  looksLikeInvoice,
  type Extraction,
} from "@/lib/validations/extraction";

export type ExtractionOutcome =
  | { status: "completed"; data: Extraction; flagged: boolean }
  | { status: "failed"; reason: string };

/** Initial attempt + one retry on validation failure (SPEC §3 step 5). */
export const MAX_EXTRACTION_ATTEMPTS = 2;

/**
 * Calls the model, optionally with feedback about a previous validation error.
 * Returns whatever the model produced (validated by the caller). This is the
 * seam the tests mock in place of the OpenAI client.
 */
export type CallModel = (feedback?: string) => Promise<unknown>;

/**
 * Orchestrates extraction: call the model, validate against the schema, retry
 * once feeding the validation error back, run the consistency check, and
 * classify the result as completed (optionally flagged) or failed.
 */
export async function extractInvoiceData(callModel: CallModel): Promise<ExtractionOutcome> {
  let feedback: string | undefined;
  let data: Extraction | null = null;

  for (let attempt = 1; attempt <= MAX_EXTRACTION_ATTEMPTS; attempt++) {
    let raw: unknown;
    try {
      raw = await callModel(feedback);
    } catch (err) {
      feedback = err instanceof Error ? err.message : "The model call failed.";
      continue;
    }

    const parsed = extractionSchema.safeParse(raw);
    if (parsed.success) {
      data = parsed.data;
      break;
    }
    feedback = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
  }

  if (!data) {
    return {
      status: "failed",
      reason: "We couldn't read this document. Please try a clearer scan.",
    };
  }

  if (!looksLikeInvoice(data)) {
    return { status: "failed", reason: "This doesn't appear to be an invoice." };
  }

  return {
    status: "completed",
    data,
    flagged: !lineItemsSumMatchesSubtotal(data.subtotal, data.line_items),
  };
}
