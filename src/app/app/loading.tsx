export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-slate-200" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-80 rounded-xl border border-slate-200 bg-white lg:col-span-2" />
        <div className="h-80 rounded-xl border border-slate-200 bg-white" />
      </div>

      <div className="mt-4 h-56 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
