'use client';

import { formatDateTime, formatRelativeTime } from '@/lib/relative-time';

/** <time> showing "5 phút trước", with the full timestamp as tooltip. */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className={className} suppressHydrationWarning>
      {formatRelativeTime(iso)}
    </time>
  );
}
