import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "@/lib/env";
import { db } from "@/server/db";
import { invoices } from "@/server/db/schema";

/**
 * Stream an invoice's stored file for the owner. The Blob store is private, so
 * this proxy reads it server-side with the token after an ownership check —
 * the raw blob URL is never exposed to the client.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });

  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.userId, userId)),
    columns: { blobUrl: true },
  });
  if (!invoice) return new Response("Not found", { status: 404 });
  if (!env.BLOB_READ_WRITE_TOKEN) return new Response("Storage not configured", { status: 500 });

  const result = await get(invoice.blobUrl, {
    access: "private",
    token: env.BLOB_READ_WRITE_TOKEN,
  });
  if (!result || result.statusCode !== 200) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "content-type": result.blob.contentType,
      "content-disposition": "inline",
      "cache-control": "private, max-age=60",
    },
  });
}
