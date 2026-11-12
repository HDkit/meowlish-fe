/**
 * Browser session helpers.
 *
 * The backend keeps the JWTs in HttpOnly cookies (`access_token`, `refresh_token`):
 * the browser sends them with every `credentials: 'include'` request and JavaScript
 * never sees them. This module therefore never stores or reads a token. It only:
 *  - refreshes the session once (POST /auth/refresh) when a request gets a 401,
 *  - logs out (POST /auth/logout, which clears the cookies),
 *  - detects the session (GET /auth/my/identity),
 *  - keeps a non-secret `user_authenticated` hint cookie that the Next.js middleware
 *    uses to route between /auth and the app (the access token is short-lived and its
 *    cookie is HttpOnly, so the middleware can't rely on it).
 *
 * Every request goes to THIS origin (`/api/v1/...`); next.config.ts rewrites `/api/*` (and
 * `/socket.io/*`) to the gateway at NEXT_PUBLIC_API_URL. Calling the gateway host directly
 * would be cross-site in production (public-suffix hosts like *.servebeer.com are separate
 * sites), so the SameSite cookies would never be stored or sent.
 */
import type { User } from '@/types/client';

export const SESSION_HINT_COOKIE = 'user_authenticated';
const SESSION_HINT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Base for API URLs: '' (same origin). Paths start with `/api/v1/...` and reach the gateway
 * through the Next.js rewrite, so the session cookies are first-party.
 */
export const getApiBaseUrl = (): string => '';

/** Routes whose 401 means "bad credentials", not "expired session": never refresh-and-retry them. */
const NO_REFRESH_PATHS = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout',
    '/api/v1/auth/google/tokens',
    // a 401 here is a wrong current password; the form refreshes the session before submitting
    '/api/v1/auth/credentials/mail/password',
];

export const shouldRefreshOn401 = (path: string): boolean =>
    !NO_REFRESH_PATHS.some((p) => path === p || path.startsWith(`${p}?`));

export const markSessionActive = (): void => {
    if (!isBrowser()) return;
    document.cookie = `${SESSION_HINT_COOKIE}=true; path=/; max-age=${SESSION_HINT_MAX_AGE_SECONDS}; samesite=lax`;
};

/** True when this browser has the routing hint, i.e. it had a session at some point. */
export const hasSessionHint = (): boolean => {
    if (!isBrowser()) return false;
    return document.cookie.split(';').some((c) => c.trim().startsWith(`${SESSION_HINT_COOKIE}=true`));
};

export const clearSessionHint = (): void => {
    if (!isBrowser()) return;
    document.cookie = `${SESSION_HINT_COOKIE}=; path=/; max-age=0; samesite=lax`;
};

/**
 * Removes tokens that older builds kept in localStorage and in JS-set cookies. A stale JS
 * `access_token` cookie on the API's host would be read before the Bearer fallback. The
 * browser ignores these cookie writes when the cookie is the gateway's HttpOnly one.
 */
export const purgeLegacyTokens = (): void => {
    if (!isBrowser()) return;
    try {
        window.localStorage.removeItem('access_token');
        window.localStorage.removeItem('refresh_token');
    } catch {
        // storage unavailable
    }
    for (const name of ['access_token', 'refresh_token']) {
        document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
    }
};

/**
 * - `refreshed`: the session cookies were rotated, the session is alive.
 * - `expired`: the gateway answered 401, there is no session any more (logged out).
 * - `unavailable`: couldn't tell (429, 5xx, 403, network error); not treated as logged out.
 */
export type RefreshResult = 'refreshed' | 'expired' | 'unavailable';

let refreshPromise: Promise<RefreshResult> | null = null;

/** Asks the gateway to rotate the session cookies. Concurrent callers share one request. */
export const refreshSession = (): Promise<RefreshResult> => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { Accept: 'application/json' },
            });
            if (response.ok) return 'refreshed';
            if (response.status === 401) {
                clearSessionHint();
                return 'expired';
            }
            return 'unavailable';
        } catch {
            return 'unavailable';
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

/** Clears the session cookies on the gateway and the local routing hint. Never throws. */
export const logoutSession = async (): Promise<void> => {
    try {
        await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });
    } catch {
        // the cookies may stay, but the local session is gone either way
    } finally {
        clearSessionHint();
    }
};

