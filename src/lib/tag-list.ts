'use client';

import { useEffect, useState } from 'react';
import { TagsService } from './api-client';

/** An exam tag (`GET /exams/tags/list`). Tags form a tree through `parentId`. */
export type TagNode = { id: string; name: string; parentId?: string };

const TTL_MS = 10 * 60 * 1000;
const STORAGE_KEY = 'meowlish:tag-list:v1';

/**
 * The tag list is small (~70 tags) and rarely changes, so it is fetched once and shared: memory for
 * this page load, sessionStorage across reloads, both for 10 minutes.
 */
let cache: { at: number; tags: TagNode[] } | null = null;
let inflight: Promise<TagNode[]> | null = null;

const readStorage = (): { at: number; tags: TagNode[] } | null => {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { at?: unknown; tags?: unknown };
		return typeof parsed.at === 'number' && Array.isArray(parsed.tags) ?
				{ at: parsed.at, tags: parsed.tags as TagNode[] }
			:	null;
	} catch {
		return null;
	}
};

const fresh = (entry: { at: number } | null) => !!entry && Date.now() - entry.at < TTL_MS;

export const loadTagList = async (): Promise<TagNode[]> => {
	if (fresh(cache)) return cache!.tags;
	const stored = readStorage();
	if (fresh(stored)) {
		cache = stored;
		return stored!.tags;
	}
	inflight ??= TagsService.tagGatewayControllerGetTagListV1()
		.then((res) => {
			const tags = ((res as { data?: { list?: TagNode[] } }).data?.list ?? []).filter(
				(t): t is TagNode => typeof t?.id === 'string' && typeof t?.name === 'string',
			);
			cache = { at: Date.now(), tags: tags };
			try {
				sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
			} catch {
				// storage full or blocked: the memory cache still works
			}
			return tags;
		})
		.finally(() => {
			inflight = null;
		});
	return inflight;
};

/** Cached exam tags; `loading` only on the first load of the session. */
export const useTagList = () => {
	const [tags, setTags] = useState<TagNode[]>(() => (fresh(cache) ? cache!.tags : []));
	const [loading, setLoading] = useState(!fresh(cache));
	useEffect(() => {
		let cancelled = false;
		loadTagList()
			.then((list) => !cancelled && setTags(list))
			.catch((err) => console.error('Failed to load tags:', err))
			.finally(() => !cancelled && setLoading(false));
		return () => {
			cancelled = true;
		};
	}, []);
	return { tags, loading };
};

/** Names of a tag's ancestors, root first (cycle-safe). */
export const tagPath = (tag: TagNode, byId: Map<string, TagNode>): TagNode[] => {
	const path: TagNode[] = [];
	const seen = new Set<string>([tag.id]);
	let parent = tag.parentId ? byId.get(tag.parentId) : undefined;
	while (parent && !seen.has(parent.id)) {
		path.unshift(parent);
		seen.add(parent.id);
		parent = parent.parentId ? byId.get(parent.parentId) : undefined;
	}
	return path;
};

/**
 * Tags grouped under their root ancestor, for pickers. `exclude` drops tags (and everything under
 * them) by name, case-insensitive, e.g. the other exam type's tag tree.
 */
export const groupTags = (
	tags: TagNode[],
	exclude: string[] = [],
): { group: string; tags: { tag: TagNode; path: string }[] }[] => {
	const byId = new Map(tags.map((t) => [t.id, t]));
	const excluded = new Set(exclude.map((e) => e.toLowerCase()));
	const groups = new Map<string, { tag: TagNode; path: string }[]>();
	for (const tag of tags) {
		const ancestors = tagPath(tag, byId);
		if ([tag, ...ancestors].some((t) => excluded.has(t.name.toLowerCase()))) continue;
		// roots are only headings; leaf and middle tags are pickable
		if (ancestors.length === 0 && tags.some((t) => t.parentId === tag.id)) continue;
		const group = ancestors[0]?.name ?? 'Khác';
		const path = ancestors
			.slice(1)
			.map((a) => a.name)
			.join(' › ');
		groups.set(group, [...(groups.get(group) ?? []), { tag: tag, path: path }]);
	}
	return [...groups.entries()]
		.map(([group, list]) => ({ group: group, tags: list.sort((a, b) => a.tag.name.localeCompare(b.tag.name)) }))
		.sort((a, b) => a.group.localeCompare(b.group));
};
