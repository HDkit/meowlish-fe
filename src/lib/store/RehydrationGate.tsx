'use client';

import { Loader2 } from 'lucide-react';
import { PersistGate } from 'redux-persist/integration/react';
import { usePersistor } from './StoreProvider';

/**
 * Renders children only after redux-persist has restored the saved state
 * (current user, roles, ...). The server and the first client render both show
 * the loader, so pages that branch on the logged-in user no longer cause
 * hydration mismatches.
 */
export function RehydrationGate({ children }: { children: React.ReactNode }) {
	const persistor = usePersistor();
	if (!persistor) return <>{children}</>;

	return (
		<PersistGate
			persistor={persistor}
			loading={
				<div className='flex min-h-screen w-full items-center justify-center'>
					<Loader2 className='h-8 w-8 animate-spin text-primary' aria-label='Loading' />
				</div>
			}
		>
			{children}
		</PersistGate>
	);
}
