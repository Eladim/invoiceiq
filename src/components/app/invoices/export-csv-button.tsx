import { Download, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Export-CSV control. Pro users get a download link to /api/export; free users
 * get a disabled button with a Pro-lock tooltip. `ids` scopes to a selection.
 */
export function ExportCsvButton({
  isPro,
  ids,
  label = "Export CSV",
  className,
}: {
  isPro: boolean;
  ids?: string[];
  label?: string;
  className?: string;
}) {
  const href = ids && ids.length > 0 ? `/api/export?ids=${ids.join(",")}` : "/api/export";
  const base =
    "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors";

  if (isPro) {
    return (
      <a
        href={href}
        className={cn(base, "border-slate-200 bg-white text-slate-700 hover:bg-slate-50", className)}
      >
        <Download className="size-4" />
        {label}
      </a>
    );
  }

  return (
    <div className="group relative">
      <button
        type="button"
        disabled
        className={cn(base, "cursor-not-allowed border-slate-200 bg-white text-slate-400", className)}
      >
        <Lock className="size-3.5" />
        {label}
      </button>
      <span className="pointer-events-none absolute top-full right-0 z-20 mt-1 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white group-hover:block">
        Upgrade to Pro to export
      </span>
    </div>
  );
}
