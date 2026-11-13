'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Eye, Lock, MessageSquare, Pin, Plus, Search } from 'lucide-react';
import {
  ForumService,
  type ForumCategory,
  type ListForumThreadsResponse,
} from '@/lib/api/services/ForumService';
import { THREADS_PER_PAGE, canModerate, communityErrorMessage, parsePageParam, totalPages } from '@/lib/forum';
import { displayName } from '@/lib/identity-cache';
import { useAuth } from '@/lib/hooks/useAuth';
import { useIdentities } from '@/hooks/useIdentities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavPagination } from '@/components/ui/nav-pagination';
import { useToast } from '@/components/ui/use-toast';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/community/States';
import { Skeleton } from '@/components/ui/skeleton';
import { RelativeTime } from '@/components/community/RelativeTime';
import { UserAvatar } from '@/components/community/UserAvatar';
import { ForumBreadcrumb } from './ForumBreadcrumb';
import { ThreadEditorDialog } from './ThreadEditorDialog';
import { categoryStyle } from './categoryStyle';

export function ForumCategoryView({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currUser } = useAuth();
  const moderator = canModerate(currUser?.roleId);

  const page = parsePageParam(searchParams.get('page'));
  const search = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(search);

  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [list, setList] = useState<ListForumThreadsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [creating, setCreating] = useState(false);

  const setQuery = useCallback(
    (next: { page?: number; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.page !== undefined) {
        if (next.page > 1) params.set('page', String(next.page));
        else params.delete('page');
      }
      if (next.q !== undefined) {
        if (next.q.trim()) params.set('q', next.q.trim());
        else params.delete('q');
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    ForumService.getCategory(categoryId)
      .then(res => setCategory(res.data))
      .catch(err => {
        if ((err as { status?: number })?.status === 404) setNotFound(true);
      });
  }, [categoryId]);

  /** Search/page changes keep the current threads on screen (dimmed) instead of flashing skeletons. */
  const [reloading, setReloading] = useState(false);
  const loadThreads = useCallback(() => {
    setError(null);
    setReloading(true);
    ForumService.listThreads(categoryId, { page: page, limit: THREADS_PER_PAGE, search: search })
      .then(res => setList(res.data ?? { threads: [], totalCount: 0 }))
      .catch(err => {
        if ((err as { status?: number })?.status === 404) setNotFound(true);
        else setError(communityErrorMessage(err, 'Không tải được danh sách chủ đề.'));
      })
      .finally(() => setReloading(false));
  }, [categoryId, page, search]);

  useEffect(loadThreads, [loadThreads]);

  // Debounced title search, kept in the URL so it survives reloads and back navigation.
  useEffect(() => {
    if (searchInput.trim() === search.trim()) return;
    const t = setTimeout(() => setQuery({ q: searchInput, page: 1 }), 400);
    return () => clearTimeout(t);
  }, [searchInput, search, setQuery]);

  const identities = useIdentities(
    (list?.threads ?? []).flatMap(t => [t.authorId, t.lastReplyAuthorId]),
  );

  const createThread = async (value: { title: string; body: string }) => {
    try {
      const res = await ForumService.createThread(categoryId, value);
      setCreating(false);
      toast({ title: 'Đã đăng chủ đề' });
      if (res.data) router.push(`/forum/thread/${encodeURIComponent(res.data.id)}`);
    } catch (err) {
      toast({ title: 'Không đăng được chủ đề', description: communityErrorMessage(err), variant: 'destructive' });
    }
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <ForumBreadcrumb items={[{ label: 'Diễn đàn', href: '/forum' }, { label: 'Không tìm thấy' }]} />
        <EmptyState icon={<MessageSquare className="size-6" />} title="Chuyên mục không tồn tại">
          <Link href="/forum" className="text-primary hover:underline">
            Quay lại diễn đàn
          </Link>
        </EmptyState>
      </div>
    );
  }

  const { icon: Icon, tile } = categoryStyle(categoryId);
  const mayPost = !!currUser && (!category?.moderatorsOnly || moderator);
  const pages = totalPages(list?.totalCount ?? 0, THREADS_PER_PAGE);

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-16">
      <ForumBreadcrumb items={[{ label: 'Diễn đàn', href: '/forum' }, { label: category?.name ?? '…' }]} />

      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ring-1 ${tile}`}>
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            {category ?
              <>
                <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{category.name}</h2>
                <p className="mt-0.5 text-sm text-slate-500">{category.description}</p>
              </>
            : <div role="status" aria-busy="true" className="space-y-2 pt-1">
                <span className="sr-only">Đang tải chuyên mục…</span>
                <Skeleton className="h-7 w-48 bg-slate-100" />
                <Skeleton className="h-4 w-72 max-w-full bg-slate-100" />
              </div>}
          </div>
        </div>
        {!category && <Skeleton className="h-9 w-32 shrink-0 rounded-xl bg-slate-100" />}
        {category && (
          <div className="flex shrink-0 flex-col items-stretch gap-1 md:items-end">
            <Button onClick={() => setCreating(true)} disabled={!mayPost} className="rounded-xl">
              <Plus className="mr-1.5 size-4" aria-hidden="true" /> Tạo chủ đề
            </Button>
            {category.moderatorsOnly && !moderator && (
              <span className="text-xs text-slate-500">Chỉ quản trị viên được đăng tại đây.</span>
            )}
          </div>
        )}
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <Input
          type="search"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Tìm theo tiêu đề chủ đề…"
          aria-label="Tìm chủ đề theo tiêu đề"
          className="rounded-xl bg-white pl-9"
        />
      </div>

      {error ?
        <ErrorState message={error} onRetry={loadThreads} />
      : !list ?
        <ListSkeleton rows={6} label="Đang tải chủ đề" />
      : list.threads.length === 0 ?
        <EmptyState icon={<MessageSquare className="size-6" />} title={search ? 'Không có chủ đề phù hợp' : 'Chưa có chủ đề nào'}>
          {search ? 'Thử từ khóa khác.' : mayPost ? 'Hãy là người mở chủ đề đầu tiên!' : null}
        </EmptyState>
      : <section
          aria-label="Danh sách chủ đề"
          aria-busy={reloading}
          className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity duration-200 ${reloading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <ul className="divide-y divide-slate-100">
            {list.threads.map(thread => {
              const author = identities[thread.authorId];
              const lastAuthorId = thread.lastReplyAuthorId ?? thread.authorId;
              return (
                <li key={thread.id} className={`px-5 py-4 transition-colors hover:bg-slate-50/70 ${thread.isPinned ? 'bg-amber-50/40' : ''}`}>
                  <div className="flex gap-3">
                    <UserAvatar identity={author} className="mt-0.5 hidden sm:flex" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-1.5">
                        {thread.isPinned && <Pin className="mt-1 size-4 shrink-0 text-amber-500" aria-label="Đã ghim" />}
                        {thread.isLocked && <Lock className="mt-1 size-4 shrink-0 text-slate-400" aria-label="Đã khóa" />}
                        <Link
                          href={`/forum/thread/${encodeURIComponent(thread.id)}`}
                          className="text-[15px] font-semibold leading-snug text-slate-900 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          {thread.title}
                        </Link>
                      </div>
                      {thread.excerpt && <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{thread.excerpt}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>
                          <span className="font-medium text-slate-700">{displayName(author)}</span> · <RelativeTime iso={thread.createdAt} />
                        </span>
                        <span className="inline-flex items-center gap-1" aria-label={`${thread.replyCount} trả lời`}>
                          <MessageSquare className="size-3.5" aria-hidden="true" /> {thread.replyCount}
                        </span>
                        <span className="inline-flex items-center gap-1" aria-label={`${thread.viewCount} lượt xem`}>
                          <Eye className="size-3.5" aria-hidden="true" /> {thread.viewCount}
                        </span>
                        {thread.replyCount > 0 && (
                          <span className="md:hidden">
                            Mới nhất: {displayName(identities[lastAuthorId])}, <RelativeTime iso={thread.lastActivityAt} />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden w-44 shrink-0 text-right text-xs text-slate-500 md:block">
                      {thread.replyCount > 0 ?
                        <>
                          <div className="truncate font-medium text-slate-700">{displayName(identities[lastAuthorId])}</div>
                          <RelativeTime iso={thread.lastActivityAt} />
                        </>
                      : <span className="text-slate-400">Chưa có trả lời</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      }

      <NavPagination page={page} totalPages={pages} onPageChange={p => setQuery({ page: p })} />

      <ThreadEditorDialog
        open={creating}
        onOpenChange={setCreating}
        mode="create"
        categoryName={category?.name}
        onSubmit={createThread}
      />
    </div>
  );
}
