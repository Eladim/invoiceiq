"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ACCEPT_ATTRIBUTE,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/validations/upload";
import { uploadInvoice, type UploadResult } from "@/server/actions/upload";

function clientValidate(file: File): string | null {
  if (file.size === 0) return "File is empty";
  if (file.size > MAX_FILE_SIZE) return "File exceeds the 10 MB limit";
  if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Only PDF, PNG, or JPG files are allowed";
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [pending, startTransition] = useTransition();

  function selectFile(next: File) {
    setResult(null);
    const err = clientValidate(next);
    if (err) {
      setFile(null);
      setResult({ ok: false, code: "invalid_file", message: err });
      return;
    }
    setFile(next);
  }

  function onUpload() {
    if (!file || pending) return;
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const res = await uploadInvoice(formData);
      setResult(res);
      if (res.ok) {
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh(); // refresh usage meter + any lists
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-lg font-semibold">Upload an invoice</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We&apos;ll store it securely and (soon) extract the details with AI.
      </p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) selectFile(dropped);
        }}
        className={cn(
          "mt-6 flex min-h-52 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            if (chosen) selectFile(chosen);
          }}
        />
        <UploadCloud className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Drag &amp; drop an invoice, or click to browse</p>
        <p className="text-xs text-muted-foreground">PDF, PNG, JPG · max 10 MB</p>
      </label>

      {file && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border p-3">
          <FileText className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          {!pending && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove file"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      )}

      <div className="mt-4">
        <Button onClick={onUpload} disabled={!file || pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Uploading…
            </>
          ) : (
            "Upload"
          )}
        </Button>
      </div>

      {result && !result.ok && result.code === "quota_exceeded" && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">{result.message}</p>
            <Link
              href="/app/billing"
              className="mt-1 inline-block font-medium underline underline-offset-4"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      )}

      {result && !result.ok && result.code !== "quota_exceeded" && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{result.message}</p>
        </div>
      )}

      {result?.ok && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <div>
            <p className="font-medium">Uploaded — processing has started.</p>
            <Link
              href="/app/invoices"
              className="mt-1 inline-block font-medium underline underline-offset-4"
            >
              View invoices
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
