import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { AI_SERVICE_NOTICE, AI_SERVICE_OPERATIONAL } from '@/lib/service-status';

/**
 * Slim, non-dismissible status bar. Rendered inside the sticky page headers
 * (LandingNavbar, AppTopBar) so it stays pinned while scrolling without
 * covering the fixed app sidebar.
 */
export function AiStatusBanner() {
	if (AI_SERVICE_OPERATIONAL) return null;

	return (
		<div
			role='status'
			aria-live='polite'
			data-testid='ai-status-banner'
			className='border-b border-amber-200 bg-amber-50 text-amber-900'
		>
			<div className='mx-auto flex w-full max-w-[1500px] items-center gap-2 px-4 py-1.5 text-xs sm:text-sm'>
				<TriangleAlert className='h-4 w-4 shrink-0 text-amber-600' aria-hidden='true' />
				<p className='min-w-0 truncate'>
					<span className='font-semibold'>{AI_SERVICE_NOTICE.title}.</span>{' '}
					<span className='hidden italic text-amber-800/80 sm:inline'>{AI_SERVICE_NOTICE.english}</span>{' '}
					<span className='hidden 2xl:inline'>{AI_SERVICE_NOTICE.message}</span>
				</p>
				<Link
					href='/changelog'
					className='ml-auto shrink-0 font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700'
				>
					Chi tiết
				</Link>
			</div>
		</div>
	);
}
