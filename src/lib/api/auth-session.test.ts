import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAPI } from './core/OpenAPI';
import { AuthService } from './services/AuthService';
import { GoalsService } from './services/GoalsService';
import { ApiError } from './core/ApiError';
import {
	exchangeGoogleLoginToken,
	fetchOwnIdentity,
	getApiBaseUrl,
	GOOGLE_LINK_PATH,
	startGoogleLink,
	logoutSession,
	refreshSession,
	roleIdFromRoles,
	shouldRefreshOn401,
} from './auth-session';

const json = (status: number, data: unknown) =>
	new Response(JSON.stringify({ success: status < 400, statusCode: status, data }), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});

type Call = { url: string; init: RequestInit };

const mockFetch = (...responses: Response[]) => {
	const calls: Call[] = [];
	const fn = vi.fn(async (url: string, init: RequestInit) => {
		calls.push({ url: String(url), init });
		const next = responses.shift();
		if (!next) throw new Error(`unexpected fetch ${url}`);
		return next;
	});
	vi.stubGlobal('fetch', fn);
	return calls;
};

let cookieWrites: string[];
let location: { pathname: string; href: string };

beforeEach(() => {
	cookieWrites = [];
	location = { pathname: '/dashboard', href: 'http://localhost:6767/dashboard' };
	vi.stubGlobal('window', { location });
	vi.stubGlobal('document', {
		set cookie(v: string) {
			cookieWrites.push(v);
		},
		get cookie() {
			return '';
		},
	});
	vi.spyOn(console, 'log').mockImplementation(() => {});
	OpenAPI.BASE = getApiBaseUrl();
	OpenAPI.TOKEN = undefined;
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const base = getApiBaseUrl();

describe('generated client with cookie auth', () => {
	it('sends every request with credentials and no Authorization header', async () => {
		const calls = mockFetch(json(200, { id: 'u1', username: 'u', roles: [] }));
		await AuthService.authGatewayControllerGetOwnIdentityV1();
		expect(calls[0].init.credentials).toBe('include');
		expect((calls[0].init.headers as Headers).has('Authorization')).toBe(false);
	});

	it('on a 401 refreshes once with the cookie and retries the request', async () => {
		const calls = mockFetch(json(401, null), json(201, null), json(200, { id: 'u1', username: 'u', roles: [] }));
		const res = await AuthService.authGatewayControllerGetOwnIdentityV1();

		expect(res.data).toEqual({ id: 'u1', username: 'u', roles: [] });
		expect(calls.map((c) => `${c.init.method} ${c.url}`)).toEqual([
			`GET ${base}/api/v1/auth/my/identity`,
			`POST ${base}/api/v1/auth/refresh`,
			`GET ${base}/api/v1/auth/my/identity`,
		]);
		expect(calls[1].init.credentials).toBe('include');
		expect(calls[2].init.credentials).toBe('include');
	});

	it('does not retry twice: a second 401 is surfaced to the caller', async () => {
		const calls = mockFetch(json(401, null), json(201, null), json(401, null));
		await expect(AuthService.authGatewayControllerGetOwnIdentityV1()).rejects.toMatchObject({ status: 401 });
		expect(calls).toHaveLength(3);
	});

	it('when the refresh fails, clears the session hint and sends the user to login', async () => {
		mockFetch(json(401, null), json(401, null));
		await expect(AuthService.authGatewayControllerGetOwnIdentityV1()).rejects.toBeInstanceOf(ApiError);
		expect(location.href).toBe('/auth?mode=login');
		expect(cookieWrites.some((c) => c.startsWith('user_authenticated=;') && c.includes('max-age=0'))).toBe(true);
	});

	it('does not treat a rate-limited refresh (429) as logged out', async () => {
		const calls = mockFetch(json(401, null), json(429, null));
		await expect(AuthService.authGatewayControllerGetOwnIdentityV1()).rejects.toMatchObject({ status: 401 });
		expect(calls).toHaveLength(2);
		expect(location.href).toBe('http://localhost:6767/dashboard');
		expect(cookieWrites).toEqual([]);
	});

	it('does not treat a network error on refresh as logged out', async () => {
		const fn = vi
			.fn()
			.mockResolvedValueOnce(json(401, null))
			.mockRejectedValueOnce(new TypeError('Failed to fetch'));
		vi.stubGlobal('fetch', fn);
		await expect(AuthService.authGatewayControllerGetOwnIdentityV1()).rejects.toMatchObject({ status: 401 });
		expect(location.href).toBe('http://localhost:6767/dashboard');
		expect(cookieWrites).toEqual([]);
	});

	it('does not refresh on a wrong current password (401 from the password route)', async () => {
		const calls = mockFetch(json(401, null));
		await expect(
			AuthService.authGatewayControllerUpdateMailPasswordV1({ id: 'c', currentPassword: 'x', password: 'y' }),
		).rejects.toMatchObject({ status: 401 });
		expect(calls).toHaveLength(1);
		expect(location.href).toBe('http://localhost:6767/dashboard');
	});

	it('never logs request or response bodies', async () => {
		const log = vi.spyOn(console, 'log');
		mockFetch(json(200, { secret: 'resp' }));
		await AuthService.authGatewayControllerUpdateMailPasswordV1({ id: 'c', currentPassword: 'old-secret', password: 'new-secret' });
		const logged = JSON.stringify(log.mock.calls);
		expect(logged).not.toContain('old-secret');
		expect(logged).not.toContain('resp');
	});

	it('does not refresh on a failed login (bad credentials, not an expired session)', async () => {
		const calls = mockFetch(json(401, null));
		await expect(
			AuthService.authGatewayControllerLoginMailV1({ mail: 'a@b.c', password: 'x' }),
		).rejects.toMatchObject({ status: 401 });
		expect(calls).toHaveLength(1);
	});
});

describe('refreshSession', () => {
	it('shares one refresh request between concurrent callers', async () => {
		const calls = mockFetch(json(201, null));
		const [a, b] = await Promise.all([refreshSession(), refreshSession()]);
		expect([a, b]).toEqual(['refreshed', 'refreshed']);
		expect(calls).toHaveLength(1);
		expect(calls[0].init.body).toBeUndefined();
	});
});

describe('logoutSession', () => {
	it('posts to /auth/logout with the cookies and clears the session hint', async () => {
		const calls = mockFetch(json(201, null));
		await logoutSession();
		expect(calls[0].url).toBe(`${base}/api/v1/auth/logout`);
		expect(calls[0].init).toMatchObject({ method: 'POST', credentials: 'include' });
		expect(cookieWrites.some((c) => c.startsWith('user_authenticated=;'))).toBe(true);
	});

	it('still clears the hint when the network fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
		await expect(logoutSession()).resolves.toBeUndefined();
		expect(cookieWrites.some((c) => c.startsWith('user_authenticated=;'))).toBe(true);
	});
});

describe('fetchOwnIdentity', () => {
	it('detects the session through /auth/my/identity and marks it active', async () => {
		mockFetch(json(200, { id: 'u1', username: 'minh', roles: ['mod'] }));
		await expect(fetchOwnIdentity()).resolves.toMatchObject({ id: 'u1', roles: ['mod'] });
		expect(cookieWrites.some((c) => c.startsWith('user_authenticated=true'))).toBe(true);
	});

	it('returns null without a session (after one refresh attempt)', async () => {
		const calls = mockFetch(json(401, null), json(401, null));
		await expect(fetchOwnIdentity()).resolves.toBeNull();
		expect(calls).toHaveLength(2);
	});

	it('does not call refresh for anonymous visitors', async () => {
		const calls = mockFetch(json(401, null));
		await expect(fetchOwnIdentity({ allowRefresh: false })).resolves.toBeNull();
		expect(calls.map((c) => c.url)).toEqual([`${base}/api/v1/auth/my/identity`]);
	});

	it('returns undefined (not logged out) when the refresh is rate limited', async () => {
		mockFetch(json(401, null), json(429, null));
		await expect(fetchOwnIdentity()).resolves.toBeUndefined();
		expect(cookieWrites).toEqual([]);
	});

	it('returns undefined when it cannot tell (server error)', async () => {
		mockFetch(json(503, null));
		await expect(fetchOwnIdentity()).resolves.toBeUndefined();
	});
});

describe('exchangeGoogleLoginToken', () => {
	it('posts the login token as JSON (never in the URL), then loads the user', async () => {
		const calls = mockFetch(json(201, null), json(200, { id: 'u1', username: 'minh', roles: ['user'] }));
		await expect(exchangeGoogleLoginToken('t-1')).resolves.toMatchObject({ id: 'u1' });
		expect(calls[0].url).toBe(`${base}/api/v1/auth/google/tokens`);
		expect(calls[0].init.method).toBe('POST');
		expect(calls[0].init.body).toBe(JSON.stringify({ loginToken: 't-1' }));
		expect(new Headers(calls[0].init.headers).get('Content-Type')).toBe('application/json');
	});

	it('reports an expired token on 401', async () => {
		mockFetch(json(401, null));
		await expect(exchangeGoogleLoginToken('old')).rejects.toThrow('hết hạn');
	});
});

describe('helpers', () => {
	it('maps backend roles to app role ids', () => {
		expect(roleIdFromRoles(['admin'])).toBe('role-head-staff');
		expect(roleIdFromRoles(['mod'])).toBe('role-mod');
		expect(roleIdFromRoles(['teacher'])).toBe('role-staff');
		expect(roleIdFromRoles(['student'])).toBe('role-learner');
		expect(roleIdFromRoles([])).toBe('role-learner');
	});

	it('never refreshes on the credential routes', () => {
		expect(shouldRefreshOn401('/api/v1/auth/login')).toBe(false);
		expect(shouldRefreshOn401('/api/v1/auth/refresh')).toBe(false);
		expect(shouldRefreshOn401('/api/v1/auth/my/identity')).toBe(true);
		expect(shouldRefreshOn401('/api/v1/auth/credentials/mail/password')).toBe(false);
	});
});

describe('same-origin API', () => {
	it('uses a relative base so every call goes through the Next.js /api rewrite', async () => {
		expect(getApiBaseUrl()).toBe('');
		const calls = mockFetch(json(200, { id: 'u1', username: 'u', roles: [] }), json(201, null), json(201, null));
		await AuthService.authGatewayControllerGetOwnIdentityV1();
		await refreshSession();
		await logoutSession();
		expect(calls.map((c) => c.url)).toEqual([
			'/api/v1/auth/my/identity',
			'/api/v1/auth/refresh',
			'/api/v1/auth/logout',
		]);
	});
});

describe('startGoogleLink', () => {
	it('refreshes the session, then navigates to the same-origin link route', async () => {
		const calls = mockFetch(json(201, null));
		await expect(startGoogleLink()).resolves.toBe('navigating');
		expect(calls.map((c) => `${c.init.method} ${c.url}`)).toEqual(['POST /api/v1/auth/refresh']);
		expect(location.href).toBe(GOOGLE_LINK_PATH);
		expect(GOOGLE_LINK_PATH).toBe('/api/v1/auth/credentials/google');
	});

	it('does not navigate when the session has expired', async () => {
		mockFetch(json(401, null));
		await expect(startGoogleLink()).resolves.toBe('expired');
		expect(location.href).toBe('http://localhost:6767/dashboard');
	});

	it('still navigates when it cannot tell (refresh rate limited)', async () => {
		mockFetch(json(429, null));
		await expect(startGoogleLink()).resolves.toBe('navigating');
		expect(location.href).toBe(GOOGLE_LINK_PATH);
	});
});

describe('locked account', () => {
	const locked = () =>
		new Response(JSON.stringify({ success: false, statusCode: 403, data: null, error: 'Account locked' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' },
		});

	it('a 403 "Account locked" from any API call logs out and redirects to login', async () => {
		const calls = mockFetch(locked(), json(201, null));
		await expect(GoalsService.goalGatewayControllerDeleteGoalV1()).rejects.toMatchObject({ status: 403 });
		expect(calls.map((c) => `${c.init.method} ${c.url}`)).toEqual([
			'DELETE /api/v1/exams/goals/my',
			'POST /api/v1/auth/logout',
		]);
		expect(location.href).toBe('/auth?mode=login&reason=locked');
		expect(cookieWrites.some((c) => c.startsWith('user_authenticated=;'))).toBe(true);
	});

	it('a locked refresh counts as logged out', async () => {
		mockFetch(locked(), json(201, null));
		await expect(refreshSession()).resolves.toBe('expired');
		expect(location.href).toBe('/auth?mode=login&reason=locked');
	});

	it('does not redirect from the login page (the form shows the error)', async () => {
		location.pathname = '/auth';
		mockFetch(locked(), json(201, null));
		await expect(
			AuthService.authGatewayControllerLoginMailV1({ mail: 'a@b.c', password: 'x' }),
		).rejects.toMatchObject({ status: 403 });
		expect(location.href).toBe('http://localhost:6767/dashboard');
	});

	it('leaves other 403s alone', async () => {
		const calls = mockFetch(json(403, null));
		await expect(AuthService.authGatewayControllerGetOwnIdentityV1()).rejects.toMatchObject({ status: 403 });
		expect(calls).toHaveLength(1);
		expect(location.href).toBe('http://localhost:6767/dashboard');
	});
});
