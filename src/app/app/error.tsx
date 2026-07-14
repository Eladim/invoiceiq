"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <TriangleAlert className="size-6" />
      </div>
      <div>
        <p className="font-semibold text-slate-900">Something went wrong</p>
        <p className="mt-1 text-sm text-slate-500">
          An unexpected error occurred while loading this page.
        </p>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button
          onClick={reset}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <RotateCw className="size-4" />
          Try again
        </button>
        <Link
          href="/app"
          className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
