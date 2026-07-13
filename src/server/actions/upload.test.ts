import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks are hoisted above the module imports so upload.ts picks them up.
const {
  authMock,
  currentUserMock,
  putMock,
  delMock,
  dbMock,
  withTransactionMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  currentUserMock: vi.fn(),
  putMock: vi.fn(),
  delMock: vi.fn(),
  dbMock: {
    query: {
      usageCounters: { findFirst: vi.fn() },
      subscriptions: { findFirst: vi.fn() },
    },
  },
  withTransactionMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: authMock, currentUser: currentUserMock }));
vi.mock("@vercel/blob", () => ({ put: putMock, del: delMock }));
vi.mock("@/server/db", () => ({ db: dbMock }));
vi.mock("@/server/db/transaction", () => ({ withTransaction: withTransactionMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
// Avoid the real env module's boot-time Zod validation; supply a Blob token.
vi.mock("@/lib/env", () => ({ env: { BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_test" } }));

import { uploadInvoice } from "./upload";
import { FREE_DOCUMENT_LIMIT } from "@/lib/constants";
import { invoices, usageCounters } from "@/server/db/schema";

// Leading magic bytes for each type.
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const EXE = [0x4d, 0x5a, 0x90, 0x00];

function makeFile(magic: number[], name: string, type: string): File {
  return new File([Uint8Array.from(magic) as BlobPart], name, { type });
}

function formDataFor(file: File | null): FormData {
  const fd = new FormData();
  if (file) fd.append("file", file);
  return fd;
}

/**
 * Wire withTransaction to run the action's callback against a fake `tx` whose
 * fluent builders return per-table results, so the real transaction logic
 * (increment → quota check → invoice insert) executes under test.
 */
function installTx({ plan, usedAfter }: { plan: "free" | "pro"; usedAfter: number }) {
  const usageBuilder: Record<string, ReturnType<typeof vi.fn>> = {};
  usageBuilder.values = vi.fn(() => usageBuilder);
  usageBuilder.onConflictDoUpdate = vi.fn(() => usageBuilder);
  usageBuilder.returning = vi.fn(() => Promise.resolve([{ used: usedAfter }]));

  const invoiceBuilder: Record<string, ReturnType<typeof vi.fn>> = {};
  invoiceBuilder.values = vi.fn(() => invoiceBuilder);
  invoiceBuilder.returning = vi.fn(() => Promise.resolve([{ id: "inv_123" }]));

  const userBuilder: Record<string, ReturnType<typeof vi.fn>> = {};
  userBuilder.values = vi.fn(() => userBuilder);
  userBuilder.onConflictDoUpdate = vi.fn(() => Promise.resolve(undefined));

  const insert = vi.fn((table: unknown) => {
    if (table === usageCounters) return usageBuilder;
    if (table === invoices) return invoiceBuilder;
    return userBuilder;
  });

  const tx = {
    insert,
    query: { subscriptions: { findFirst: vi.fn(() => Promise.resolve({ plan })) } },
  };

  withTransactionMock.mockImplementation(async (fn: (t: typeof tx) => unknown) => fn(tx));
  return { usageValues: usageBuilder.values, invoiceValues: invoiceBuilder.values };
}

beforeEach(() => {
  vi.clearAllMocks();
  withTransactionMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});

  authMock.mockResolvedValue({ userId: "user_1" });
  currentUserMock.mockResolvedValue({
    primaryEmailAddress: { emailAddress: "u@example.com" },
    emailAddresses: [{ emailAddress: "u@example.com" }],
    firstName: "Ada",
    lastName: "Lovelace",
  });
  putMock.mockResolvedValue({ url: "https://blob.example.com/x.pdf" });
  delMock.mockResolvedValue(undefined);
  dbMock.query.usageCounters.findFirst.mockResolvedValue({ documentsUsed: 0 });
  dbMock.query.subscriptions.findFirst.mockResolvedValue({ plan: "free" });
});

describe("uploadInvoice", () => {
  it("returns unauthorized when there is no signed-in user", async () => {
    authMock.mockResolvedValue({ userId: null });

    const res = await uploadInvoice(formDataFor(makeFile(PDF, "a.pdf", "application/pdf")));

    expect(res).toEqual({ ok: false, code: "unauthorized", message: expect.any(String) });
    expect(putMock).not.toHaveBeenCalled();
    expect(withTransactionMock).not.toHaveBeenCalled();
  });

  it("rejects a file whose magic bytes don't match an accepted type", async () => {
    // Declared as a PDF (allowed MIME) but the bytes are an exe header.
    const res = await uploadInvoice(formDataFor(makeFile(EXE, "fake.pdf", "application/pdf")));

    expect(res).toMatchObject({ ok: false, code: "invalid_file" });
    expect(putMock).not.toHaveBeenCalled();
    expect(withTransactionMock).not.toHaveBeenCalled();
  });

  it("blocks a free user already at the limit — no upload, no invoice", async () => {
    dbMock.query.usageCounters.findFirst.mockResolvedValue({ documentsUsed: FREE_DOCUMENT_LIMIT });
    dbMock.query.subscriptions.findFirst.mockResolvedValue({ plan: "free" });

    const res = await uploadInvoice(formDataFor(makeFile(PDF, "a.pdf", "application/pdf")));

    expect(res).toMatchObject({ ok: false, code: "quota_exceeded" });
    expect(putMock).not.toHaveBeenCalled();
    expect(withTransactionMock).not.toHaveBeenCalled();
  });

  it("uploads and creates a processing invoice for a free user under the limit", async () => {
    dbMock.query.usageCounters.findFirst.mockResolvedValue({ documentsUsed: 2 });
    dbMock.query.subscriptions.findFirst.mockResolvedValue({ plan: "free" });
    const { usageValues, invoiceValues } = installTx({ plan: "free", usedAfter: 3 });

    const res = await uploadInvoice(formDataFor(makeFile(PDF, "invoice.pdf", "application/pdf")));

    expect(res).toEqual({ ok: true, invoiceId: "inv_123" });
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(usageValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_1", documentsUsed: 1 }),
    );
    expect(invoiceValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        blobUrl: "https://blob.example.com/x.pdf",
        originalFilename: "invoice.pdf",
        status: "processing",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalled();
  });

  it("allows a pro user even with 5+ documents this period", async () => {
    dbMock.query.usageCounters.findFirst.mockResolvedValue({ documentsUsed: 7 });
    dbMock.query.subscriptions.findFirst.mockResolvedValue({ plan: "pro" });
    const { invoiceValues } = installTx({ plan: "pro", usedAfter: 8 });

    const res = await uploadInvoice(formDataFor(makeFile(PNG, "a.png", "image/png")));

    expect(res).toEqual({ ok: true, invoiceId: "inv_123" });
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(invoiceValues).toHaveBeenCalledWith(expect.objectContaining({ status: "processing" }));
  });

  it("returns upload_failed and creates no invoice when Blob storage throws", async () => {
    dbMock.query.usageCounters.findFirst.mockResolvedValue({ documentsUsed: 1 });
    dbMock.query.subscriptions.findFirst.mockResolvedValue({ plan: "free" });
    putMock.mockRejectedValue(new Error("network down"));

    const res = await uploadInvoice(formDataFor(makeFile(PDF, "a.pdf", "application/pdf")));

    expect(res).toMatchObject({ ok: false, code: "upload_failed" });
    // Upload failed before the transaction → no invoice row, nothing to clean up.
    expect(withTransactionMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
  });
});
