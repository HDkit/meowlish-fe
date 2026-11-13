import { isReviewSession, type ReviewSession } from './session';

export const SESSION_STORAGE_KEY = 'flashcard-review:session';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** `window.sessionStorage`, or null where it is missing or blocked (SSR, privacy modes). */
function defaultStorage(): StorageLike | null {
	try {
		return typeof window === 'undefined' ? null : window.sessionStorage;
	} catch {
		return null;
	}
}

/** The stored session of `userId`, or null (none, unreadable, another user's, or malformed). */
export function loadSession(userId: string, storage: StorageLike | null = defaultStorage()): ReviewSession | null {
	if (!storage) return null;
	try {
		const raw = storage.getItem(SESSION_STORAGE_KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		return isReviewSession(parsed) && parsed.userId === userId ? parsed : null;
	} catch {
		return null;
	}
}

export function saveSession(session: ReviewSession, storage: StorageLike | null = defaultStorage()): void {
	if (!storage) return;
	try {
		storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
	} catch {
		// quota or blocked storage: the session just won't survive a refresh
	}
}

export function clearSession(storage: StorageLike | null = defaultStorage()): void {
	if (!storage) return;
	try {
		storage.removeItem(SESSION_STORAGE_KEY);
	} catch {
		// ignore
	}
}
