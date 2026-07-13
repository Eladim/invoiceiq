"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import {
  ArrowLeft,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { INVOICE_CATEGORIES, type InvoiceStatus } from "@/lib/validations/invoice-filters";
import { CONFIDENCE_KEYS, type EditableField } from "@/lib/validations/invoice-update";
import { deleteInvoice, reprocessInvoice, updateInvoice } from "@/server/actions/invoice";
import type { FieldConfidence } from "@/server/db/schema";
import { DocumentPreview } from "./document-preview";
import { StatusBadge } from "./badges";

type FormState = Record<EditableField, string>;
type LineItemState = { description: string; quantity: string; unitPrice: string; amount: string };

export type InvoiceDetailProps = {
  id: string;
  status: InvoiceStatus;
  failureReason: string | null;
  fileUrl: string;
  isPdf: boolean;
  filename: string;
  confidence: FieldConfidence | null;
  initial: FormState;
  lineItems: LineItemState[];
};

const parseNum = (s: string): number | null => {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
};

function ConfidenceDot({ level }: { level?: "low" | "medium" | "high" }) {
  return (
    <span
      className={cn(
        "size-1.5 rounded-full",
        level === "high" ? "bg-emerald-500" : level === "low" ? "bg-amber-500" : "bg-slate-300",
      )}
    />
  );
}

