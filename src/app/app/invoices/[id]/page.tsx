import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { InvoiceDetail } from "@/components/app/invoices/invoice-detail";
import { getInvoiceDetail } from "@/server/queries/invoices";
import { getCurrentUsage } from "@/server/queries/usage";

export const metadata: Metadata = { title: "Invoice · InvoiceIQ" };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  const { id } = await params;
  if (!userId || !z.uuid().safeParse(id).success) notFound();

  const [detail, usage] = await Promise.all([getInvoiceDetail(userId, id), getCurrentUsage()]);
  if (!detail) notFound();

  const str = (v: string | null) => v ?? "";
  const isPdf = /\.pdf$/i.test(detail.originalFilename) || detail.blobUrl.includes(".pdf");

  return (
    <InvoiceDetail
      id={detail.id}
      status={detail.status}
      failureReason={detail.failureReason}
      fileUrl={`/api/invoices/${detail.id}/file`}
      isPdf={isPdf}
      filename={detail.originalFilename}
      confidence={detail.confidence}
      initial={{
        vendorName: str(detail.vendorName),
        vendorAddress: str(detail.vendorAddress),
        invoiceNumber: str(detail.invoiceNumber),
        invoiceDate: str(detail.invoiceDate),
        dueDate: str(detail.dueDate),
        currency: str(detail.currency),
        category: detail.category ?? "",
        subtotal: str(detail.subtotal),
        tax: str(detail.tax),
        total: str(detail.total),
      }}
      lineItems={detail.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity ?? "",
        unitPrice: li.unitPrice ?? "",
        amount: li.amount,
      }))}
      isPro={usage.plan === "pro"}
    />
  );
}
