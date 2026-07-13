"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteInvoice } from "@/server/actions/invoice";

export function DeleteInvoiceButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm(`Delete "${label}"? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteInvoice(id);
      if (res.ok) router.refresh();
      else window.alert(res.error);
    });
  }

  return (
    <button
      onClick={onDelete}
      disabled={pending}
      title="Delete"
      aria-label="Delete invoice"
      className="flex rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
