import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/server/db";
import { invoices, subscriptions } from "@/server/db/schema";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * GET /api/export — CSV of the user's invoices + line items (SPEC §5).
 * Pro only; free users get 403 with an upgrade message. Optional `?ids=`
 * (comma-separated) exports just those invoices. Always owner-scoped.
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { plan: true },
  });
  if ((sub?.plan ?? "free") !== "pro") {
    return Response.json(
      { error: "Upgrade to Pro to export your invoices as CSV." },
      { status: 403 },
    );
  }

  const idsParam = new URL(req.url).searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").filter((id) => UUID_RE.test(id)) : null;

  const rows = await db.query.invoices.findMany({
    where:
      ids && ids.length > 0
        ? and(eq(invoices.userId, userId), inArray(invoices.id, ids))
        : eq(invoices.userId, userId),
    with: { lineItems: { orderBy: (li, { asc }) => asc(li.id) } },
    orderBy: [desc(invoices.createdAt)],
  });

  const header = [
    "Invoice ID", "Vendor", "Invoice #", "Invoice date", "Due date", "Category",
    "Currency", "Subtotal", "Tax", "Total", "Status",
    "Line item", "Quantity", "Unit price", "Amount",
  ];
  const lines = [header.join(",")];

  for (const inv of rows) {
    const base = [
      inv.id, inv.vendorName, inv.invoiceNumber, inv.invoiceDate, inv.dueDate,
      inv.category, inv.currency, inv.subtotal, inv.tax, inv.total, inv.status,
    ];
    if (inv.lineItems.length === 0) {
      lines.push([...base, "", "", "", ""].map(csvCell).join(","));
    } else {
      for (const li of inv.lineItems) {
        lines.push(
          [...base, li.description, li.quantity, li.unitPrice, li.amount].map(csvCell).join(","),
        );
      }
    }
  }

  const csv = lines.join("\r\n");
  const filename = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
