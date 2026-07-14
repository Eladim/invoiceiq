"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, FileText, Lock, RotateCw, UploadCloud, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ACCEPT_ATTRIBUTE,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/validations/upload";
import type { UsageSummary } from "@/server/queries/usage";
import { uploadInvoice } from "@/server/actions/upload";

type QueueStatus = "uploading" | "extracting" | "success" | "error";

type QueueItem = {
  id: string;
  file: File | null;
  name: string;
  size: string;
  status: QueueStatus;
  progress: number;
  invoiceId?: string;
  vendor?: string;
  date?: string;
  total?: string;
  reason?: string;
  retriable: boolean;
};

const POLL_INTERVAL_MS = 1600;
const MAX_POLLS = 45; // ~72s before giving up on a stuck extraction

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function clientValidate(file: File): string | null {
  if (file.size === 0) return "File is empty";
  if (file.size > MAX_FILE_SIZE) return "File exceeds the 10 MB limit";
  if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Unsupported file type — use PDF, PNG or JPG";
  }
  return null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function formatMoney(total: string | null, currency: string | null): string {
  if (total === null) return "—";
  const value = Number(total);
  if (Number.isNaN(value)) return total;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency ?? "USD",
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

export function UploadForm({ usage }: { usage: UsageSummary }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [used, setUsed] = useState(usage.used);

  const limit = usage.limit; // null = unlimited (Pro)
  const atLimit = limit !== null && used >= limit;

  // Keep the latest queue and cancellation set available to async callbacks.
  const queueRef = useRef(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  const cancelled = useRef(new Set<string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((t) => clearTimeout(t));
  }, []);

  const patch = useCallback((id: string, changes: Partial<QueueItem>) => {
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  }, []);

  const pollStatus = useCallback(
    (id: string, invoiceId: string) => {
      let attempt = 0;
      const tick = async () => {
        if (cancelled.current.has(id)) return;
        if (attempt >= MAX_POLLS) {
          patch(id, {
            status: "error",
            reason: "This is taking longer than expected. Try again.",
            retriable: true,
          });
          return;
        }
        attempt += 1;
        try {
          const res = await fetch(`/api/invoices/${invoiceId}/status`, { cache: "no-store" });
          if (!res.ok) throw new Error(`status ${res.status}`);
          const data = await res.json();

          if (data.status === "processing") {
            timers.current.set(`poll-${id}`, setTimeout(tick, POLL_INTERVAL_MS));
            return;
          }
          if (data.status === "completed") {
            patch(id, {
              status: "success",
              vendor: data.vendorName ?? "Unknown vendor",
              date: formatDate(data.invoiceDate),
              total: formatMoney(data.total, data.currency),
            });
            setUsed((u) => (limit === null ? u + 1 : Math.min(limit, u + 1)));
            router.refresh(); // update the sidebar usage meter
          } else {
            patch(id, {
              status: "error",
              reason: data.failureReason ?? "Extraction failed. Please try again.",
              retriable: true,
            });
          }
        } catch {
          // Transient network error — back off and retry.
          timers.current.set(`poll-${id}`, setTimeout(tick, POLL_INTERVAL_MS * 1.5));
        }
      };
      timers.current.set(`poll-${id}`, setTimeout(tick, POLL_INTERVAL_MS));
    },
    [limit, patch, router],
  );

  const processFile = useCallback(
    async (id: string, file: File) => {
      patch(id, { status: "uploading", progress: 8, reason: undefined });

      // We can't measure a Server Action's upload progress, so ramp toward 90%.
      const ramp = setInterval(() => {
        setQueue((q) =>
          q.map((it) =>
            it.id === id && it.status === "uploading"
              ? { ...it, progress: Math.min(90, it.progress + 6 + Math.random() * 8) }
              : it,
          ),
        );
      }, 150);
      timers.current.set(`ramp-${id}`, ramp as unknown as ReturnType<typeof setTimeout>);

      let result;
      try {
        const formData = new FormData();
        formData.append("file", file);
        result = await uploadInvoice(formData);
      } catch {
        clearInterval(ramp);
        patch(id, { status: "error", reason: "Upload failed. Try again.", retriable: true });
        return;
      }
      clearInterval(ramp);

      if (cancelled.current.has(id)) return;

      if (!result.ok) {
        if (result.code === "quota_exceeded") {
          setUsed(limit ?? 5); // reflect that we're at the cap
        }
        patch(id, {
          status: "error",
          reason: result.message,
          retriable: result.code !== "invalid_file",
        });
        return;
      }

      patch(id, { status: "extracting", progress: 100, invoiceId: result.invoiceId });
      pollStatus(id, result.invoiceId);
    },
    [limit, patch, pollStatus],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      if (atLimit || files.length === 0) return;
      const items: QueueItem[] = files.map((file) => {
        const error = clientValidate(file);
        return {
          id: crypto.randomUUID(),
          file: error ? null : file,
          name: file.name,
          size: formatBytes(file.size),
          status: error ? "error" : "uploading",
          progress: 0,
          reason: error ?? undefined,
          retriable: false,
        };
      });
      setQueue((q) => [...q, ...items]);
      items.forEach((it) => {
        if (it.file) void processFile(it.id, it.file);
      });
    },
    [atLimit, processFile],
  );

  function retry(id: string) {
    const item = queueRef.current.find((q) => q.id === id);
    if (item?.file) void processFile(id, item.file);
  }

  function remove(id: string) {
    cancelled.current.add(id);
    const ramp = timers.current.get(`ramp-${id}`);
    const poll = timers.current.get(`poll-${id}`);
    if (ramp) clearInterval(ramp);
    if (poll) clearTimeout(poll);
    setQueue((q) => q.filter((it) => it.id !== id));
  }

  function clearDone() {
    setQueue((q) => q.filter((it) => it.status !== "success"));
  }

  const doneCount = queue.filter((q) => q.status === "success").length;
  const usedPct = limit === null ? 0 : Math.min(100, (used / limit) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Upload invoices</h1>
      <p className="mt-1.5 mb-7 text-sm text-slate-500">
        Drop your invoices below — our AI reads them and extracts vendor, date, line items and
        totals automatically.
      </p>

      {/* Drop zone */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!atLimit) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(Array.from(e.dataTransfer.files ?? []));
        }}
        className={cn(
          "relative flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed bg-white px-6 py-12 text-center transition-colors",
          atLimit ? "cursor-default border-slate-200" : "cursor-pointer border-slate-300 hover:border-indigo-300",
          dragOver && "border-indigo-600 bg-indigo-600/5",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          disabled={atLimit}
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <UploadCloud className="size-6" />
        </div>
        <div className="text-[15px] font-semibold text-slate-900">
          Drag &amp; drop invoices or <span className="text-indigo-600">click to browse</span>
        </div>
        <div className="text-xs text-slate-400">PDF, PNG, JPG · max 10 MB · multiple files supported</div>

        {dragOver && !atLimit && (
          <div className="pointer-events-none absolute -inset-0.5 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-600 bg-indigo-600/5">
            <span className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700">
              Drop files to upload
            </span>
          </div>
        )}

        {atLimit && (
          <div className="absolute -inset-0.5 flex items-center justify-center rounded-2xl bg-slate-50/75 p-5 backdrop-blur-[3px]">
            <div className="flex max-w-sm flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-6 shadow-lg">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Lock className="size-[18px]" />
              </div>
              <div className="text-center text-[14.5px] font-bold text-slate-900">
                You&rsquo;ve used all {limit} free documents this month
              </div>
              <div className="text-center text-xs text-slate-500">
                Upgrade to Pro for unlimited uploads and priority AI extraction.
              </div>
              <Link
                href="/app/billing"
                className="mt-2 rounded-[10px] bg-indigo-600 px-[18px] py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        )}
      </label>

      {/* Usage bar */}
      {limit !== null && (
        <div className="mt-3.5 ml-0.5 flex items-center gap-2.5">
          <div className="h-1 w-30 overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                used >= limit - 1 ? "bg-amber-500" : "bg-indigo-600",
              )}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">
            {used} of {limit} free documents used this month
          </span>
        </div>
      )}

      {/* Queue */}
      {queue.length > 0 && (
        <div className="mt-8 mb-3 ml-0.5 flex items-baseline justify-between">
          <div className="text-[13px] font-semibold text-slate-700">
            Upload queue · {queue.length} {queue.length === 1 ? "file" : "files"}
          </div>
          {doneCount > 0 && (
            <button
              onClick={clearDone}
              className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              Clear completed
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {queue.map((f) => (
          <div
            key={f.id}
            style={{ animation: "iq-pop .25s ease both" }}
            className={cn(
              "rounded-2xl border bg-white p-4",
              f.status === "error" ? "border-red-200" : "border-slate-200",
            )}
          >
            <div className="flex items-center gap-3">
              {/* Thumbnail with scan line while extracting */}
              <div className="relative flex h-13 w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-slate-400">
                <FileText className="size-[18px]" />
                {f.status === "extracting" && (
                  <div
                    className="absolute right-[3px] left-[3px] h-0.5 rounded-full bg-gradient-to-r from-transparent via-indigo-600 to-transparent shadow-[0_0_8px_rgba(79,70,229,0.7)]"
                    style={{ animation: "iq-scan 1.5s ease-in-out infinite", top: "8%" }}
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="truncate text-[13.5px] font-semibold text-slate-900">{f.name}</div>
                <div className="text-xs text-slate-400">{f.size}</div>
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                {f.status === "uploading" && (
                  <span className="text-xs font-semibold tabular-nums text-slate-500">
                    {Math.round(f.progress)}%
                  </span>
                )}
                {f.status === "extracting" && (
                  <span className="flex items-center gap-[7px] text-xs font-semibold text-indigo-600">
                    <span className="size-[13px] animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                    AI extracting…
                  </span>
                )}
                {f.status === "success" && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <Check className="size-3.5" strokeWidth={2.6} />
                    Extracted
                  </span>
                )}
                {f.status === "error" && <CircleAlert className="size-4 text-red-600" />}
                <button
                  onClick={() => remove(f.id)}
                  title="Remove"
                  className="flex rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="size-3.5" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {f.status === "uploading" && (
              <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-150"
                  style={{ width: `${f.progress}%` }}
                />
              </div>
            )}

            {f.status === "extracting" && (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[150, 104, 82].map((w, i) => (
                    <span
                      key={w}
                      className="block h-[26px] rounded-full"
                      style={{
                        width: w,
                        backgroundImage:
                          "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 40%,#f1f5f9 60%)",
                        backgroundSize: "640px 100%",
                        animation: `iq-shimmer 1.3s linear infinite ${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-2 text-[11.5px] text-slate-400">
                  Reading vendor, date and totals…
                </div>
              </>
            )}

            {f.status === "success" && (
              <div
                className="mt-3 flex flex-wrap items-center gap-2"
                style={{ animation: "iq-pop .3s ease both" }}
              >
                <Chip label="VENDOR" value={f.vendor ?? "—"} />
                <Chip label="DATE" value={f.date ?? "—"} />
                <span className="inline-flex items-baseline gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-[11px] py-[5px] text-[12.5px] font-bold tabular-nums text-emerald-700">
                  <span className="text-[10px] font-semibold tracking-wide text-emerald-400">TOTAL</span>
                  {f.total ?? "—"}
                </span>
                <span className="flex-1" />
                <Link
                  href={f.invoiceId ? `/app/invoices/${f.invoiceId}` : "/app/invoices"}
                  className="rounded-[9px] bg-indigo-600 px-[15px] py-[7px] text-[12.5px] font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Review
                </Link>
              </div>
            )}

            {f.status === "error" && (
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <span className="min-w-45 flex-1 text-[12.5px] font-medium text-red-600">
                  {f.reason}
                </span>
                <div className="flex items-center gap-2">
                  {f.retriable && (
                    <button
                      onClick={() => retry(f.id)}
                      className="flex items-center gap-1.5 rounded-[9px] border border-slate-200 bg-white px-[13px] py-1.5 text-[12.5px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      <RotateCw className="size-3" strokeWidth={2.2} />
                      Retry
                    </button>
                  )}
                  <button
                    onClick={() => remove(f.id)}
                    className="rounded-[9px] px-2.5 py-1.5 text-[12.5px] font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-[11px] py-[5px] text-[12.5px] font-semibold text-slate-700">
      <span className="text-[10px] font-semibold tracking-wide text-slate-400">{label}</span>
      {value}
    </span>
  );
}
