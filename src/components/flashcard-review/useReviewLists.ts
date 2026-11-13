'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { extractApiErrorMessage } from '@/lib/api-response';
import {
	FlashcardListService,
	type FlashCardListDetailResponse,
	type FlashCardListResponse,
	type ListFlashCardListsResponse,
} from '@/lib/api/services/FlashcardListService';
import type { FlashCardResponse } from '@/lib/api/services/FlashcardService';
import type { ReviewCard } from '@/lib/flashcard-review/types';

/** The generated client may hand back the `{ data }` envelope or the payload itself. */
export function unwrap<T extends object>(res: T): T {
	const envelope: unknown = res;
	if (envelope && typeof envelope === 'object' && 'data' in envelope) {
		const data = (envelope as { data: unknown }).data;
		if (data && typeof data === 'object') return data as T;
	}
	return res;
}

export function toReviewCard(fc: FlashCardResponse, listId: string, listName: string): ReviewCard {
	return {
		id: fc.id,
		listId: listId,
		listName: listName,
		authorId: fc.authorId,
		word: fc.word ?? '',
		definition: fc.definition ?? '',
		notes: fc.notes || undefined,
		pronunciation: fc.pronunciation || undefined,
		partOfSpeech: fc.partOfSpeech || undefined,
		examples: (fc.examples ?? []).filter(Boolean),
	};
}

export interface ReviewListInfo {
	id: string;
	name: string;
	authorId: string;
	isPublic: boolean;
	description?: string;
}

function toInfo(l: FlashCardListResponse): ReviewListInfo {
	return {
		id: l.id,
		name: l.name,
		authorId: l.authorId,
		isPublic: l.isPublic,
		description: l.description || undefined,
	};
}

export type ListDetail =
	| { status: 'loading' }
	| { status: 'ready'; cards: ReviewCard[] }
	| { status: 'error'; message: string };

export type Loadable<T> =
	| { status: 'loading'; data?: T }
	| { status: 'ready'; data: T }
	| { status: 'error'; message: string; data?: T };

const MAX_PARALLEL = 4;
const MINE_LIMIT = 100;
const PUBLIC_LIMIT = 24;

/**
 * The lists a player can review: their own (all, up to 100) and public lists of others (first
 * page of a name search), plus a preselected list that is in neither. Each visible list's cards
 * are fetched (a few at a time) for the card counts and the deck.
 */
export function useReviewLists(userId: string | undefined, publicQuery: string, preselectId?: string) {
	const [mine, setMine] = useState<Loadable<ReviewListInfo[]>>({ status: 'loading' });
	const [others, setOthers] = useState<Loadable<ReviewListInfo[]>>({ status: 'loading' });
	const [extra, setExtra] = useState<ReviewListInfo | null>(null);
	const [details, setDetails] = useState<Record<string, ListDetail>>({});
	const [reloadKey, setReloadKey] = useState(0);
	const inflight = useRef(new Set<string>());

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;
		setMine(prev => ({ status: 'loading', data: prev.data }));
		FlashcardListService.listFlashCardLists(userId, undefined, 1, MINE_LIMIT)
			.then(res => {
				if (cancelled) return;
				const data = unwrap<ListFlashCardListsResponse>(res);
				setMine({ status: 'ready', data: (data.lists ?? []).map(toInfo) });
			})
			.catch(err => {
				if (!cancelled) setMine({ status: 'error', message: extractApiErrorMessage(err) });
			});
		return () => {
			cancelled = true;
		};
	}, [userId, reloadKey]);

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;
		setOthers(prev => ({ status: 'loading', data: prev.data }));
		FlashcardListService.listFlashCardLists(undefined, true, 1, PUBLIC_LIMIT, undefined, publicQuery)
			.then(res => {
				if (cancelled) return;
				const data = unwrap<ListFlashCardListsResponse>(res);
				const lists = (data.lists ?? []).filter(l => l.authorId !== userId).map(toInfo);
				setOthers({ status: 'ready', data: lists });
			})
			.catch(err => {
				if (!cancelled) setOthers({ status: 'error', message: extractApiErrorMessage(err) });
			});
		return () => {
			cancelled = true;
		};
	}, [userId, publicQuery, reloadKey]);

	const fetchDetail = useCallback((id: string, onInfo?: (info: ReviewListInfo) => void) => {
		inflight.current.add(id);
		setDetails(prev => ({ ...prev, [id]: { status: 'loading' } }));
		FlashcardListService.getFlashCardList(id)
			.then(res => {
				inflight.current.delete(id);
				const data = unwrap<FlashCardListDetailResponse>(res);
				onInfo?.(toInfo(data));
				const cards = (data.flashCards ?? []).map(fc => toReviewCard(fc, data.id, data.name));
				setDetails(prev => ({ ...prev, [id]: { status: 'ready', cards: cards } }));
			})
			.catch(err => {
				inflight.current.delete(id);
				setDetails(prev => ({ ...prev, [id]: { status: 'error', message: extractApiErrorMessage(err) } }));
			});
	}, []);

	// a preselected list (?list=) that is not among the loaded ones
	useEffect(() => {
		if (!userId || !preselectId || mine.status !== 'ready' || others.status === 'loading') return;
		const known = [...mine.data, ...(others.data ?? [])].some(l => l.id === preselectId);
		if (known || extra?.id === preselectId || details[preselectId]) return;
		fetchDetail(preselectId, setExtra);
	}, [userId, preselectId, mine, others, extra, details, fetchDetail]);

	const visibleIds = [
		...(mine.data ?? []).map(l => l.id),
		...(others.data ?? []).map(l => l.id),
		...(extra ? [extra.id] : []),
	];
	const visibleKey = visibleIds.join(',');

	useEffect(() => {
		const free = MAX_PARALLEL - inflight.current.size;
		if (free <= 0) return;
		visibleKey
			.split(',')
			.filter(id => id && !details[id] && !inflight.current.has(id))
			.slice(0, free)
			.forEach(id => fetchDetail(id));
	}, [visibleKey, details, fetchDetail]);

	const retryDetail = useCallback((id: string) => {
		setDetails(prev => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
	}, []);

	const reload = useCallback(() => {
		setDetails({});
		setReloadKey(k => k + 1);
	}, []);

	return { mine: mine, others: others, extra: extra, details: details, retryDetail: retryDetail, reload: reload };
}
