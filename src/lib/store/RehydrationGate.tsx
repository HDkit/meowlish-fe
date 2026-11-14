'use client';

import { PersistGate } from 'redux-persist/integration/react';
import { usePersistor } from './StoreProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { CardGridSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/skeletons';

/**
 * Renders children only after redux-persist has restored the saved state
 * (current user, roles, ...). The server and the first client render both show
 * a skeleton of the app shell (sidebar, top bar, page), so pages that branch on
 * the logged-in user no longer cause hydration mismatches, and the shell
 * doesn't pop in around a spinner.
 */
export function RehydrationGate({
	children,
	sidebarOpen = true,
}: {
	children: React.ReactNode;
	/** Saved sidebar state, so the placeholder column matches the real sidebar's width. */
	sidebarOpen?: boolean;
}) {
	const persistor = usePersistor();
	if (!persistor) return <>{children}</>;

	return (
		<PersistGate persistor={persistor} loading={<AppShellSkeleton sidebarOpen={sidebarOpen} />}>
			{children}
		</PersistGate>
	);
}

function AppShellSkeleton({ sidebarOpen }: { sidebarOpen: boolean }) {
	return (
		<LoadingRegion className='flex min-h-screen w-full'>
			<div
				className={`hidden shrink-0 flex-col gap-3 border-r border-border/70 bg-sidebar p-3 md:flex ${sidebarOpen ? 'w-64' : 'w-12 px-2'}`}
			>
				<Skeleton className={sidebarOpen ? 'h-16 rounded-2xl' : 'size-8 rounded-xl'} />
				{Array.from({ length: 8 }, (_, i) => (
					<Skeleton key={i} className={sidebarOpen ? 'h-8 rounded-lg' : 'size-8 rounded-lg'} />
				))}
			</div>
			<div className='app-pattern flex min-w-0 flex-1 flex-col'>
				<div className='flex h-16 items-center gap-3 border-b border-border/70 bg-white/82 px-4 md:px-6 lg:px-8 xl:px-10'>
					<Skeleton className='h-6 w-40' />
					<Skeleton className='ml-auto size-9 rounded-full' />
					<Skeleton className='size-9 rounded-full' />
				</div>
				<div className='mx-auto w-full max-w-[1500px] space-y-6 px-4 py-5 md:px-6 lg:px-8 xl:px-10'>
					<PageHeaderSkeleton />
					<CardGridSkeleton count={6} />
				</div>
			</div>
		</LoadingRegion>
	);
}
