/**
 * Sending a visitor to the login page and back to where they were.
 *
 * Public pages (the blog) link to `/auth?mode=login&next=<path>`. The login and register forms
 * return to `next` afterwards. Google login leaves the site, so the path is kept in
 * sessionStorage across the round trip and read back on the page that finishes the login.
 */

const RETURN_PATH_KEY = 'login_return_path';

/**
 * `raw` if it is a path on this site to return to after logging in, else null. Rejects absolute
 * and protocol-relative URLs (`//evil.example`, `/\evil.example`) so `next` can't be used as an
 * open redirect, and the auth pages themselves.
 */
export const safeReturnPath = (raw: string | null | undefined): string | null => {
	if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
	if (raw === '/auth' || raw.startsWith('/auth/') || raw.startsWith('/auth?') || raw.startsWith('/auth#')) {
		return null;
	}
	return raw;
};

/** The login page, returning to `returnTo` once signed in. */
export const loginUrl = (returnTo?: string | null): string => {
	const next = safeReturnPath(returnTo);
	return next ? `/auth?mode=login&next=${encodeURIComponent(next)}` : '/auth?mode=login';
};

/** Where to go after logging in: the requested page, else the user's home page. */
export const postLoginPath = (next: string | null | undefined, isAdmin: boolean): string =>
	safeReturnPath(next) ?? (isAdmin ? '/dashboard' : '/test-selection');

/** Keeps `next` for the Google round trip (the redirect back drops the query string). */
export const rememberReturnPath = (next: string | null | undefined): void => {
	try {
		const path = safeReturnPath(next);
		if (path) window.sessionStorage.setItem(RETURN_PATH_KEY, path);
		else window.sessionStorage.removeItem(RETURN_PATH_KEY);
	} catch {
		// storage unavailable: the user lands on their home page instead
	}
};

/** Reads and forgets the path kept by rememberReturnPath. */
export const takeReturnPath = (): string | null => {
	try {
		const path = window.sessionStorage.getItem(RETURN_PATH_KEY);
		window.sessionStorage.removeItem(RETURN_PATH_KEY);
		return safeReturnPath(path);
	} catch {
		return null;
	}
};
