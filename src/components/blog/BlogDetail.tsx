'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Flag, Newspaper } from 'lucide-react';
import { BlogService, type BlogResponse } from '@/lib/api/services/BlogService';
import { formatTag, pickRelatedPosts, readingMinutes, splitCover } from '@/lib/blog-content';
import { communityErrorMessage } from '@/lib/forum';
import { displayName } from '@/lib/identity-cache';
import { formatDate } from '@/lib/relative-time';
import { useAuth } from '@/lib/hooks/useAuth';
import { useIdentities } from '@/hooks/useIdentities';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { ReportDialog } from '@/components/ReportDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/community/States';
import { UserAvatar } from '@/components/community/UserAvatar';
import { BlogCard } from './BlogCard';
import { BlogComments } from './BlogComments';

type ListData = { blogs?: BlogResponse[] };
const unwrap = <T,>(res: unknown): T | null => ((res as { data?: T | null })?.data ?? null);

/** Readable long-form typography on top of the shared MarkdownPreview styles. */
const ARTICLE_PROSE = [
  'prose-lg prose-slate',
  'prose-headings:scroll-mt-24 prose-headings:text-slate-900 prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-xl',
  'prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900',
  'prose-blockquote:border-l-primary prose-blockquote:bg-emerald-50/50 prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-slate-700',
  'prose-img:mx-auto prose-img:rounded-2xl prose-img:shadow-sm',
  'prose-table:block prose-table:overflow-x-auto prose-table:text-base prose-th:bg-slate-50 prose-th:px-3 prose-td:px-3',
  'prose-code:before:content-none prose-code:after:content-none',
].join(' ');

export function BlogDetail({ blogId }: { blogId: string }) {
  const { currUser } = useAuth();
  const [blog, setBlog] = useState<BlogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState<BlogResponse[]>([]);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(() => {
    setError(null);
    BlogService.getBlog(blogId)
      .then(res => setBlog(unwrap<BlogResponse>(res)))
      .catch(err => {
        if ((err as { status?: number })?.status === 404) setNotFound(true);
        else setError(communityErrorMessage(err, 'Không tải được bài viết.'));
      });
  }, [blogId]);

  useEffect(load, [load]);

  // Related: posts sharing a tag first, topped up with the newest ones.
  useEffect(() => {
    if (!blog) return;
    let cancelled = false;
    const toCandidate = (b: BlogResponse) => ({ ...b, tags: b.tags ?? [], createdAt: new Date(b.createdAt).getTime() });
    Promise.all([
      blog.tags?.length ? BlogService.listBlogs(undefined, 1, 7, blog.tags).catch(() => null) : Promise.resolve(null),
      BlogService.listBlogs(undefined, 1, 4).catch(() => null),
    ]).then(([byTag, latest]) => {
      if (cancelled) return;
      const sameTag = unwrap<ListData>(byTag)?.blogs ?? [];
      const newest = unwrap<ListData>(latest)?.blogs ?? [];
      const picked = pickRelatedPosts(
        { id: blog.id, tags: blog.tags ?? [] },
        [...sameTag, ...newest].map(toCandidate),
        3,
      );
      setRelated(picked.map(p => ({ ...p, createdAt: new Date(p.createdAt).toISOString() })));
    });
    return () => {
      cancelled = true;
    };
  }, [blog]);

  const identities = useIdentities([blog?.authorId, ...related.map(r => r.authorId)]);
  const { cover, body } = useMemo(() => splitCover(blog?.content ?? ''), [blog?.content]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState icon={<Newspaper className="size-6" />} title="Không tìm thấy bài viết">
          <Link href="/blog" className="text-primary hover:underline">
            Quay lại danh sách bài viết
          </Link>
        </EmptyState>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" role="status" aria-label="Đang tải bài viết">
        <Skeleton className="h-6 w-32 bg-slate-100" />
        <Skeleton className="h-10 w-3/4 bg-slate-100" />
        <Skeleton className="aspect-[2/1] w-full rounded-3xl bg-slate-100" />
        <Skeleton className="h-4 w-full bg-slate-100" />
        <Skeleton className="h-4 w-5/6 bg-slate-100" />
      </div>
    );
  }

  const author = identities[blog.authorId];
  const edited = blog.updatedAt && new Date(blog.updatedAt).getTime() - new Date(blog.createdAt).getTime() > 60_000;

  return (
    <div className="pb-20">
      <article className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/blog" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <ArrowLeft className="size-4" aria-hidden="true" /> Tất cả bài viết
          </Link>
          {currUser && currUser.id !== blog.authorId && (
            <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)} className="gap-1.5 text-slate-500 hover:text-red-600">
              <Flag className="size-4" aria-hidden="true" /> Báo cáo
            </Button>
          )}
        </div>

        <header>
          {(blog.tags?.length ?? 0) > 0 && (
            <ul className="mb-4 flex flex-wrap gap-2" aria-label="Chủ đề">
              {blog.tags.map(tag => (
                <li key={tag}>
                  <Link
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    {formatTag(tag)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-[2.75rem] md:leading-[1.15]">
            {blog.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-2.5">
              <UserAvatar identity={author} className="size-10" />
              <span className="font-semibold text-slate-800">{displayName(author)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4" aria-hidden="true" />
              <time dateTime={blog.createdAt}>{formatDate(blog.createdAt)}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" /> {readingMinutes(blog.content)} phút đọc
            </span>
            {edited && blog.updatedAt && <span className="text-xs italic">Cập nhật {formatDate(blog.updatedAt)}</span>}
          </div>
        </header>

        {cover && (
          <figure className="mt-8 overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover.src} alt={cover.alt} className="aspect-[2/1] w-full object-cover" />
            {cover.alt && <figcaption className="sr-only">{cover.alt}</figcaption>}
          </figure>
        )}

        <div className="mt-10">
          <MarkdownPreview content={body} className={ARTICLE_PROSE} />
        </div>

        <hr className="my-12 border-slate-200" />

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <BlogComments blogId={blog.id} />
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mx-auto mt-16 max-w-6xl">
          <h2 id="related-heading" className="mb-5 text-xl font-bold text-slate-900">
            Bài viết liên quan
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map(post => (
              <BlogCard key={post.id} blog={post} author={identities[post.authorId]} />
            ))}
          </div>
        </section>
      )}

      {currUser && (
        <ReportDialog open={reportOpen} onOpenChange={setReportOpen} targetType="blog" targetId={blog.id} userId={currUser.id} />
      )}
    </div>
  );
}
