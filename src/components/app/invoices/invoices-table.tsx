"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  invoicesHref,
  type InvoiceFilters,
  type SortKey,
} from "@/lib/validations/invoice-filters";
import { deleteInvoice } from "@/server/actions/invoice";
import type { InvoiceRow } from "@/server/queries/invoices";
import { CategoryBadge, StatusBadge } from "./badges";
import { ExportCsvButton } from "./export-csv-button";

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

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100";

function RowActions({
  id,
  label,
  onDelete,
}: {
  id: string;
  label: string;
  onDelete: (id: string, label: string) => void;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Row actions"
        className="flex rounded-md p-1.5 text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-slate-700 data-[popup-open]:bg-slate-100"
      >
        <MoreVertical className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4} className="z-50">
          <Menu.Popup className="min-w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none">
            <Menu.Item
              className={menuItemClass}
              render={
                <Link href={`/app/invoices/${id}`}>
                  <Eye className="size-4 text-slate-400" /> View
                </Link>
              }
            />
            <Menu.Item
              className={menuItemClass}
              render={
                <Link href={`/app/invoices/${id}`}>
                  <Pencil className="size-4 text-slate-400" /> Edit
                </Link>
              }
            />
            <Menu.Item
              onClick={() => onDelete(id, label)}
              className={cn(menuItemClass, "text-red-600 data-[highlighted]:bg-red-50")}
            >
              <Trash2 className="size-4" /> Delete
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function InvoicesTable({
  rows,
  filters,
  isPro,
}: {
  rows: InvoiceRow[];
  filters: InvoiceFilters;
  isPro: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function deleteOne(id: string, label: string) {
    if (!window.confirm(`Delete "${label}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteInvoice(id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
    });
  }

  function deleteSelected() {
    if (!window.confirm(`Delete ${selected.size} selected invoice(s)? This can't be undone.`)) return;
    const ids = [...selected];
    startTransition(async () => {
      await Promise.all(ids.map((id) => deleteInvoice(id)));
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <>
      <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 bg-white text-left text-xs text-slate-500 [&>th]:bg-white">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={toggleAll}
                  className="size-4 accent-indigo-600"
                />
              </th>
              <SortHeader label="Vendor" sortKey="vendor" filters={filters} />
              <th className="px-4 py-2.5 font-medium">Invoice #</th>
              <SortHeader label="Date" sortKey="date" filters={filters} />
              <th className="px-4 py-2.5 font-medium">Due date</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <SortHeader label="Total" sortKey="total" filters={filters} className="text-right" />
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="w-12 px-4 py-2.5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const vendor = row.vendorName ?? "Untitled invoice";
              const checked = selected.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-slate-100 last:border-0 hover:bg-slate-50/60",
                    checked && "bg-indigo-50/40",
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${vendor}`}
                      checked={checked}
                      onChange={() => toggle(row.id)}
                      className="size-4 accent-indigo-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">
                        {(row.vendorName ?? "?").slice(0, 2).toUpperCase()}
                      </span>
                      <Link
                        href={`/app/invoices/${row.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {vendor}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{row.invoiceNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(row.invoiceDate)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(row.dueDate)}</td>
                  <td className="px-4 py-3">
                    <CategoryBadge category={row.category} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                    {formatMoney(row.total, row.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowActions id={row.id} label={vendor} onDelete={deleteOne} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {someSelected && (
        <div
          style={{ animation: "iq-slide-up .2s ease both" }}
          className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl"
        >
          <span className="pl-1 text-sm font-medium text-slate-700">{selected.size} selected</span>
          <div className="h-5 w-px bg-slate-200" />
          <button
            onClick={deleteSelected}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            Delete selected
          </button>
          <ExportCsvButton isPro={isPro} ids={[...selected]} label="Export selected" />
          <button
            onClick={() => setSelected(new Set())}
            aria-label="Clear selection"
            className="flex rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
