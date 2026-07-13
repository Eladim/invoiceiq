"use client";

import { useState } from "react";
import { FileText, Minus, Plus, RotateCcw } from "lucide-react";

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2];

export function DocumentPreview({
  fileUrl,
  isPdf,
  filename,
}: {
  fileUrl: string;
  isPdf: boolean;
  filename: string;
}) {
  const [zoomIdx, setZoomIdx] = useState(1);
  const zoom = ZOOM_STEPS[zoomIdx];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
          <FileText className="size-4 shrink-0" />
          <span className="truncate">{filename}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
            disabled={zoomIdx === 0}
            aria-label="Zoom out"
            className="flex rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center text-xs tabular-nums text-slate-500">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
            disabled={zoomIdx === ZOOM_STEPS.length - 1}
            aria-label="Zoom in"
            className="flex rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
          <button
            onClick={() => setZoomIdx(1)}
            aria-label="Reset zoom"
            className="flex rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="min-h-[60vh] flex-1 overflow-auto bg-slate-100 p-4">
        {isPdf ? (
          <iframe
            title={filename}
            src={fileUrl}
            className="mx-auto block h-[70vh] rounded border border-slate-200 bg-white"
            style={{ width: `${100 * zoom}%`, maxWidth: zoom <= 1 ? "100%" : "none" }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={filename}
            src={fileUrl}
            className="mx-auto block origin-top rounded border border-slate-200 bg-white"
            style={{ transform: `scale(${zoom})` }}
          />
        )}
      </div>
    </div>
  );
}
