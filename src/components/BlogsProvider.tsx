'use client';

import { useEffect, useCallback } from 'react';
import { BlogService } from '@/lib/api/services/BlogService';
import type { BlogResponse } from '@/lib/api/services/BlogService';
import { useAppDispatch } from '@/lib/store/hooks';
import { setBlogs } from '@/components/store/blogSlice';
import { useBackoffPolling } from '@/hooks/useBackoffPolling';
import { useProviderErrorRegister } from './ProviderErrorContext';
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
  const { register, unregister } = useProviderErrorRegister();

  const fetchBlogs = useCallback(async () => {
    const res = await BlogService.listBlogs();
    const data = (res as any)?.data ?? res;
    if (data && 'blogs' in data) {
      dispatch(setBlogs(data.blogs.map(mapBlog)));
    } else if (Array.isArray(data)) {
      dispatch(setBlogs((data as BlogResponse[]).map(mapBlog)));
    }
  }, [dispatch]);

  const { error, isRetrying, manualRetry } = useBackoffPolling(fetchBlogs, POLL_INTERVAL);

  useEffect(() => {
    register('blogs', { label: 'Bài viết', error, isRetrying, manualRetry });
    return () => unregister('blogs');
  }, [error, isRetrying, manualRetry, register, unregister]);

  return <>{children}</>;
}
