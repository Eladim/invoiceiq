"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  INVOICE_CATEGORIES,
  INVOICE_STATUSES,
} from "@/lib/validations/invoice-filters";

const selectClass =
  "h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-100";

export function InvoicesToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  // Push URL updates, always resetting pagination.
  function update(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("cursor");
    params.delete("pc");
    const qs = params.toString();
    router.push(qs ? `/app/invoices?${qs}` : "/app/invoices");
  }

  // Debounce the free-text search.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => {
      update((p) => (q ? p.set("q", q) : p.delete("q")));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const status = searchParams.get("status") ?? "";
  const category = searchParams.get("category") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const hasFilters = Boolean(q || status || category || from || to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 basis-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search vendor or invoice #"
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm outline-none placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-100"
        />
      </div>

      <select
        value={status}
        onChange={(e) => update((p) => (e.target.value ? p.set("status", e.target.value) : p.delete("status")))}
        className={cn(selectClass, "capitalize")}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {INVOICE_STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>

      <select
        value={category}
        onChange={(e) => update((p) => (e.target.value ? p.set("category", e.target.value) : p.delete("category")))}
        className={cn(selectClass, "capitalize")}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {INVOICE_CATEGORIES.map((c) => (
          <option key={c} value={c} className="capitalize">
            {c}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={from}
        max={to || undefined}
        onChange={(e) => update((p) => (e.target.value ? p.set("from", e.target.value) : p.delete("from")))}
        className={selectClass}
        aria-label="From date"
      />
      <input
        type="date"
        value={to}
        min={from || undefined}
        onChange={(e) => update((p) => (e.target.value ? p.set("to", e.target.value) : p.delete("to")))}
        className={selectClass}
        aria-label="To date"
      />

      {hasFilters && (
        <button
          onClick={() => {
            setQ("");
            router.push("/app/invoices");
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="size-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
