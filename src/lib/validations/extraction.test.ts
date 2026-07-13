import { describe, expect, it } from "vitest";

import {
  extractionSchema,
  lineItemsSumMatchesSubtotal,
  looksLikeInvoice,
  type Extraction,
} from "./extraction";

function makeExtraction(overrides: Partial<Extraction> = {}): Extraction {
  return {
    vendor_name: "Acme Corp",
    vendor_address: "1 Main St",
    invoice_number: "INV-1",
    invoice_date: "2026-01-01",
    due_date: "2026-02-01",
    currency: "USD",
    subtotal: 100,
    tax: 20,
    total: 120,
    category: "software",
    line_items: [{ description: "Widget", quantity: 1, unit_price: 100, amount: 100 }],
    confidence: { vendor_name: "high", total: "high" },
    ...overrides,
  };
}

describe("lineItemsSumMatchesSubtotal", () => {
  it("is consistent when the sum matches within tolerance", () => {
    expect(lineItemsSumMatchesSubtotal(100, [{ amount: 60 }, { amount: 40.04 }])).toBe(true);
  });

  it("is inconsistent when the sum is off by more than tolerance", () => {
    expect(lineItemsSumMatchesSubtotal(100, [{ amount: 60 }, { amount: 40.06 }])).toBe(false);
  });

  it("treats a missing subtotal or empty line items as consistent", () => {
    expect(lineItemsSumMatchesSubtotal(null, [{ amount: 10 }])).toBe(true);
    expect(lineItemsSumMatchesSubtotal(100, [])).toBe(true);
  });
});

describe("looksLikeInvoice", () => {
  it("accepts data with a vendor, money, or line items", () => {
    expect(looksLikeInvoice(makeExtraction())).toBe(true);
    expect(looksLikeInvoice(makeExtraction({ vendor_name: null, subtotal: null, total: 42 }))).toBe(
      true,
    );
  });

  it("rejects empty (junk) extractions", () => {
    const junk = makeExtraction({
      vendor_name: null,
      subtotal: null,
      total: null,
      line_items: [],
    });
    expect(looksLikeInvoice(junk)).toBe(false);
  });
});

describe("extractionSchema", () => {
  it("accepts a well-formed extraction", () => {
    expect(extractionSchema.safeParse(makeExtraction()).success).toBe(true);
  });

  it("rejects wrong field types", () => {
    expect(extractionSchema.safeParse({ ...makeExtraction(), subtotal: "100" }).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(extractionSchema.safeParse({ ...makeExtraction(), category: "food" }).success).toBe(
      false,
    );
  });

  it("rejects a line item missing its amount", () => {
    const data = { ...makeExtraction(), line_items: [{ description: "x", quantity: 1, unit_price: 1 }] };
    expect(extractionSchema.safeParse(data).success).toBe(false);
  });
});
