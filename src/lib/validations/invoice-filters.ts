export const INVOICE_STATUSES = ["processing", "completed", "failed"] as const;
export const INVOICE_CATEGORIES = [
  "software",
  "office",
  "travel",
  "utilities",
  "marketing",
  "other",
] as const;
export const SORT_KEYS = ["createdAt", "vendor", "date", "total"] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type InvoiceCategory = (typeof INVOICE_CATEGORIES)[number];
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

export type InvoiceFilters = {
  q: string;
  status: InvoiceStatus | null;
  category: InvoiceCategory | null;
  from: string | null;
  to: string | null;
  sort: SortKey;
  dir: SortDir;
  cursor: string | null;
  /** Stack of prior-page cursors ("" = first page) for Previous navigation. */
  pc: string[];
};

export type Cursor = { v: string | null; id: string };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseInvoiceFilters(sp: SearchParams): InvoiceFilters {
  const fromRaw = first(sp.from);
  const toRaw = first(sp.to);
  return {
    q: (first(sp.q) ?? "").slice(0, 100),
    status: INVOICE_STATUSES.find((s) => s === first(sp.status)) ?? null,
    category: INVOICE_CATEGORIES.find((c) => c === first(sp.category)) ?? null,
    from: fromRaw && DATE_RE.test(fromRaw) ? fromRaw : null,
    to: toRaw && DATE_RE.test(toRaw) ? toRaw : null,
    sort: SORT_KEYS.find((k) => k === first(sp.sort)) ?? "createdAt",
    dir: first(sp.dir) === "asc" ? "asc" : "desc",
    cursor: first(sp.cursor) ?? null,
    pc: decodePc(first(sp.pc)),
  };
}

export function hasActiveFilters(f: InvoiceFilters): boolean {
  return Boolean(f.q || f.status || f.category || f.from || f.to);
}

// btoa/atob are available in both the Node server runtime and the browser.
export function encodeCursor(c: Cursor): string {
  return btoa(JSON.stringify(c));
}
export function decodeCursor(s: string | null): Cursor | null {
  if (!s) return null;
  try {
    const parsed = JSON.parse(atob(s));
    if (parsed && typeof parsed.id === "string") {
      return { v: parsed.v ?? null, id: parsed.id };
    }
  } catch {
    return null;
  }
  return null;
}
export function encodePc(stack: string[]): string {
  return btoa(JSON.stringify(stack));
}
export function decodePc(s: string | undefined): string[] {
  if (!s) return [];
  try {
    const arr = JSON.parse(atob(s));
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Build an /app/invoices href, preserving filters with the given overrides. */
export function invoicesHref(
  f: InvoiceFilters,
  overrides: Partial<Pick<InvoiceFilters, "sort" | "dir" | "cursor" | "pc">> = {},
): string {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.status) params.set("status", f.status);
  if (f.category) params.set("category", f.category);
  if (f.from) params.set("from", f.from);
  if (f.to) params.set("to", f.to);

  const sort = overrides.sort ?? f.sort;
  const dir = overrides.dir ?? f.dir;
  if (sort !== "createdAt" || dir !== "desc") {
    params.set("sort", sort);
    params.set("dir", dir);
  }

  const cursor = overrides.cursor !== undefined ? overrides.cursor : f.cursor;
  if (cursor) params.set("cursor", cursor);

  const pc = overrides.pc ?? [];
  if (pc.length) params.set("pc", encodePc(pc));

  const qs = params.toString();
  return qs ? `/app/invoices?${qs}` : "/app/invoices";
}