export type OwnIdentity = {
    id: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
    phoneNumber?: string;
    roles: string[];
};

/**
 * Detects the session: GET /auth/my/identity with the cookies, refreshing once on a 401
 * when `allowRefresh` (pass false for anonymous visitors so they don't hit /auth/refresh).
 * Resolves to the identity, to null when there is no session (401), or to undefined when
 * it couldn't tell (network error, 5xx, refresh unavailable). Does not redirect.
 */
export const fetchOwnIdentity = async (
    { allowRefresh = true }: { allowRefresh?: boolean } = {},
): Promise<OwnIdentity | null | undefined> => {
    const get = () =>
        fetch(`${getApiBaseUrl()}/api/v1/auth/my/identity`, {
            method: 'GET',
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });

    try {
        let response = await get();
        if (response.status === 401 && allowRefresh) {
            const refreshed = await refreshSession();
            if (refreshed === 'unavailable') return undefined;
            if (refreshed === 'refreshed') response = await get();
        }
        if (response.status === 401) {
            clearSessionHint();
            return null;
        }
        if (!response.ok) return undefined;
        const body = await response.json().catch(() => null);
        const data = body?.data ?? null;
        if (!data?.id) return undefined;
        markSessionActive();
        return { ...data, roles: Array.isArray(data.roles) ? data.roles : [] } as OwnIdentity;
    } catch {
        return undefined;
    }
};

/**
 * Maps backend role names (libs/typing Role enum) to the app's role ids.
 * Matches what the old token-permission mapping produced for the seeded roles:
 * admin -> head staff; mod -> mod; teacher/mentor (exam:write) -> staff; anything else -> learner.
 */
export const roleIdFromRoles = (roles: readonly string[]): string => {
    const names = roles.map((r) => String(r).toLowerCase());
    if (names.includes('admin') || names.includes('head_staff')) return 'role-head-staff';
    if (names.includes('mod')) return 'role-mod';
    if (names.includes('staff') || names.includes('teacher') || names.includes('mentor')) return 'role-staff';
    return 'role-learner';
};

export const isAdminRoleId = (roleId: string): boolean =>
    roleId === 'role-mod' || roleId === 'role-staff' || roleId === 'role-head-staff';

export const userFromIdentity = (identity: OwnIdentity, fallback: { email?: string; fullName?: string } = {}): User => ({
    id: identity.id,
    email: fallback.email ?? '',
    fullName: identity.fullName || fallback.fullName || identity.username || 'User',
    username: identity.username,
    avatarUrl: identity.avatarUrl,
    roleId: roleIdFromRoles(identity.roles),
    password: '***',
    status: 'active',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
});

/** After login/register/Google exchange set the cookies: loads the signed-in user, or throws. */
export const loadSessionUser = async (fallback: { email?: string; fullName?: string } = {}): Promise<User> => {
    const identity = await fetchOwnIdentity();
    if (!identity) throw new Error('Không xác thực được phiên đăng nhập. Vui lòng thử lại.');
    return userFromIdentity(identity, fallback);
};

/**
 * Google login: swaps the one-time `loginToken` from the OAuth redirect for the session
 * cookies (GET /auth/google/tokens sets them and returns `data: null`), then loads the user.
 */
export const exchangeGoogleLoginToken = async (loginToken: string): Promise<User> => {
    const response = await fetch(
        `${getApiBaseUrl()}/api/v1/auth/google/tokens?loginToken=${encodeURIComponent(loginToken)}`,
        { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } },
    );
    if (!response.ok) {
        throw new Error(
            response.status === 401
                ? 'Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.'
                : 'Không thể hoàn tất đăng nhập Google.',
        );
    }
    return loadSessionUser();
};

