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
