import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { FileText, SearchX, Upload } from "lucide-react";

import { InvoicesPagination } from "@/components/app/invoices/invoices-pagination";
import { InvoicesTable } from "@/components/app/invoices/invoices-table";
import { InvoicesToolbar } from "@/components/app/invoices/invoices-toolbar";
import { hasActiveFilters, parseInvoiceFilters } from "@/lib/validations/invoice-filters";
import { listInvoices } from "@/server/queries/invoices";

export const metadata: Metadata = { title: "Invoices · InvoiceIQ" };

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth();
  const filters = parseInvoiceFilters(await searchParams);
  const { rows, nextCursor } = userId
    ? await listInvoices(userId, filters)
    : { rows: [], nextCursor: null };

  const filteredOrPaged = hasActiveFilters(filters) || filters.cursor !== null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter and manage your extracted invoices.
          </p>
        </div>
        <Link
          href="/app/upload"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <Upload className="size-4" />
          Upload invoice
        </Link>
      </div>

      <div className="mt-6">
        <InvoicesToolbar />
      </div>

      <div className="mt-4">
        {rows.length === 0 ? (
          filteredOrPaged ? (
            <NoResults />
          ) : (
            <EmptyState />
          )
        ) : (
          <>
            <InvoicesTable rows={rows} filters={filters} />
            <InvoicesPagination filters={filters} nextCursor={nextCursor} count={rows.length} />
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <FileText className="size-6" />
      </div>
      <div>
        <p className="font-semibold text-slate-900">No invoices yet</p>
        <p className="mt-1 text-sm text-slate-500">Upload your first invoice to see it extracted here.</p>
      </div>
      <Link
        href="/app/upload"
        className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        <Upload className="size-4" />
        Upload invoice
      </Link>
    </div>
  );
}

function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <SearchX className="size-6" />
      </div>
      <div>
        <p className="font-semibold text-slate-900">No invoices match</p>
        <p className="mt-1 text-sm text-slate-500">Try a different search or clear your filters.</p>
      </div>
      <Link
        href="/app/invoices"
        className="mt-1 inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        Clear filters
      </Link>
    </div>
  );
}
