'use client';

import { useEffect, useState } from 'react';
import { BlogService } from './api/services/BlogService';

/** Shared across pages for the session; cleared on failure so the next mount retries. */
let cached: Promise<string[]> | null = null;

const fetchBlogTags = (): Promise<string[]> => {
	cached ??= BlogService.listBlogTags()
		.then(res => {
			// The gateway wraps payloads in `data`.
			const data = (res as { data?: { tags?: { name: string }[] } }).data ?? res;
			return (data.tags ?? []).map(t => t.name);
		})
		.catch(err => {
			cached = null;
			throw err;
		});
	return cached;
};

/** Forget the cached tags, e.g. after a post with new tags is saved. */
export const invalidateBlogTags = () => {
	cached = null;
};

/**
 * Every tag used by blog posts (most used first), from the server, not just the tags of the posts
 * on the current page. `null` while loading; `fallback` if the request fails.
 */
export function useBlogTags(fallback: string[] = []): string[] | null {
	const [tags, setTags] = useState<string[] | null>(null);
	useEffect(() => {
		let alive = true;
		fetchBlogTags()
			.then(t => alive && setTags(t))
			.catch(() => alive && setTags(fallback));
		return () => {
			alive = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return tags;
}
