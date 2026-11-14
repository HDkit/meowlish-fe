'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

export function ForumBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Đường dẫn" className="text-sm">
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-slate-500">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />}
            {item.href ?
              <Link href={item.href} className="truncate hover:text-primary">
                {item.label}
              </Link>
            : <span aria-current="page" className="max-w-[16rem] truncate font-medium text-slate-700 sm:max-w-md">
                {item.label}
              </span>
            }
          </li>
        ))}
      </ol>
    </nav>
  );
}
