import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/server/db";
import { invoices } from "@/server/db/schema";

/**
 * Poll the extraction status of an invoice (SPEC §5). Owner-only: a non-owner
 * (or unknown id) gets 404 so we never leak whether an invoice exists.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return new Response("Not found", { status: 404 });
  }

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    columns: {
      userId: true,
      status: true,
      failureReason: true,
      vendorName: true,
      invoiceDate: true,
      total: true,
      currency: true,
    },
  });

  if (!invoice || invoice.userId !== userId) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json({
    status: invoice.status,
    failureReason: invoice.failureReason,
    vendorName: invoice.vendorName,
    invoiceDate: invoice.invoiceDate,
    total: invoice.total,
    currency: invoice.currency,
  });
}
