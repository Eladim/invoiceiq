export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      {/* Title */}
      <div className="h-7 w-32 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-56 rounded bg-slate-100" />

      {/* Tabs */}
      <div className="mt-6 flex gap-4 border-b border-slate-200 pb-3">
        <div className="h-4 w-16 rounded bg-slate-200" />
        <div className="h-4 w-24 rounded bg-slate-100" />
      </div>

      {/* Profile card */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-slate-100" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-3 w-52 rounded bg-slate-100" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-16 rounded bg-slate-50" />
          <div className="h-16 rounded bg-slate-50" />
          <div className="h-16 rounded bg-slate-50" />
        </div>
        <div className="mt-6 h-10 w-36 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}
