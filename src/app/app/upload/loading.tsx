export default function UploadLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Title + subtitle */}
      <div className="h-7 w-48 rounded bg-slate-200" />
      <div className="mt-2.5 space-y-2">
        <div className="h-4 w-full max-w-xl rounded bg-slate-100" />
        <div className="h-4 w-2/3 rounded bg-slate-100" />
      </div>

      {/* Drop zone */}
      <div className="mt-7 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-12">
        <div className="size-14 rounded-full bg-slate-100" />
        <div className="h-4 w-64 rounded bg-slate-200" />
        <div className="h-3 w-72 rounded bg-slate-100" />
      </div>
    </div>
  );
}
