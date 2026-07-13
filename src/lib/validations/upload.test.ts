import { describe, expect, it } from "vitest";

import { MAX_FILE_SIZE, sniffMimeType, uploadFileSchema } from "./upload";

const bytes = (...b: number[]) => Uint8Array.from(b);

function makeFile(content: Uint8Array | number, name: string, type: string): File {
  const data = typeof content === "number" ? new Uint8Array(content) : content;
  return new File([data as BlobPart], name, { type });
}

describe("sniffMimeType", () => {
  it("recognizes a PDF header", () => {
    expect(sniffMimeType(bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37))).toBe(
      "application/pdf",
    );
  });

  it("recognizes a PNG header", () => {
    expect(sniffMimeType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe(
      "image/png",
    );
  });

  it("recognizes a JPEG header", () => {
    expect(sniffMimeType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
  });

  it("returns null for an exe (MZ) header", () => {
    expect(sniffMimeType(bytes(0x4d, 0x5a, 0x90, 0x00, 0x03))).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(sniffMimeType(bytes())).toBeNull();
  });

  it("returns null for a truncated magic prefix", () => {
    // "%P" — looks like the start of a PDF but too short to confirm.
    expect(sniffMimeType(bytes(0x25, 0x50))).toBeNull();
  });
});

describe("uploadFileSchema", () => {
  it("accepts a valid PDF, PNG, and JPEG", () => {
    expect(
      uploadFileSchema.safeParse({ file: makeFile(bytes(0x25, 0x50), "a.pdf", "application/pdf") })
        .success,
    ).toBe(true);
    expect(
      uploadFileSchema.safeParse({ file: makeFile(bytes(0x89), "a.png", "image/png") }).success,
    ).toBe(true);
    expect(
      uploadFileSchema.safeParse({ file: makeFile(bytes(0xff), "a.jpg", "image/jpeg") }).success,
    ).toBe(true);
  });

  it("rejects an empty file", () => {
    const result = uploadFileSchema.safeParse({ file: makeFile(0, "empty.pdf", "application/pdf") });
    expect(result.success).toBe(false);
  });

  it("rejects a file over 10 MB", () => {
    const result = uploadFileSchema.safeParse({
      file: makeFile(MAX_FILE_SIZE + 1, "big.pdf", "application/pdf"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a disallowed MIME type", () => {
    const result = uploadFileSchema.safeParse({
      file: makeFile(bytes(0x25), "a.txt", "text/plain"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-File value", () => {
    expect(uploadFileSchema.safeParse({ file: "not a file" }).success).toBe(false);
  });
});
