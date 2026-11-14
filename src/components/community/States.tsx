'use client';

import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function ListSkeleton({ rows = 4, label = 'Đang tải' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4">
          <Skeleton className="size-10 shrink-0 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 bg-slate-100" />
            <Skeleton className="h-3 w-1/3 bg-slate-100" />
          </div>
        </div>
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-slate-50 text-slate-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 px-6 py-10 text-center">
      <AlertCircle className="size-8 text-red-500" aria-hidden="true" />
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="text-red-700 hover:bg-red-100">
          <RefreshCw className="mr-1.5 size-4" aria-hidden="true" /> Thử lại
        </Button>
      )}
    </div>
  );
}
