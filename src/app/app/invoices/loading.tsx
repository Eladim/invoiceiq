export default function InvoicesLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="h-7 w-32 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-slate-200" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <div className="h-9 flex-1 basis-64 rounded-lg bg-slate-100" />
        <div className="h-9 w-32 rounded-lg bg-slate-100" />
        <div className="h-9 w-32 rounded-lg bg-slate-100" />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-4 py-3.5 last:border-0">
              <div className="size-7 shrink-0 rounded-full bg-slate-100" />
              <div className="h-4 flex-1 rounded bg-slate-100" />
              <div className="h-4 w-20 rounded bg-slate-100" />
              <div className="h-4 w-16 rounded bg-slate-100" />
              <div className="h-5 w-20 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
