import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Catmull-Rom → cubic-bezier smoothing for a nicer sparkline curve. */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 3) return "M" + pts.map((p) => `${p[0]},${p[1]}`).join(" L");
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

/** Inline-SVG area+line sparkline (no chart lib, server-renderable). */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2 || data.every((v) => v === data[0])) {
    return <div className="h-[30px] w-24" />;
  }
  const w = 96;
  const h = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map(
    (v, i): [number, number] => [(i / (data.length - 1)) * w, h - 2 - ((v - min) / range) * (h - 5)],
  );
  const line = smoothPath(pts);
  const area = `${line} L${w},${h} L0,${h} Z`;
  const id = `spark-${color.replace("#", "")}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-[30px] w-24 overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
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
  color = "#6366f1",
  iconClassName = "bg-indigo-50 text-indigo-600",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  deltaPct?: number | null;
  subtitle?: string;
  spark?: number[];
  color?: string;
  iconClassName?: string;
}) {
  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className={cn("flex size-[30px] items-center justify-center rounded-[9px]", iconClassName)}>
          <Icon className="size-[15px]" />
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2.5">
        <span className="text-2xl font-extrabold tracking-tight tabular-nums text-slate-900">
          {value}
        </span>
        {spark && <Sparkline data={spark} color={color} />}
      </div>
      {deltaPct !== undefined && deltaPct !== null ? (
        <p
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 text-xs font-semibold",
            deltaPct >= 0 ? "text-emerald-600" : "text-red-600",
          )}
        >
          {deltaPct >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          {Math.abs(deltaPct).toFixed(1)}%
          <span className="font-medium text-slate-400">vs last month</span>
        </p>
      ) : subtitle ? (
        <p className="mt-1.5 text-xs text-slate-400">{subtitle}</p>
      ) : (
        <p className="mt-1.5 text-xs text-slate-400">&nbsp;</p>
      )}
    </div>
  );
}
