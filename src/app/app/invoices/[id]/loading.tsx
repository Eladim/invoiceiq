export default function InvoiceDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-slate-200" />
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
        <div className="ml-auto flex gap-2">
          <div className="h-9 w-36 rounded-lg bg-slate-100" />
          <div className="h-9 w-20 rounded-lg bg-slate-100" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[55fr_45fr]">
        <div className="h-[70vh] rounded-xl border border-slate-200 bg-slate-100" />
        <div className="flex flex-col gap-4">
          <div className="h-64 rounded-xl border border-slate-200 bg-white" />
          <div className="h-40 rounded-xl border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
