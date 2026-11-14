import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getOwn = vi.fn();
vi.mock('./api-client', () => ({ AuthService: { authGatewayControllerGetOwnIdentityV1: () => getOwn() } }));

describe('getOwnIdentity', () => {
	beforeEach(() => {
		vi.resetModules();
		getOwn.mockReset();
		getOwn.mockImplementation(() => Promise.resolve({ data: { id: 'u1', avatarUrl: 'signed-1' } }));
	});
	afterEach(() => vi.useRealTimers());

	it('shares one request between concurrent callers and reuses the answer', async () => {
		const { getOwnIdentity } = await import('./own-identity');
		const [a, b] = await Promise.all([getOwnIdentity(), getOwnIdentity()]);
		expect(a).toEqual({ id: 'u1', avatarUrl: 'signed-1' });
		expect(b).toBe(a);
		await getOwnIdentity();
		expect(getOwn).toHaveBeenCalledTimes(1);
	});

	it('refetches after 30 s, on fresh: true, and after invalidation', async () => {
		vi.useFakeTimers();
		const { getOwnIdentity, invalidateOwnIdentity } = await import('./own-identity');
		await getOwnIdentity();
		vi.advanceTimersByTime(31_000);
		await getOwnIdentity();
		await getOwnIdentity({ fresh: true });
		invalidateOwnIdentity();
		await getOwnIdentity();
		expect(getOwn).toHaveBeenCalledTimes(4);
	});
});
