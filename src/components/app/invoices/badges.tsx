import { cn } from "@/lib/utils";
import type { InvoiceCategory, InvoiceStatus } from "@/lib/validations/invoice-filters";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  processing: "border-amber-200 bg-amber-50 text-amber-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  completed: "Completed",
  processing: "Processing",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "completed" && "bg-emerald-500",
          status === "processing" && "animate-pulse bg-amber-500",
          status === "failed" && "bg-red-500",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

const CATEGORY_STYLES: Record<InvoiceCategory, string> = {
  software: "border-indigo-200 bg-indigo-50 text-indigo-700",
  office: "border-slate-200 bg-slate-100 text-slate-600",
  travel: "border-sky-200 bg-sky-50 text-sky-700",
  utilities: "border-amber-200 bg-amber-50 text-amber-700",
  marketing: "border-pink-200 bg-pink-50 text-pink-700",
  other: "border-slate-200 bg-slate-100 text-slate-600",
};

export function CategoryBadge({ category }: { category: InvoiceCategory | null }) {
  if (!category) return <span className="text-slate-400">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        CATEGORY_STYLES[category],
      )}
    >
      {category}
    </span>
  );
}
