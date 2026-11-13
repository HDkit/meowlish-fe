'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Lock, MessageSquare, MessagesSquare, Pin } from 'lucide-react';
import { ForumService, type ForumCategory } from '@/lib/api/services/ForumService';
import { communityErrorMessage } from '@/lib/forum';
import { displayName } from '@/lib/identity-cache';
import { useIdentities } from '@/hooks/useIdentities';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/community/States';
import { RelativeTime } from '@/components/community/RelativeTime';
import { UserAvatar } from '@/components/community/UserAvatar';
import { categoryStyle } from './categoryStyle';

const numberFormat = new Intl.NumberFormat('vi-VN');

export function ForumHome() {
  const [categories, setCategories] = useState<ForumCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setCategories(null);
    ForumService.listCategories()
      .then(res => setCategories(res.data?.categories ?? []))
      .catch(err => setError(communityErrorMessage(err, 'Không tải được danh sách chuyên mục.')));
  }, []);

  useEffect(load, [load]);

  const identities = useIdentities(
    (categories ?? []).map(c => c.latestThread?.lastReplyAuthorId ?? c.latestThread?.authorId),
  );
  const totals = useMemo(
    () =>
      (categories ?? []).reduce(
        (t, c) => ({ threads: t.threads + c.threadCount, replies: t.replies + c.replyCount }),
        { threads: 0, replies: 0 },
      ),
    [categories],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <header className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <MessagesSquare className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Diễn đàn Lingriser</h2>
              <p className="mt-1 max-w-xl text-sm text-slate-600 md:text-base">
                Hỏi đáp, chia sẻ kinh nghiệm luyện thi và kết nối với những người cùng học tiếng Anh.
              </p>
            </div>
          </div>
          {categories && categories.length > 0 && (
            <dl className="flex gap-6 text-sm">
              <div>
                <dt className="text-slate-500">Chủ đề</dt>
                <dd className="text-xl font-bold text-slate-900">{numberFormat.format(totals.threads)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Trả lời</dt>
                <dd className="text-xl font-bold text-slate-900">{numberFormat.format(totals.replies)}</dd>
              </div>
            </dl>
          )}
        </div>
      </header>

      {error ?
        <ErrorState message={error} onRetry={load} />
      : !categories ?
        <ListSkeleton rows={6} label="Đang tải chuyên mục" />
      : categories.length === 0 ?
        <EmptyState icon={<MessagesSquare className="size-6" />} title="Chưa có chuyên mục nào">
          Diễn đàn sẽ sớm mở cửa.
        </EmptyState>
      : <section aria-label="Chuyên mục" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(0,1fr)_7rem_minmax(0,16rem)] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Chuyên mục</span>
            <span className="text-right">Thống kê</span>
            <span>Hoạt động gần nhất</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {categories.map(category => {
              const { icon: Icon, tile } = categoryStyle(category.id);
              const latest = category.latestThread;
              const latestAuthorId = latest?.lastReplyAuthorId ?? latest?.authorId;
              return (
                <li
                  key={category.id}
                  className="grid gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 md:grid-cols-[minmax(0,1fr)_7rem_minmax(0,16rem)] md:items-center md:gap-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tile}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/forum/${encodeURIComponent(category.id)}`}
                        className="text-base font-semibold text-slate-900 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {category.name}
                      </Link>
                      {category.moderatorsOnly && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 align-middle text-[11px] font-medium text-amber-700">
                          <Lock className="size-3" aria-hidden="true" /> Chỉ quản trị viên đăng bài
                        </span>
                      )}
                      <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{category.description}</p>
                      <p className="mt-1 text-xs text-slate-500 md:hidden">
                        {numberFormat.format(category.threadCount)} chủ đề · {numberFormat.format(category.replyCount)} trả lời
                      </p>
                    </div>
                  </div>
                  <div className="hidden text-right text-sm md:block">
                    <div className="font-semibold text-slate-800">{numberFormat.format(category.threadCount)} chủ đề</div>
                    <div className="text-slate-500">{numberFormat.format(category.replyCount)} trả lời</div>
                  </div>
                  <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2 md:bg-transparent md:p-0">
                    {latest ?
                      <div className="flex min-w-0 items-center gap-2.5">
                        <UserAvatar identity={latestAuthorId ? identities[latestAuthorId] : undefined} className="size-8" />
                        <div className="min-w-0 text-sm">
                          <Link
                            href={`/forum/thread/${encodeURIComponent(latest.id)}`}
                            className="flex items-center gap-1 font-medium text-slate-800 hover:text-primary"
                          >
                            {latest.isPinned && <Pin className="size-3 shrink-0 text-amber-500" aria-label="Đã ghim" />}
                            <span className="truncate">{latest.title}</span>
                          </Link>
                          <div className="truncate text-xs text-slate-500">
                            {displayName(latestAuthorId ? identities[latestAuthorId] : undefined)} ·{' '}
                            <RelativeTime iso={latest.lastActivityAt} />
                          </div>
                        </div>
                      </div>
                    : <span className="flex items-center gap-1.5 text-sm text-slate-400">
                        <MessageSquare className="size-4" aria-hidden="true" /> Chưa có chủ đề
                      </span>
                    }
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      }
    </div>
  );
}
