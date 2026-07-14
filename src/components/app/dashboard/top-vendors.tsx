import { formatMoney } from "@/lib/format";

export function TopVendors({
  vendors,
  currency,
}: {
  vendors: { vendor: string; total: number }[];
  currency: string;
}) {
  const max = Math.max(1, ...vendors.map((v) => v.total));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-700">Top vendors</h2>
      {vendors.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No vendor data yet.</p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {vendors.map((v) => (
            <li key={v.vendor} className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-600">
                {v.vendor.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-slate-700">{v.vendor}</span>
                  <span className="shrink-0 tabular-nums text-slate-900">
                    {formatMoney(v.total, currency)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${Math.max(4, (v.total / max) * 100)}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
