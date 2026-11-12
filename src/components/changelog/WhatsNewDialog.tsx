'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { CURRENT_RELEASE, CURRENT_VERSION } from '@/lib/changelog';
import { isAutomatedBrowser, isSuppressedRoute, shouldShowWhatsNew, whatsNewStorage } from '@/lib/whats-new';
import { ReleaseChanges, ReleaseHeader } from './ReleaseNotes';

/**
 * Pops up the latest release notes on a first visit, after a new version
 * ships, or when the visitor returns after a long break. Client-only: it
 * reads localStorage after mount, so server and first client render match.
 */
export function WhatsNewDialog() {
	const pathname = usePathname() ?? '/';
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (isSuppressedRoute(pathname) || isAutomatedBrowser()) return;

		const now = Date.now();
		const show = shouldShowWhatsNew({
			currentVersion: CURRENT_VERSION,
			lastSeenVersion: whatsNewStorage.lastSeenVersion(),
			lastVisitAt: whatsNewStorage.lastVisitAt(),
			now: now,
		});
		whatsNewStorage.markVisit(now);
		if (!show) return;

		// let the page paint first so the dialog doesn't feel like a blocker
		const timer = window.setTimeout(() => setOpen(true), 800);
		return () => window.clearTimeout(timer);
		// only decide once per page load, not on every client-side navigation
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) whatsNewStorage.markSeen(CURRENT_VERSION);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent data-testid='whats-new-dialog' className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
				<DialogHeader className='gap-3 text-left'>
					<ReleaseHeader release={CURRENT_RELEASE} isLatest />
					<DialogTitle className='text-xl'>Có gì mới: {CURRENT_RELEASE.title}</DialogTitle>
					{CURRENT_RELEASE.summary && <DialogDescription>{CURRENT_RELEASE.summary}</DialogDescription>}
				</DialogHeader>
				<ReleaseChanges release={CURRENT_RELEASE} />
				<DialogFooter className='gap-2 sm:justify-between'>
					<Button variant='outline' asChild>
						<Link href='/changelog' onClick={() => handleOpenChange(false)}>
							Xem tất cả cập nhật
						</Link>
					</Button>
					<Button onClick={() => handleOpenChange(false)}>Đã hiểu</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
