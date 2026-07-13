import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  invoicesHref,
  type InvoiceFilters,
  type SortKey,
} from "@/lib/validations/invoice-filters";
import type { InvoiceRow } from "@/server/queries/invoices";
import { CategoryBadge, StatusBadge } from "./badges";
import { DeleteInvoiceButton } from "./delete-invoice-button";

function SortHeader({
  label,
  sortKey,
  filters,
  className,
}: {
  label: string;
  sortKey: SortKey;
  filters: InvoiceFilters;
  className?: string;
}) {
  const active = filters.sort === sortKey;
  const nextDir = active && filters.dir === "asc" ? "desc" : "asc";
  const href = invoicesHref(filters, { sort: sortKey, dir: nextDir, cursor: null, pc: [] });
  const Icon = !active ? ChevronsUpDown : filters.dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <th className={cn("px-4 py-2.5 font-medium", className)}>
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-slate-900",
          active ? "text-slate-900" : "text-slate-500",
        )}
      >
        {label}
        <Icon className={cn("size-3.5", active ? "text-slate-500" : "text-slate-300")} />
      </Link>
    </th>
  );
}

export function InvoicesTable({
  rows,
  filters,
}: {
  rows: InvoiceRow[];
  filters: InvoiceFilters;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <SortHeader label="Vendor" sortKey="vendor" filters={filters} />
            <th className="px-4 py-2.5 font-medium">Invoice #</th>
            <SortHeader label="Date" sortKey="date" filters={filters} />
            <th className="px-4 py-2.5 font-medium">Category</th>
            <SortHeader label="Total" sortKey="total" filters={filters} className="text-right" />
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="w-24 px-4 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const vendor = row.vendorName ?? "Untitled invoice";
            return (
              <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">
                      {(row.vendorName ?? "?").slice(0, 2).toUpperCase()}
                    </span>
                    <Link href={`/app/invoices/${row.id}`} className="font-medium text-slate-900 hover:underline">
                      {vendor}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{row.invoiceNumber ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(row.invoiceDate)}</td>
                <td className="px-4 py-3">
                  <CategoryBadge category={row.category} />
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                  {formatMoney(row.total, row.currency)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/app/invoices/${row.id}`}
                      className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      View
                    </Link>
                    <DeleteInvoiceButton id={row.id} label={vendor} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
