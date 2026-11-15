'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { BookOpen, CalendarDays, Check, Search, X } from 'lucide-react';
import { BlogService, type BlogResponse } from '@/lib/api/services/BlogService';
import { useBlogTags } from '@/lib/blog-tags';
import { formatTag } from '@/lib/blog-content';
import { communityErrorMessage, parsePageParam, totalPages } from '@/lib/forum';
import { useIdentities } from '@/hooks/useIdentities';
import { NavPagination } from './ui/nav-pagination';
import { Skeleton } from './ui/skeleton';
import { EmptyState, ErrorState } from './community/States';
import { BlogCard } from './blog/BlogCard';
import { AuthorFilter } from './admin/AuthorFilter';
import { useIdentityNames } from './admin/useIdentityNames';
import { Input } from './ui/input';
import { useAppSelector } from '@/lib/store/hooks';

const PAGE_SIZE = 9;

/** Search-as-you-type delay for the title box. */
const SEARCH_DEBOUNCE_MS = 350;

/** `YYYY-MM-DD` (a date input's value) → the start or end of that day in local time, as ISO. */
const dayBoundary = (day: string, end: boolean): string | undefined => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  const d = new Date(`${day}T${end ? '23:59:59.999' : '00:00:00'}`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/** Shown before any post has loaded, and kept so filters do not jump around between pages. */
const BASE_TAGS = ['ielts', 'toeic', 'tu-vung', 'ngu-phap', 'phat-am', 'nghe', 'viet-lach', 'phuong-phap'];

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Skeleton className="aspect-[16/9] w-full rounded-none bg-slate-100" />
      <div className="space-y-2 p-5">
        <Skeleton className="h-4 w-1/4 bg-slate-100" />
        <Skeleton className="h-5 w-3/4 bg-slate-100" />
        <Skeleton className="h-3 w-full bg-slate-100" />
        <Skeleton className="h-3 w-2/3 bg-slate-100" />
      </div>
    </div>
  );
}

