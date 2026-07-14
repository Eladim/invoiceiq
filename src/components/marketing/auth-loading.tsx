import { Loader2, ScanLine } from "lucide-react";

/**
 * Branded placeholder shown (via Clerk's <ClerkLoading>) while the Clerk auth
 * widget initializes, so the page doesn't flash an empty area. Sized close to
 * the Clerk card to keep layout shift minimal.
 */
export function AuthLoading() {
  return (
    <div className="flex min-h-[420px] w-full max-w-sm flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm">
        <ScanLine className="size-6" />
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Loader2 className="size-4 animate-spin text-indigo-600" />
        Loading&hellip;
      </div>
    </div>
  );
}
