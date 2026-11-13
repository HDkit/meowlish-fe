'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Check, Search } from 'lucide-react';
import { BlogService, type BlogResponse } from '@/lib/api/services/BlogService';
import { formatTag } from '@/lib/blog-content';
import { communityErrorMessage, parsePageParam, totalPages } from '@/lib/forum';
import { useIdentities } from '@/hooks/useIdentities';
import { NavPagination } from './ui/nav-pagination';
import { Skeleton } from './ui/skeleton';
import { EmptyState, ErrorState } from './community/States';
import { BlogCard } from './blog/BlogCard';

const PAGE_SIZE = 9;

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parsePageParam(searchParams.get('page'));
  const selectedTags = useMemo(() => searchParams.getAll('tag').filter(Boolean), [searchParams]);
  const tagKey = selectedTags.join(',');

  const [blogs, setBlogs] = useState<BlogResponse[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [knownTags, setKnownTags] = useState<string[]>(BASE_TAGS);

  const setQuery = useCallback(
    (next: { page?: number; tags?: string[] }) => {
      const params = new URLSearchParams();
      const tags = next.tags ?? selectedTags;
      tags.forEach(t => params.append('tag', t));
      const p = next.page ?? page;
      if (p > 1) params.set('page', String(p));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: next.page !== undefined });
    },
    [page, pathname, router, selectedTags],
  );

  /** A filter/page change keeps the current posts on screen (dimmed) instead of flashing skeletons. */
  const [reloading, setReloading] = useState(false);
  const load = useCallback(() => {
    setError(null);
    setReloading(true);
    BlogService.listBlogs(undefined, page, PAGE_SIZE, tagKey ? tagKey.split(',') : undefined)
      .then(res => {
        // The gateway wraps payloads in `data`.
        const data = (res as unknown as { data?: { blogs?: BlogResponse[]; totalCount?: number } }).data;
        const list = data?.blogs ?? [];
        setBlogs(list);
        setTotalCount(data?.totalCount ?? list.length);
        setKnownTags(prev => [...new Set([...prev, ...list.flatMap(b => b.tags ?? [])])]);
      })
      .catch(err => setError(communityErrorMessage(err, 'Không tải được danh sách bài viết.')))
      .finally(() => setReloading(false));
  }, [page, tagKey]);

  useEffect(load, [load]);

  const identities = useIdentities((blogs ?? []).map(b => b.authorId));

  const toggleTag = (tag: string) =>
    setQuery({
      tags: selectedTags.includes(tag) ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag],
      page: 1,
    });

  // On the unfiltered first page, the newest post gets the wide card.
  const showFeatured = page === 1 && selectedTags.length === 0 && (blogs?.length ?? 0) > 0;
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

        <div className="mt-6" role="group" aria-label="Lọc theo chủ đề">
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
          {selectedTags.length > 0 ? 'Thử bỏ bớt bộ lọc chủ đề.' : 'Chưa có bài viết nào.'}
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
