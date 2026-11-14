'use client';

import { setupApiClient } from '@/lib/api-client';
import { SessionSync } from '@/components/SessionSync';

/**
 * ApiClientProvider – configures the OpenAPI singleton on the client (base URL,
 * cookie credentials) and checks the cookie session once per page load.
 *
 * Place it high in the layout tree so the client is configured before any API call.
 */
export function ApiClientProvider({ children }: { children: React.ReactNode }) {
	if (typeof window !== 'undefined') {
		setupApiClient();
	}

	return (
		<>
			<SessionSync />
			{children}
		</>
	);
}
