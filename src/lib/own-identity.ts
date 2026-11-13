import { AuthService } from './api-client';

/**
 * GET /auth/my/identity, shared by everything on the page: concurrent callers get the same request,
 * and the answer is reused for 30 s. Every call is rate-limited per route on the gateway, and the
 * response carries a freshly signed avatar URL, so refetching it often also restarts avatar
 * downloads. Call `invalidateOwnIdentity()` after changing the profile or avatar.
 */
const TTL_MS = 30_000;
let cached: { at: number; value: unknown } | null = null;
let inflight: Promise<unknown> | null = null;

export const getOwnIdentity = async <T = any>(options: { fresh?: boolean } = {}): Promise<T> => {
	if (options.fresh) cached = null;
	if (cached && Date.now() - cached.at < TTL_MS) return cached.value as T;
	inflight ??= AuthService.authGatewayControllerGetOwnIdentityV1()
		.then((res) => {
			const value = (res as { data?: unknown })?.data ?? res;
			cached = { at: Date.now(), value: value };
			return value;
		})
		.finally(() => {
			inflight = null;
		});
	return (await inflight) as T;
};

export const invalidateOwnIdentity = (): void => {
	cached = null;
};
