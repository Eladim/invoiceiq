import "server-only";

import { and, eq, gte, ilike, lte, or, sql, type AnyColumn, type SQL } from "drizzle-orm";

import {
  decodeCursor,
  encodeCursor,
  type InvoiceFilters,
  type SortKey,
} from "@/lib/validations/invoice-filters";
import { db } from "@/server/db";
import { invoices } from "@/server/db/schema";
import type { Invoice } from "@/server/db/schema";

export const PAGE_SIZE = 20;

// Each sortable column + the SQL cast needed to compare a cursor value to it.
const SORT_CONFIG: Record<SortKey, { col: AnyColumn; cast: string | null }> = {
  createdAt: { col: invoices.createdAt, cast: "timestamptz" },
  vendor: { col: invoices.vendorName, cast: null },
  date: { col: invoices.invoiceDate, cast: "date" },
  total: { col: invoices.total, cast: "numeric" },
};

export type InvoiceRow = Pick<
  Invoice,
  | "id"
  | "vendorName"
  | "invoiceNumber"
  | "invoiceDate"
  | "dueDate"
  | "category"
  | "total"
  | "currency"
  | "status"
  | "createdAt"
>;

/**
 * Keyset ("seek") predicate for the row strictly after the cursor, matching the
 * ORDER BY `col <dir> NULLS LAST, id ASC`. Nulls sort last in both directions.
 */
function seekPredicate(
  cfg: { col: AnyColumn; cast: string | null },
  dir: "asc" | "desc",
  cursor: { v: string | null; id: string },
): SQL {
  const idCol = invoices.id;
  if (cursor.v === null) {
    // Cursor is inside the trailing NULL section → only later nulls remain.
    return sql`${cfg.col} is null and ${idCol} > ${cursor.id}`;
  }
  const value = cfg.cast ? sql`${cursor.v}::${sql.raw(cfg.cast)}` : sql`${cursor.v}`;
  const op = sql.raw(dir === "desc" ? "<" : ">");
  return sql`(${cfg.col} is null or ${cfg.col} ${op} ${value} or (${cfg.col} = ${value} and ${idCol} > ${cursor.id}))`;
}

function sortValueOf(row: InvoiceRow, key: SortKey): string | null {
  switch (key) {
    case "createdAt":
      return row.createdAt.toISOString();
    case "vendor":
      return row.vendorName;
    case "date":
      return row.invoiceDate;
    case "total":
      return row.total;
  }
}

/** List a user's invoices with search/filters, sorting, and keyset pagination. */
export async function listInvoices(
  userId: string,
  f: InvoiceFilters,
): Promise<{ rows: InvoiceRow[]; nextCursor: string | null }> {
  const cfg = SORT_CONFIG[f.sort];

  const conds: SQL[] = [eq(invoices.userId, userId)];
  if (f.q) {
    const term = `%${f.q}%`;
    conds.push(or(ilike(invoices.vendorName, term), ilike(invoices.invoiceNumber, term)) as SQL);
  }
  if (f.status) conds.push(eq(invoices.status, f.status));
  if (f.category) conds.push(eq(invoices.category, f.category));
  if (f.from) conds.push(gte(invoices.invoiceDate, f.from));
  if (f.to) conds.push(lte(invoices.invoiceDate, f.to));

  const cursor = decodeCursor(f.cursor);
  if (cursor) conds.push(seekPredicate(cfg, f.dir, cursor));

  const orderSql = sql`${cfg.col} ${sql.raw(f.dir === "desc" ? "desc" : "asc")} nulls last, ${invoices.id} asc`;

  const rows = (await db
    .select({
      id: invoices.id,
      vendorName: invoices.vendorName,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      category: invoices.category,
      total: invoices.total,
      currency: invoices.currency,
      status: invoices.status,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .where(and(...conds))
    .orderBy(orderSql)
    .limit(PAGE_SIZE + 1)) satisfies InvoiceRow[];

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last ? encodeCursor({ v: sortValueOf(last, f.sort), id: last.id }) : null;

  return { rows: page, nextCursor };
}
