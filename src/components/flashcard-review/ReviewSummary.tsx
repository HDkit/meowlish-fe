'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, ListChecks, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { summarize, type ReviewSession } from '@/lib/flashcard-review/session';

/** End of a round: no score, just how many cards were gone through and what to do next. */
export function ReviewSummary({
	session,
	onRestart,
	onChooseOther,
}: {
	session: ReviewSession;
	onRestart: () => void;
	onChooseOther: () => void;
}) {
	const { total, skipped } = summarize(session);
	const headingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		headingRef.current?.focus();
	}, []);

	return (
		<div className="mx-auto max-w-3xl px-4 sm:px-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
			<div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
				<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<CheckCircle2 className="h-7 w-7" aria-hidden />
				</div>
				<h2 ref={headingRef} tabIndex={-1} className="text-2xl font-black text-slate-800 outline-none">
					Đã ôn hết {total} thẻ{session.round > 1 ? ` (lượt ${session.round})` : ''}
				</h2>
				{skipped > 0 && <p className="mt-2 text-sm text-slate-500">Bạn đã bỏ qua {skipped} thẻ.</p>}
				<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
					<Button onClick={onRestart} className="h-11 rounded-xl px-5 font-bold">
						<RotateCcw className="h-4 w-4" aria-hidden /> Ôn lại từ đầu
					</Button>
					<Button onClick={onChooseOther} variant="outline" className="h-11 rounded-xl px-5 font-semibold">
						<ListChecks className="h-4 w-4" aria-hidden /> Chọn bộ khác
					</Button>
				</div>
			</div>
		</div>
	);
}
