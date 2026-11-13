'use client';

import { useEffect, useRef } from 'react';
import { ListChecks, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '../ui/button';
import { FIELD_LABELS, MODE_LABELS, answerField, cardField, promptField } from '@/lib/flashcard-review/deck';
import { summarize, type ReviewSession } from '@/lib/flashcard-review/session';

export function ReviewSummary({
	session,
	onRetryMissed,
	onRetryAll,
	onChooseOther,
}: {
	session: ReviewSession;
	onRetryMissed: () => void;
	onRetryAll: () => void;
	onChooseOther: () => void;
}) {
	const { total, correct, missed } = summarize(session);
	const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
	const headingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		headingRef.current?.focus();
	}, []);

	return (
		<div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
			<div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
				<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<Trophy className="h-7 w-7" aria-hidden />
				</div>
				<h2 ref={headingRef} tabIndex={-1} className="text-2xl font-black text-slate-800 outline-none">
					Hoàn thành {session.round > 1 ? `lượt ${session.round}` : 'lượt ôn tập'}
				</h2>
				<p className="mt-2 text-4xl font-black text-primary">
					{correct}/{total}
					<span className="ml-2 text-lg font-bold text-slate-500">đúng ({pct}%)</span>
				</p>
				<p className="mt-2 text-sm text-slate-500">
					{missed.length === 0 ? 'Tuyệt vời! Bạn trả lời đúng tất cả các thẻ.' : `Còn ${missed.length} thẻ cần ôn lại.`}
				</p>
				<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
					{missed.length > 0 && (
						<Button onClick={onRetryMissed} className="h-11 rounded-xl px-5 font-bold">
							<RotateCcw className="h-4 w-4" aria-hidden /> Ôn lại câu sai
						</Button>
					)}
					<Button onClick={onRetryAll} variant={missed.length > 0 ? 'outline' : 'default'} className="h-11 rounded-xl px-5 font-semibold">
						Ôn lại tất cả
					</Button>
					<Button onClick={onChooseOther} variant="outline" className="h-11 rounded-xl px-5 font-semibold">
						<ListChecks className="h-4 w-4" aria-hidden /> Chọn bộ khác
					</Button>
				</div>
			</div>

			{missed.length > 0 && (
				<section aria-labelledby="review-missed" className="space-y-3">
					<h3 id="review-missed" className="text-lg font-bold text-slate-800">
						Câu chưa đúng
					</h3>
					<ul className="space-y-3">
						{missed.map(q => {
							const card = session.cards[q.cardId];
							if (!card) return null;
							const record = session.answers[q.key];
							const shown = promptField(q.mode);
							const asked = answerField(q.mode);
							return (
								<li key={q.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
									<div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
										<span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">{MODE_LABELS[q.mode]}</span>
										<span className="text-slate-400">{card.listName}</span>
									</div>
									<p className="text-xs font-bold uppercase tracking-wider text-slate-400">{FIELD_LABELS[shown]}</p>
									<p className="mb-3 whitespace-pre-wrap break-words font-semibold text-slate-800">{cardField(card, shown)}</p>
									<div className="grid gap-2 md:grid-cols-2">
										<div className="rounded-xl bg-slate-50 p-3">
											<p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bạn trả lời</p>
											<p className="whitespace-pre-wrap break-words text-slate-700">
												{record?.skipped || !record?.answer.trim() ? <span className="italic text-slate-400">(bỏ qua)</span> : record.answer}
											</p>
										</div>
										<div className="rounded-xl bg-primary/5 p-3">
											<p className="text-xs font-bold uppercase tracking-wider text-primary/70">Đáp án · {FIELD_LABELS[asked]}</p>
											<p className="whitespace-pre-wrap break-words font-semibold text-slate-900">{cardField(card, asked)}</p>
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				</section>
			)}
		</div>
	);
}