export function BlogPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parsePageParam(searchParams.get('page'));
  const selectedTags = useMemo(() => searchParams.getAll('tag').filter(Boolean), [searchParams]);
  const tagKey = selectedTags.join(',');
  // the other filters live in the address too (?q=…&author=…&from=YYYY-MM-DD&to=YYYY-MM-DD)
  const titleQuery = searchParams.get('q') ?? '';
  const authorId = searchParams.get('author') || undefined;
  const fromDay = searchParams.get('from') ?? '';
  const toDay = searchParams.get('to') ?? '';
  const currentUser = useAppSelector(state => state.currUser.current);
  const authorNames = useIdentityNames([authorId]);

  const [blogs, setBlogs] = useState<BlogResponse[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const serverTags = useBlogTags(BASE_TAGS);
  // tags picked from the address stay visible even if no post uses them any more
  const knownTags = useMemo(() => [...new Set([...(serverTags ?? []), ...selectedTags])], [serverTags, selectedTags]);

  /** Changes some query params; reads the address as it is now (not a stale render's copy). */
  const setQuery = useCallback(
    (next: { page?: number; tags?: string[]; q?: string; author?: string | null; from?: string; to?: string }) => {
      const params = new URLSearchParams(window.location.search);
      if (next.tags) {
        params.delete('tag');
        next.tags.forEach(t => params.append('tag', t));
      }
      const set = (key: string, value: string | null | undefined) => {
        if (value === undefined) return;
        if (value) params.set(key, value);
        else params.delete(key);
      };
      set('q', next.q);
      set('author', next.author);
      set('from', next.from);
      set('to', next.to);
      // a filter change goes back to page 1; a page change keeps the filters
      const p = next.page ?? (Object.keys(next).length > 0 ? 1 : page);
      if (p > 1) params.set('page', String(p));
      else params.delete('page');
      const qs = params.toString();
      // History API: Next syncs it into useSearchParams at once (no server round trip), so a
      // debounced title search can't drop a filter picked while it waited
      window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);
      if (next.page !== undefined) window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [page, pathname],
  );

  // the title box: typed text, sent to the address (and the server) 350 ms after the last key
  const [titleInput, setTitleInput] = useState(titleQuery);
  // follow the address (back/forward, "Xóa bộ lọc") without eating a space being typed
  useEffect(() => setTitleInput(cur => (cur.trim() === titleQuery.trim() ? cur : titleQuery)), [titleQuery]);
  useEffect(() => {
    const q = titleInput.trim();
    if (q === titleQuery.trim()) return;
    const t = setTimeout(() => setQuery({ q: q }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [titleInput, titleQuery, setQuery]);

  /** A filter/page change keeps the current posts on screen (dimmed) instead of flashing skeletons. */
  const [reloading, setReloading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey(k => k + 1), []);
  const rangeError = fromDay && toDay && fromDay > toDay ? 'Ngày bắt đầu phải trước ngày kết thúc.' : null;
  useEffect(() => {
    if (rangeError) return;
    // a newer filter supersedes this request: its late answer must not replace newer results
    let stale = false;
    setError(null);
    setReloading(true);
    BlogService.listBlogs(authorId, page, PAGE_SIZE, tagKey ? tagKey.split(',') : undefined, {
      title: titleQuery.trim() || undefined,
      createdFrom: dayBoundary(fromDay, false),
      createdTo: dayBoundary(toDay, true),
    })
      .then(res => {
        if (stale) return;
        // The gateway wraps payloads in `data`.
        const data = (res as unknown as { data?: { blogs?: BlogResponse[]; totalCount?: number } }).data;
        const list = data?.blogs ?? [];
        setBlogs(list);
        setTotalCount(data?.totalCount ?? list.length);
      })
      .catch(err => !stale && setError(communityErrorMessage(err, 'Không tải được danh sách bài viết.')))
      .finally(() => !stale && setReloading(false));
    return () => {
      stale = true;
    };
  }, [page, tagKey, authorId, titleQuery, fromDay, toDay, rangeError, reloadKey]);

  const identities = useIdentities((blogs ?? []).map(b => b.authorId));

  const toggleTag = (tag: string) =>
    setQuery({
      tags: selectedTags.includes(tag) ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag],
      page: 1,
    });

  const hasFilters = selectedTags.length > 0 || Boolean(titleQuery || authorId || fromDay || toDay);
  // On the unfiltered first page, the newest post gets the wide card.
  const showFeatured = page === 1 && !hasFilters && (blogs?.length ?? 0) > 0;
  const [featured, ...rest] = blogs ?? [];
  const gridPosts = showFeatured ? rest : (blogs ?? []);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <header className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)] md:p-10">
        <div className="flex items-start gap-4">
          <div className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm sm:flex">
            <BookOpen className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Thư viện kiến thức</h2>
            <p className="mt-2 max-w-2xl text-slate-600 md:text-lg">
              Chiến lược luyện thi IELTS, TOEIC, mẹo ngữ pháp, từ vựng và kinh nghiệm thực tế từ cộng đồng Lingriser.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]" role="search" aria-label="Tìm bài viết">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              placeholder="Tìm theo tiêu đề…"
              aria-label="Tìm theo tiêu đề"
              className="h-10 rounded-xl border-slate-200 bg-white pl-10"
            />
          </div>
          {currentUser && (
            <AuthorFilter
              value={authorId ? { id: authorId, name: authorNames[authorId]?.name ?? 'Tác giả' } : null}
              onChange={v => setQuery({ author: v?.id ?? null })}
              currentUser={{ id: currentUser.id, name: currentUser.fullName || 'Bạn' }}
            />
          )}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Thời gian đăng">
            <CalendarDays className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
            <Input
              type="date"
              value={fromDay}
              max={toDay || undefined}
              onChange={e => setQuery({ from: e.target.value })}
              aria-label="Đăng từ ngày"
              className="h-10 w-[9.5rem] rounded-xl border-slate-200 bg-white"
            />
            <span className="text-sm text-slate-400">–</span>
            <Input
              type="date"
              value={toDay}
              min={fromDay || undefined}
              onChange={e => setQuery({ to: e.target.value })}
              aria-label="Đăng đến ngày"
              className="h-10 w-[9.5rem] rounded-xl border-slate-200 bg-white"
            />
          </div>
        </div>
        {(rangeError || hasFilters) && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            {rangeError && <p className="text-destructive" role="alert">{rangeError}</p>}
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setTitleInput('');
                  setQuery({ tags: [], q: '', author: null, from: '', to: '' });
                }}
                className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-primary"
              >
                <X className="size-3.5" aria-hidden="true" /> Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        <div className="mt-4" role="group" aria-label="Lọc theo chủ đề">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setQuery({ tags: [], page: 1 })}
              aria-pressed={selectedTags.length === 0}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                selectedTags.length === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary'
              }`}
            >
              Tất cả
            </button>
            {knownTags.map(tag => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    active ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {active && <Check className="size-3.5" aria-hidden="true" />}
                  {formatTag(tag)}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {error ?
        <ErrorState message={error} onRetry={load} />
      : !blogs ?
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true" aria-live="polite" aria-label="Đang tải bài viết">
          {Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
          <span className="sr-only">Đang tải bài viết…</span>
        </div>
      : blogs.length === 0 ?
        <EmptyState icon={<Search className="size-6" />} title="Không có bài viết phù hợp">
          {hasFilters ? 'Thử từ khóa, chủ đề, tác giả hoặc khoảng thời gian khác.' : 'Chưa có bài viết nào.'}
        </EmptyState>
      : <div className={`space-y-8 transition-opacity duration-200 ${reloading ? 'pointer-events-none opacity-60' : ''}`} aria-busy={reloading}>
          {showFeatured && featured && <BlogCard blog={featured} author={identities[featured.authorId]} variant="featured" />}
          {gridPosts.length > 0 && (
            <section aria-label="Bài viết">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map(blog => (
                  <BlogCard key={blog.id} blog={blog} author={identities[blog.authorId]} />
                ))}
              </div>
            </section>
          )}
        </div>
      }

      <NavPagination page={page} totalPages={totalPages(totalCount, PAGE_SIZE)} onPageChange={p => setQuery({ page: p })} />
    </div>
  );
}
