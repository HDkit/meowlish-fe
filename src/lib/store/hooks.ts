'use client';

import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppStore, AppDispatch, RootState } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

/**
 * Returns true once redux-persist has finished rehydrating the store from localStorage.
 * Use this to gate auth-based redirects so components don't redirect before the
 * persisted user state is available.
 */
export const useIsStoreHydrated = () =>
	useAppSelector((state) => (state as any)._persist?.rehydrated === true);
