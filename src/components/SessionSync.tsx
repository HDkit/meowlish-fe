'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { fetchOwnIdentity, userFromIdentity } from '@/lib/api/auth-session';
import { useAppDispatch, useAppSelector, useIsStoreHydrated } from '@/lib/store/hooks';
import { clearUser, setUser } from '@/components/store/currUserSlice';

/**
 * Detects the cookie session once per page load with GET /auth/my/identity and
 * reconciles the persisted Redux user with it. Skips the auth pages, which
 * establish the session themselves.
 */
export function SessionSync() {
	const dispatch = useAppDispatch();
	const isHydrated = useIsStoreHydrated();
	const currUser = useAppSelector((state) => state.currUser.current);
	const pathname = usePathname();
	const checked = useRef(false);

	useEffect(() => {
		if (!isHydrated || checked.current) return;
		if (pathname?.startsWith('/auth') || pathname?.startsWith('/api/')) return;
		checked.current = true;

		void fetchOwnIdentity().then((identity) => {
			if (identity) {
				dispatch(setUser(userFromIdentity(identity, { email: currUser?.email })));
			} else if (identity === null && currUser) {
				dispatch(clearUser());
			}
		});
	}, [isHydrated, pathname, currUser, dispatch]);

	return null;
}
