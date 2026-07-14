import Link from "next/link";
import { FileX } from "lucide-react";

export default function InvoiceNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <FileX className="size-6" />
      </div>
      <div>
        <p className="font-semibold text-slate-900">Invoice not found</p>
        <p className="mt-1 text-sm text-slate-500">
          This invoice doesn&rsquo;t exist, or you don&rsquo;t have access to it.
        </p>
      </div>
      <Link
        href="/app/invoices"
        className="mt-1 inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        Back to invoices
      </Link>
    </div>
  );
}
