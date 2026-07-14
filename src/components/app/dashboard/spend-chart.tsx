"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import type { MonthlySpend } from "@/server/queries/dashboard";

const RANGES = [
  { label: "3m", months: 3 },
  { label: "6m", months: 6 },
  { label: "1y", months: 12 },
] as const;

export function SpendChart({
  data,
  currency,
}: {
  data: MonthlySpend[];
  currency: string;
}) {
  const [months, setMonths] = useState(6);
  const sliced = data.slice(Math.max(0, data.length - months));

  const compact = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  const full = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Spend over time</h2>
        <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-xs font-medium">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setMonths(r.months)}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                months === r.months ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sliced} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
            />
            <YAxis
              tickFormatter={compact}
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
            />
            <Tooltip
              formatter={(value) => [full(Number(value)), "Spend"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#4f46e5"
              strokeWidth={2}
              fill="url(#spendFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
