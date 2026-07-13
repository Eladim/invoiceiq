import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { invoicesHref, type InvoiceFilters } from "@/lib/validations/invoice-filters";

export function InvoicesPagination({
  filters,
  nextCursor,
  count,
}: {
  filters: InvoiceFilters;
  nextCursor: string | null;
  count: number;
}) {
  const page = filters.pc.length + 1;
  const hasPrev = filters.pc.length > 0;

  // Previous: pop the last cursor off the breadcrumb stack ("" = first page).
  const prevStack = [...filters.pc];
  const prevCursor = prevStack.pop() ?? "";
  const prevHref = invoicesHref(filters, {
    cursor: prevCursor || null,
    pc: prevStack,
  });

  // Next: push the current page's cursor onto the stack.
  const nextHref = nextCursor
    ? invoicesHref(filters, { cursor: nextCursor, pc: [...filters.pc, filters.cursor ?? ""] })
    : null;

  if (!hasPrev && !nextHref) {
    return <p className="mt-3 text-xs text-slate-400">Showing {count} invoices</p>;
  }

  const linkClass =
    "inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50";
  const disabledClass = "pointer-events-none opacity-40";

  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-xs text-slate-500">
        Page {page} · showing {count} on this page
      </span>
      <div className="flex items-center gap-2">
        <Link href={prevHref} aria-disabled={!hasPrev} className={cn(linkClass, !hasPrev && disabledClass)}>
          <ChevronLeft className="size-4" />
          Previous
        </Link>
        <Link
          href={nextHref ?? "#"}
          aria-disabled={!nextHref}
          className={cn(linkClass, !nextHref && disabledClass)}
        >
          Next
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
