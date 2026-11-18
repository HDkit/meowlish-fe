'use client';

import { useEffect, useState } from 'react';
import { DictionaryNotFoundError, lookUpWord, normalizeQuery, type DictionaryEntry, type DictionaryKind } from '@/lib/dictionary';

export type LookupState =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'done'; entry: DictionaryEntry }
	| { status: 'not-found'; message: string }
	| { status: 'error'; message: string };

/** Looks `word` up whenever it, the dictionary or `retry` changes; a newer lookup cancels the older one. */
export function useDictionaryLookup(kind: DictionaryKind, word: string, retry = 0): LookupState {
	const query = normalizeQuery(word);
	const [state, setState] = useState<LookupState>({ status: 'idle' });

	useEffect(() => {
		if (!query) {
			setState({ status: 'idle' });
			return;
		}
		const ctrl = new AbortController();
		setState({ status: 'loading' });
		lookUpWord(kind, query, ctrl.signal).then(
			(entry) => setState({ status: 'done', entry }),
			(err: unknown) => {
				if (ctrl.signal.aborted) return;
				const message = err instanceof Error ? err.message : 'Không tra được từ điển, vui lòng thử lại.';
				setState(err instanceof DictionaryNotFoundError ? { status: 'not-found', message } : { status: 'error', message });
			},
		);
		return () => ctrl.abort();
	}, [kind, query, retry]);

	return state;
}

const KIND_KEY = 'lingriser.dictionary.kind';

/** The dictionary the user picked last (per browser; a convenience, so failures are ignored). */
export function readSavedKind(fallback: DictionaryKind): DictionaryKind {
	try {
		const v = window.localStorage.getItem(KIND_KEY);
		return v === 'en-en' || v === 'en-vi' ? v : fallback;
	} catch {
		return fallback;
	}
}

export function saveKind(kind: DictionaryKind) {
	try {
		window.localStorage.setItem(KIND_KEY, kind);
	} catch {
		/* private mode etc. */
	}
}
