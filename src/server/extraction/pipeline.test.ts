import { describe, expect, it, vi } from "vitest";

import type { Extraction } from "@/lib/validations/extraction";
import { extractInvoiceData } from "./pipeline";

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
    line_items: [
      { description: "A", quantity: 1, unit_price: 60, amount: 60 },
      { description: "B", quantity: 1, unit_price: 40, amount: 40 },
    ],
    confidence: {
      vendor_name: "high",
      vendor_address: "medium",
      invoice_number: "high",
      invoice_date: "high",
      due_date: "medium",
      currency: "high",
      subtotal: "high",
      tax: "medium",
      total: "high",
      category: "medium",
    },
    ...overrides,
  };
}

describe("extractInvoiceData", () => {
  it("completes on a valid first response without a retry", async () => {
    const data = makeExtraction();
    const callModel = vi.fn().mockResolvedValue(data);

    const outcome = await extractInvoiceData(callModel);

    expect(outcome).toEqual({ status: "completed", data, flagged: false });
    expect(callModel).toHaveBeenCalledTimes(1);
    expect(callModel).toHaveBeenCalledWith(undefined);
  });

  it("retries once with the validation error fed back, then completes", async () => {
    const good = makeExtraction();
    const callModel = vi
      .fn()
      .mockResolvedValueOnce({ vendor_name: 123 }) // invalid shape
      .mockResolvedValueOnce(good);

    const outcome = await extractInvoiceData(callModel);

    expect(outcome.status).toBe("completed");
    expect(callModel).toHaveBeenCalledTimes(2);
    // First attempt has no feedback; the retry is given the validation error.
    expect(callModel.mock.calls[0][0]).toBeUndefined();
    expect(typeof callModel.mock.calls[1][0]).toBe("string");
    expect(callModel.mock.calls[1][0]).toBeTruthy();
  });

  it("fails after two invalid responses", async () => {
    const callModel = vi.fn().mockResolvedValue({ not: "valid" });

    const outcome = await extractInvoiceData(callModel);

    expect(outcome).toEqual({
      status: "failed",
      reason: expect.stringContaining("couldn't read"),
    });
    expect(callModel).toHaveBeenCalledTimes(2);
  });

  it("retries when the model call throws, then completes", async () => {
    const good = makeExtraction();
    const callModel = vi
      .fn()
      .mockRejectedValueOnce(new Error("rate limited"))
      .mockResolvedValueOnce(good);

    const outcome = await extractInvoiceData(callModel);

    expect(outcome.status).toBe("completed");
    expect(callModel).toHaveBeenCalledTimes(2);
    expect(callModel.mock.calls[1][0]).toBe("rate limited");
  });

  it("flags a completed extraction whose line items don't sum to the subtotal", async () => {
    // subtotal 100 but items sum to 90 → off by 10 (> 0.05).
    const data = makeExtraction({
      subtotal: 100,
      line_items: [
        { description: "A", quantity: 1, unit_price: 60, amount: 60 },
        { description: "B", quantity: 1, unit_price: 30, amount: 30 },
      ],
    });
    const outcome = await extractInvoiceData(vi.fn().mockResolvedValue(data));

    expect(outcome).toMatchObject({ status: "completed", flagged: true });
  });

  it("does not flag when the totals reconcile within tolerance", async () => {
    const outcome = await extractInvoiceData(vi.fn().mockResolvedValue(makeExtraction()));
    expect(outcome).toMatchObject({ status: "completed", flagged: false });
  });

  it("fails junk uploads with a user-readable reason", async () => {
    const junk = makeExtraction({
      vendor_name: null,
      vendor_address: null,
      invoice_number: null,
      invoice_date: null,
      due_date: null,
      currency: null,
      subtotal: null,
      tax: null,
      total: null,
      line_items: [],
    });

    const outcome = await extractInvoiceData(vi.fn().mockResolvedValue(junk));

    expect(outcome).toEqual({
      status: "failed",
      reason: "This doesn't appear to be an invoice.",
    });
  });
});
