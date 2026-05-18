'use client';

import { useEffect, useRef, useCallback } from 'react';
import { BlogService } from '@/lib/api/services/BlogService';
import type { BlogResponse } from '@/lib/api/services/BlogService';
import { useAppDispatch } from '@/lib/store/hooks';
import { setBlogs } from '@/components/store/blogSlice';
import type { Blog } from '@/types/client';

const POLL_INTERVAL = 60_000;

function mapBlog(b: BlogResponse): Blog {
  return {
    id: b.id,
    authorId: b.authorId,
    title: b.title,
    content: b.content,
    tags: b.tags ?? [],
    createdAt: new Date(b.createdAt).getTime(),
    updatedAt: b.updatedAt ? new Date(b.updatedAt).getTime() : undefined,
  };
}

export function BlogsProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBlogs = useCallback(async () => {
    try {
      const res = await BlogService.listBlogs();
      if (res && 'blogs' in res) {
        dispatch(setBlogs(res.blogs.map(mapBlog)));
      } else if (Array.isArray(res)) {
        dispatch(setBlogs((res as BlogResponse[]).map(mapBlog)));
      }
    } catch (err) {
      console.error('[BlogsProvider] fetch error:', err);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchBlogs();
    intervalRef.current = setInterval(fetchBlogs, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchBlogs]);

  return <>{children}</>;
}
