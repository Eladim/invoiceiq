import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Lightweight inline-SVG sparkline (no chart lib, server-renderable). */
function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2 || data.every((v) => v === data[0])) return null;
  const w = 96;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 3) - 1.5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-7 w-24", className)}
      aria-hidden
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  deltaPct,
  subtitle,
  spark,
  sparkClassName = "text-indigo-500",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  deltaPct?: number | null;
  subtitle?: string;
  spark?: number[];
  sparkClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
        {spark && <Sparkline data={spark} className={sparkClassName} />}
      </div>
      {deltaPct !== undefined && deltaPct !== null ? (
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-0.5 text-xs font-medium",
            deltaPct >= 0 ? "text-emerald-600" : "text-red-600",
          )}
        >
          {deltaPct >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          {Math.abs(deltaPct).toFixed(0)}% vs last month
        </p>
      ) : subtitle ? (
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      ) : (
        <p className="mt-1 text-xs text-slate-400">&nbsp;</p>
      )}
    </div>
  );
}
