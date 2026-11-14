'use client';

import { useCallback, useEffect, useState } from 'react';
import { AI_SERVICE_NOTICE } from './service-status';

/** localStorage key holding the notice the user hid (its content key, see noticeKey). */
export const AI_BANNER_HIDDEN_KEY = 'lingriser:aiBannerHidden';
const CHANGE_EVENT = 'lingriser:ai-banner-change';

type Notice = { title: string; message: string; english: string };

/** Content key, so hiding one notice doesn't hide a later, different one. */
export function noticeKey(notice: Notice) {
	return `${notice.title}|${notice.message}|${notice.english}`;
}

export function isBannerHidden(stored: string | null, notice: Notice) {
	return stored === noticeKey(notice);
}

const read = () => {
	try {
		return window.localStorage.getItem(AI_BANNER_HIDDEN_KEY);
	} catch {
		return null;
	}
};

const write = (value: string | null) => {
	try {
		if (value === null) window.localStorage.removeItem(AI_BANNER_HIDDEN_KEY);
		else window.localStorage.setItem(AI_BANNER_HIDDEN_KEY, value);
	} catch {
		// storage unavailable (private mode, blocked): hiding lasts until the next page load
	}
};

/**
 * Whether the AI status banner is hidden, shared by the banner and its reopen button (and across
 * tabs). Starts visible on the server and the first client render, then applies the saved choice.
 */
export function useAiBannerHidden(): [boolean, (hidden: boolean) => void] {
	const [hidden, setHiddenState] = useState(false);

	useEffect(() => {
		const sync = () => setHiddenState(isBannerHidden(read(), AI_SERVICE_NOTICE));
		sync();
		window.addEventListener(CHANGE_EVENT, sync);
		window.addEventListener('storage', sync);
		return () => {
			window.removeEventListener(CHANGE_EVENT, sync);
			window.removeEventListener('storage', sync);
		};
	}, []);

	const setHidden = useCallback((next: boolean) => {
		write(next ? noticeKey(AI_SERVICE_NOTICE) : null);
		setHiddenState(next);
		window.dispatchEvent(new Event(CHANGE_EVENT));
	}, []);

	return [hidden, setHidden];
}
