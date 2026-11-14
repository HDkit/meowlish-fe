'use client';

import { useEffect, useMemo, useState } from 'react';
import { AuthService } from '@/lib/api-client';

export type IdentityName = { name: string; username?: string };

// Shared across admin pages for this page load; ids never change owner.
const cache = new Map<string, IdentityName>();
// Ids whose lookup finished (found or not), so callers can tell "still loading" from "unknown".
const settled = new Set<string>();
const MAX_IDS_PER_REQUEST = 100; // gateway: @ArrayMaxSize(100)

const load = async (ids: string[]): Promise<void> => {
	for (let i = 0; i < ids.length; i += MAX_IDS_PER_REQUEST) {
		const chunk = ids.slice(i, i + MAX_IDS_PER_REQUEST);
		try {
			const res = (await AuthService.authGatewayControllerHydrateIdentitiesV1(chunk)) as {
				data?: { identities?: Array<{ id: string; username?: string; fullName?: string }> };
			};
			for (const identity of res.data?.identities ?? []) {
				cache.set(identity.id, {
					name: identity.fullName || identity.username || identity.id,
					username: identity.username,
				});
			}
		} finally {
			for (const id of chunk) settled.add(id);
		}
	}
};

/** True while the name of `id` is still being looked up (show a placeholder, not "—"). */
export function isIdentityPending(id: string | undefined | null): boolean {
	return !!id && !cache.has(id) && !settled.has(id);
}

/** Display names for identity ids (authors, reporters, exam creators). Unknown ids map to nothing. */
export function useIdentityNames(ids: readonly (string | undefined | null)[]): Record<string, IdentityName> {
	const key = useMemo(() => [...new Set(ids.filter((id): id is string => !!id))].sort().join(','), [ids]);
	const [version, setVersion] = useState(0);

	useEffect(() => {
		const missing = key ? key.split(',').filter((id) => !cache.has(id)) : [];
		if (missing.length === 0) return;
		let cancelled = false;
		load(missing)
			.catch((err) => console.warn('useIdentityNames: hydrate failed', err))
			.finally(() => {
				if (!cancelled) setVersion((v) => v + 1);
			});
		return () => {
			cancelled = true;
		};
	}, [key]);

	return useMemo(() => {
		const out: Record<string, IdentityName> = {};
		for (const id of key ? key.split(',') : []) {
			const hit = cache.get(id);
			if (hit) out[id] = hit;
		}
		return out;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, version]);
}
