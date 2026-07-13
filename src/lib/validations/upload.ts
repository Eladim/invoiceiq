import { z } from "zod";

/** Max upload size: 10 MB (SPEC §3). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export type AcceptedMime = (typeof ACCEPTED_MIME_TYPES)[number];

export const EXTENSION_FOR_MIME: Record<AcceptedMime, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
};

export const ACCEPT_ATTRIBUTE = ".pdf,.png,.jpg,.jpeg";

/** Client- and server-side shape check for the uploaded file. */
export const uploadFileSchema = z.object({
  file: z
    .instanceof(File, { message: "No file provided" })
    .refine((f) => f.size > 0, "File is empty")
    .refine((f) => f.size <= MAX_FILE_SIZE, "File exceeds the 10 MB limit")
    .refine(
      (f) => (ACCEPTED_MIME_TYPES as readonly string[]).includes(f.type),
      "Only PDF, PNG, or JPG files are allowed",
    ),
});

/**
 * Sniff the real file type from its leading magic bytes (SPEC §9 — don't trust
 * the client-declared extension/MIME). Returns the canonical MIME or null.
 */
export function sniffMimeType(bytes: Uint8Array): AcceptedMime | null {
  // PDF: "%PDF"
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "application/pdf";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}
