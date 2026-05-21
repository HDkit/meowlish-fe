export default function TestLoading() {
  return (
    <div className="flex flex-row gap-4 bg-slate-50 p-4 font-sans h-dvh overflow-hidden animate-pulse">
      <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <div className="h-7 w-20 rounded-md bg-slate-200" />
          <div className="h-7 w-24 rounded-md bg-slate-200" />
          <div className="h-7 w-20 rounded-md bg-slate-200" />
        </div>
        <div className="space-y-3 p-6">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-5/6 rounded bg-slate-200" />
          <div className="h-4 w-2/3 rounded bg-slate-200" />
        </div>
        <div className="mx-6 mb-4 space-y-3 rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-slate-200" />
            <div className="h-4 flex-1 rounded bg-slate-200" />
          </div>
          <div className="ml-10 space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-4">
              <div className="h-5 w-5 rounded-full bg-slate-200" />
              <div className="h-4 w-2/3 rounded bg-slate-200" />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-4">
              <div className="h-5 w-5 rounded-full bg-slate-200" />
              <div className="h-4 w-1/2 rounded bg-slate-200" />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-4">
              <div className="h-5 w-5 rounded-full bg-slate-200" />
              <div className="h-4 w-3/5 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-72 flex-col gap-4">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-2 p-6 border-b border-slate-100">
            <div className="h-3 w-28 rounded bg-slate-200" />
            <div className="h-10 w-20 rounded bg-slate-200" />
          </div>
          <div className="p-5">
            <div className="h-14 w-full rounded-xl bg-slate-200" />
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <div className="h-6 w-16 rounded-full bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="grid grid-cols-5 gap-2.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-10 w-10 rounded-lg bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
