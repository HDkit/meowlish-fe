'use client';

import Link from 'next/link';
import { Clock, Newspaper } from 'lucide-react';
import type { BlogResponse } from '@/lib/api/services/BlogService';
import { findCoverImage, formatTag, markdownExcerpt, readingMinutes } from '@/lib/blog-content';
import { type Identity, displayName } from '@/lib/identity-cache';
import { formatDate } from '@/lib/relative-time';
import { UserAvatar } from '@/components/community/UserAvatar';

interface BlogCardProps {
  blog: BlogResponse;
  author?: Identity;
  variant?: 'default' | 'featured' | 'compact';
}

function Cover({ blog, className }: { blog: BlogResponse; className: string }) {
  const cover = findCoverImage(blog.content);
  if (cover) {
    return (
      // Plain <img>: covers come from Markdown and may live on any host.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={cover.src} alt="" loading="lazy" className={`${className} object-cover transition-transform duration-500 group-hover:scale-[1.03]`} />
    );
  }
  return (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br from-emerald-100 via-emerald-50 to-sky-50`} aria-hidden="true">
      <Newspaper className="size-10 text-emerald-300" />
    </div>
  );
}

export function BlogCard({ blog, author, variant = 'default' }: BlogCardProps) {
  const href = `/blog/${encodeURIComponent(blog.id)}`;
  const minutes = readingMinutes(blog.content);
  const tag = blog.tags?.[0];

  if (variant === 'compact') {
    return (
      <Link href={href} className="group flex gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <div className="size-20 shrink-0 overflow-hidden rounded-lg">
          <Cover blog={blog} className="size-full" />
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-primary">{blog.title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(blog.createdAt)} · {minutes} phút đọc
          </p>
        </div>
      </Link>
    );
  }

  const featured = variant === 'featured';
  return (
    <article
      className={`group relative flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary/40 hover:shadow-lg ${featured ? 'flex-col md:flex-row' : 'flex-col'}`}
    >
      <div className={`overflow-hidden ${featured ? 'aspect-[16/9] md:aspect-auto md:w-1/2' : 'aspect-[16/9]'}`}>
        <Cover blog={blog} className="size-full" />
      </div>
      <div className={`flex flex-1 flex-col ${featured ? 'p-6 md:p-8' : 'p-5'}`}>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          {featured && <span className="rounded-full bg-primary px-2.5 py-0.5 font-semibold text-primary-foreground">Mới nhất</span>}
          {tag && <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700">{formatTag(tag)}</span>}
        </div>
        <h3 className={`font-bold leading-snug text-slate-900 group-hover:text-primary ${featured ? 'text-2xl md:text-3xl' : 'line-clamp-2 text-lg'}`}>
          {/* The whole card is clickable through this link's ::after. */}
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {blog.title}
          </Link>
        </h3>
        <p className={`mt-2 flex-1 text-sm leading-relaxed text-slate-600 ${featured ? 'line-clamp-4 md:text-base' : 'line-clamp-3'}`}>
          {markdownExcerpt(blog.content, featured ? 260 : 160)}
        </p>
        <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <UserAvatar identity={author} className="size-8" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-slate-700">{displayName(author)}</div>
            <time dateTime={blog.createdAt}>{formatDate(blog.createdAt)}</time>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1" aria-label={`${minutes} phút đọc`}>
            <Clock className="size-3.5" aria-hidden="true" /> {minutes} phút
          </span>
        </div>
      </div>
    </article>
  );
}
