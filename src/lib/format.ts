/** Format a money amount (DB numeric string or number) with Intl. */
export function formatMoney(
  total: string | number | null,
  currency: string | null = "USD",
): string {
  if (total === null) return "—";
  const value = typeof total === "number" ? total : Number(total);
  if (Number.isNaN(value)) return String(total);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency ?? "USD",
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

/** Format an ISO date (YYYY-MM-DD) as e.g. "Mar 14, 2026". */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/** Format a full ISO datetime or epoch-seconds as e.g. "Aug 1, 2026". */
export function formatLongDate(input: string | number | null): string {
  if (input === null) return "—";
  const d = typeof input === "number" ? new Date(input * 1000) : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}
