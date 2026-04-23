import type { ResponseTokensDto } from './models/ResponseTokensDto';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://meowlish.servebeer.com';

export const ACCESS_TOKEN_STORAGE_KEY = 'access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
const ACCESS_TOKEN_COOKIE_KEY = 'access_token';
const REFRESH_TOKEN_COOKIE_KEY = 'refresh_token';

let refreshPromise: Promise<string | null> | null = null;

const isBrowser = () => typeof window !== 'undefined';

const getStorage = (): Storage | null => {
    if (!isBrowser()) {
        return null;
    }

    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

export const getApiBaseUrl = (): string => API_BASE_URL.replace(/\/+$/, '');

const getCookieValue = (name: string): string | undefined => {
    if (!isBrowser()) {
        return undefined;
    }

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : undefined;
};

const setCookieValue = (name: string, value: string, maxAgeSeconds: number): void => {
    if (!isBrowser()) {
        return;
    }

    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
};

const clearCookieValue = (name: string): void => {
    if (!isBrowser()) {
        return;
    }

    document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
};

export const getAccessToken = (): string | undefined => {
    return getStorage()?.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? getCookieValue(ACCESS_TOKEN_COOKIE_KEY) ?? undefined;
};

export const getRefreshToken = (): string | undefined => {
    return getStorage()?.getItem(REFRESH_TOKEN_STORAGE_KEY) ?? getCookieValue(REFRESH_TOKEN_COOKIE_KEY) ?? undefined;
};

export const setApiTokens = (accessToken: string, refreshToken?: string): void => {
    const storage = getStorage();

    if (storage) {
        storage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
        if (refreshToken) {
            storage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
        }
    }

    setCookieValue(ACCESS_TOKEN_COOKIE_KEY, accessToken, 60 * 60 * 24 * 30);
    if (refreshToken) {
        setCookieValue(REFRESH_TOKEN_COOKIE_KEY, refreshToken, 60 * 60 * 24 * 30);
    }
};

export const clearApiTokens = (): void => {
    const storage = getStorage();

    if (storage) {
        storage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        storage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }

    clearCookieValue(ACCESS_TOKEN_COOKIE_KEY);
    clearCookieValue(REFRESH_TOKEN_COOKIE_KEY);
};

const extractTokens = (payload: unknown): ResponseTokensDto | null => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const entity = payload as { data?: ResponseTokensDto | null };
    if (!entity.data?.accessToken) {
        return null;
    }

    return entity.data;
};

export const refreshAccessToken = async (): Promise<string | null> => {
    if (!isBrowser()) {
        return null;
    }

    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return null;
    }

    refreshPromise = (async () => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${refreshToken}`,
                },
            });

            if (!response.ok) {
                clearApiTokens();
                return null;
            }

            const body = await response.json().catch(() => null);
            const tokens = extractTokens(body);

            if (!tokens?.accessToken) {
                clearApiTokens();
                return null;
            }

            setApiTokens(tokens.accessToken, tokens.refreshToken ?? refreshToken);
            return tokens.accessToken;
        } catch {
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};