export function InvoiceDetail(props: InvoiceDetailProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(props.initial);
  const [lineItems, setLineItems] = useState<LineItemState[]>(props.lineItems);
  const [pending, startTransition] = useTransition();
  const [reprocessing, startReprocess] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (field: EditableField, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const changedFields = useMemo(
    () =>
      (Object.keys(CONFIDENCE_KEYS) as EditableField[])
        .filter((field) => form[field] !== props.initial[field])
        .map((field) => CONFIDENCE_KEYS[field]),
    [form, props.initial],
  );

  const dirty =
    changedFields.length > 0 ||
    JSON.stringify(lineItems) !== JSON.stringify(props.lineItems);

  // Line-item sum vs subtotal consistency (SPEC §7).
  const lineSum = lineItems.reduce((acc, li) => acc + (parseNum(li.amount) ?? 0), 0);
  const subtotalNum = parseNum(form.subtotal);
  const sumMismatch = subtotalNum !== null && lineItems.length > 0 && Math.abs(lineSum - subtotalNum) > 0.05;

  const confidenceOf = (field: EditableField) => props.confidence?.[CONFIDENCE_KEYS[field]];

  function onSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateInvoice({
        id: props.id,
        vendorName: form.vendorName.trim() || null,
        vendorAddress: form.vendorAddress.trim() || null,
        invoiceNumber: form.invoiceNumber.trim() || null,
        invoiceDate: form.invoiceDate || null,
        dueDate: form.dueDate || null,
        currency: form.currency.trim() ? form.currency.trim().toUpperCase() : null,
        category: form.category || null,
        subtotal: parseNum(form.subtotal),
        tax: parseNum(form.tax),
        total: parseNum(form.total),
        lineItems: lineItems
          .filter((li) => li.description.trim())
          .map((li) => ({
            description: li.description.trim(),
            quantity: parseNum(li.quantity),
            unitPrice: parseNum(li.unitPrice),
            amount: parseNum(li.amount) ?? 0,
          })),
        changedFields,
      });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  function onReprocess() {
    startReprocess(async () => {
      await reprocessInvoice(props.id);
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await deleteInvoice(props.id);
      if (res.ok) router.push("/app/invoices");
      else {
        setError(res.error);
        setDeleteOpen(false);
      }
    });
  }

  const vendorTitle = form.vendorName.trim() || "Untitled invoice";

  return (
    <div className="mx-auto max-w-6xl pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/app/invoices"
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
          aria-label="Back to invoices"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="min-w-0 truncate text-xl font-bold tracking-tight text-slate-900">
          {vendorTitle}
        </h1>
        <StatusBadge status={props.status} />
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onReprocess}
            disabled={reprocessing}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {reprocessing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Reprocess with AI
          </button>
          <button
            disabled
            title="Exporting is a Pro feature — coming soon"
            className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-400"
          >
            <Lock className="size-3.5" />
            Export
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        </div>
      </div>

      {props.status === "failed" && props.failureReason && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <TriangleAlert className="size-4 shrink-0" />
          {props.failureReason}
        </div>
      )}

      {/* Two-pane */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[55fr_45fr]">
        <DocumentPreview fileUrl={props.fileUrl} isPdf={props.isPdf} filename={props.filename} />

        <div className="flex flex-col gap-4">
          <Card title="Summary">
            <Field label="Vendor" field="vendorName" value={form.vendorName} onChange={setField} level={confidenceOf("vendorName")} />
            <Field label="Vendor address" field="vendorAddress" value={form.vendorAddress} onChange={setField} level={confidenceOf("vendorAddress")} />
            <Field label="Invoice #" field="invoiceNumber" value={form.invoiceNumber} onChange={setField} level={confidenceOf("invoiceNumber")} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Invoice date" field="invoiceDate" type="date" value={form.invoiceDate} onChange={setField} level={confidenceOf("invoiceDate")} />
              <Field label="Due date" field="dueDate" type="date" value={form.dueDate} onChange={setField} level={confidenceOf("dueDate")} />
            </div>
            <Field
              label="Category"
              field="category"
              type="select"
              value={form.category}
              onChange={setField}
              level={confidenceOf("category")}
            />
          </Card>

          <Card title="Amounts">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Subtotal" field="subtotal" type="decimal" value={form.subtotal} onChange={setField} level={confidenceOf("subtotal")} />
              <Field label="Tax" field="tax" type="decimal" value={form.tax} onChange={setField} level={confidenceOf("tax")} />
              <Field label="Total" field="total" type="decimal" value={form.total} onChange={setField} level={confidenceOf("total")} />
              <Field label="Currency" field="currency" value={form.currency} onChange={setField} level={confidenceOf("currency")} />
            </div>
          </Card>
        </div>
      </div>

      {/* Line items */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-700">Line items</h2>
          <button
            onClick={() =>
              setLineItems((items) => [...items, { description: "", quantity: "", unitPrice: "", amount: "" }])
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="size-3.5" />
            Add row
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="w-20 px-2 py-2 font-medium">Qty</th>
              <th className="w-28 px-2 py-2 font-medium">Unit price</th>
              <th className="w-28 px-2 py-2 text-right font-medium">Amount</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                  No line items. Add one above.
                </td>
              </tr>
            )}
            {lineItems.map((li, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-1.5">
                  <input
                    value={li.description}
                    onChange={(e) => setLineItems((it) => it.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                    className="w-full rounded-md border border-transparent px-2 py-1 outline-none hover:border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Item description"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={li.quantity}
                    inputMode="decimal"
                    onChange={(e) => setLineItems((it) => it.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))}
                    className="w-full rounded-md border border-transparent px-2 py-1 tabular-nums outline-none hover:border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={li.unitPrice}
                    inputMode="decimal"
                    onChange={(e) => setLineItems((it) => it.map((x, j) => (j === i ? { ...x, unitPrice: e.target.value } : x)))}
                    className="w-full rounded-md border border-transparent px-2 py-1 tabular-nums outline-none hover:border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={li.amount}
                    inputMode="decimal"
                    onChange={(e) => setLineItems((it) => it.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
                    className="w-full rounded-md border border-transparent px-2 py-1 text-right tabular-nums outline-none hover:border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    onClick={() => setLineItems((it) => it.filter((_, j) => j !== i))}
                    aria-label="Remove line item"
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={cn("border-t border-slate-200", sumMismatch && "bg-red-50")}>
              <td colSpan={3} className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">
                {sumMismatch ? (
                  <span className="inline-flex items-center gap-1.5 text-red-600">
                    <TriangleAlert className="size-3.5" />
                    Line items ({formatMoney(lineSum, form.currency || null)}) don&rsquo;t match the subtotal
                  </span>
                ) : (
                  "Line items total"
                )}
              </td>
              <td className={cn("px-2 py-2.5 text-right font-semibold tabular-nums", sumMismatch ? "text-red-600" : "text-slate-900")}>
                {formatMoney(lineSum, form.currency || null)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {/* Save bar */}
      {dirty && (
        <div
          style={{ animation: "iq-slide-up .2s ease both" }}
          className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl"
        >
          <span className="pl-1 text-sm text-slate-600">Unsaved changes</span>
          <button
            onClick={() => {
              setForm(props.initial);
              setLineItems(props.lineItems);
              setError(null);
            }}
            disabled={pending}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 shadow-xl transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            <Dialog.Title className="text-base font-semibold text-slate-900">Delete invoice?</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-500">
              This permanently removes the invoice, its line items and the stored file. This can&rsquo;t be undone.
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close
                render={
                  <button className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                    Cancel
                  </button>
                }
              />
              <button
                onClick={onDelete}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                Delete
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

function Field({
  label,
  field,
  value,
  onChange,
  level,
  type = "text",
}: {
  label: string;
  field: EditableField;
  value: string;
  onChange: (field: EditableField, value: string) => void;
  level?: "low" | "medium" | "high";
  type?: "text" | "date" | "decimal" | "select";
}) {
  const low = level === "low";
  return (
    <div
      className={cn("-mx-2.5 rounded-lg px-2.5 py-1.5", low && "bg-amber-50")}
      title={low ? "AI wasn't sure — please verify" : undefined}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <label className="text-xs font-medium text-slate-500">{label}</label>
        <ConfidenceDot level={level} />
      </div>
      {type === "select" ? (
        <select value={value} onChange={(e) => onChange(field, e.target.value)} className={cn(inputClass, "capitalize")}>
          <option value="">Uncategorized</option>
          {INVOICE_CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type === "date" ? "date" : "text"}
          inputMode={type === "decimal" ? "decimal" : undefined}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className={cn(inputClass, type === "decimal" && "tabular-nums")}
        />
      )}
    </div>
  );
}
