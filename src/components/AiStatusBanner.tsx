'use client';

import Link from 'next/link';
import { TriangleAlert, X } from 'lucide-react';
import { AI_SERVICE_NOTICE, AI_SERVICE_OPERATIONAL, SHOW_AI_NOTICE } from '@/lib/service-status';
import { useAiBannerHidden } from '@/lib/ai-status-banner';

/**
 * Slim status bar, rendered inside the sticky page headers (LandingNavbar, AppTopBar) so it stays
 * pinned while scrolling without covering the fixed app sidebar. The user can hide it; the
 * header's AiStatusToggle brings it back, and a changed notice shows again on its own.
 */
export function AiStatusBanner() {
	const [hidden, setHidden] = useAiBannerHidden();
	if (!SHOW_AI_NOTICE || AI_SERVICE_OPERATIONAL || hidden) return null;

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
				<button
					type='button'
					onClick={() => setHidden(true)}
					aria-label='Ẩn thông báo'
					title='Ẩn thông báo'
					data-testid='ai-status-banner-hide'
					className='-mr-1 shrink-0 rounded p-1 text-amber-700 hover:bg-amber-100 hover:text-amber-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600'
				>
					<X className='h-4 w-4' aria-hidden='true' />
				</button>
			</div>
		</div>
	);
}

/** Header button that shows the hidden AI status banner again; renders nothing while it's visible. */
export function AiStatusToggle({ className = '' }: { className?: string }) {
	const [hidden, setHidden] = useAiBannerHidden();
	if (!SHOW_AI_NOTICE || AI_SERVICE_OPERATIONAL || !hidden) return null;

	return (
		<button
			type='button'
			onClick={() => setHidden(false)}
			aria-label={`Hiện thông báo: ${AI_SERVICE_NOTICE.title}`}
			title={AI_SERVICE_NOTICE.title}
			data-testid='ai-status-banner-show'
			className={`inline-flex size-8 items-center justify-center rounded-md text-amber-600 hover:bg-amber-50 hover:text-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600 ${className}`}
		>
			<TriangleAlert className='h-4 w-4' aria-hidden='true' />
		</button>
	);
}
