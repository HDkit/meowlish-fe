export const LAST_SEEN_VERSION_KEY = 'lingriser:lastSeenVersion';
export const LAST_VISIT_KEY = 'lingriser:lastVisitAt';

/** Show the dialog again to users who have been away at least this long. */
export const AWAY_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Automated browsers (Lighthouse, crawlers, headless tools) skip the dialog so
 * it doesn't cover the page in audits and screenshots.
 */
export function isAutomatedBrowser() {
	return typeof navigator !== 'undefined' && navigator.webdriver === true;
}

/** Routes where an interrupting dialog would be harmful or redundant. */
const SUPPRESSED_PREFIXES = ['/test/do/', '/changelog'];

export function isSuppressedRoute(pathname: string) {
	return SUPPRESSED_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

/**
 * The "what's new" dialog opens when the visitor hasn't seen the current
 * version yet (including first visits), or comes back after a long absence.
 */
export function shouldShowWhatsNew(opts: {
	currentVersion: string;
	lastSeenVersion: string | null;
	lastVisitAt: number | null;
	now: number;
	awayThresholdMs?: number;
}) {
	const { currentVersion, lastSeenVersion, lastVisitAt, now, awayThresholdMs = AWAY_THRESHOLD_MS } = opts;
	if (lastSeenVersion !== currentVersion) return true;
	return lastVisitAt !== null && now - lastVisitAt >= awayThresholdMs;
}

const read = (key: string) => {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
};

const write = (key: string, value: string) => {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// storage unavailable (private mode, blocked): the dialog just shows again next time
	}
};

export const whatsNewStorage = {
	lastSeenVersion: () => read(LAST_SEEN_VERSION_KEY),
	lastVisitAt: () => {
		const raw = read(LAST_VISIT_KEY);
		const n = raw === null ? NaN : Number(raw);
		return Number.isFinite(n) ? n : null;
	},
	markVisit: (now: number) => write(LAST_VISIT_KEY, String(now)),
	markSeen: (version: string) => write(LAST_SEEN_VERSION_KEY, version),
};
