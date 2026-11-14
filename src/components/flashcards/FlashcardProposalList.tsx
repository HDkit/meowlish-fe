'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, GitPullRequestArrow } from 'lucide-react';
import { ErrorState, ListSkeleton } from '@/components/community/States';
import { useIdentities } from '@/hooks/useIdentities';
import { displayName } from '@/lib/identity-cache';
import { extractApiErrorMessage } from '@/lib/api-errors';
import { formatRelativeTime } from '@/lib/relative-time';
import {
	FlashcardProposalService,
	type FlashCardProposalResponse,
	type ListFlashCardProposalsQuery,
	type ListFlashCardProposalsResponse,
	unwrapEntity,
} from '@/lib/api/services/FlashcardProposalService';
import { PROPOSAL_STATUS, proposalPath, summarizeCounts } from '@/lib/flashcard-proposals';

/**
 * Proposals on a list (to its owner) or from a copy (the user's own). Renders nothing while there
 * are none, so lists without proposals stay uncluttered.
 */
export function FlashcardProposalList({
	title,
	query,
	showTarget = false,
}: {
	title: string;
	query: Pick<ListFlashCardProposalsQuery, 'targetListId' | 'sourceListId' | 'mine'>;
	/** Show which original each proposal targets (for a copy's own proposals). */
	showTarget?: boolean;
}) {
	const [onlyOpen, setOnlyOpen] = useState(true);
	const [proposals, setProposals] = useState<FlashCardProposalResponse[] | null>(null);
	const [total, setTotal] = useState(0);
	const [hasAny, setHasAny] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { targetListId, sourceListId, mine } = query;

	const load = useCallback(() => {
		setError(null);
		FlashcardProposalService.listFlashCardProposals({
			targetListId,
			sourceListId,
			mine,
			status: onlyOpen ? 'OPEN' : undefined,
			limit: 20,
		})
			.then(res => {
				const data = unwrapEntity<ListFlashCardProposalsResponse>(res);
				setProposals(data.proposals ?? []);
				setTotal(data.totalCount ?? 0);
				if ((data.totalCount ?? 0) > 0) setHasAny(true);
			})
			.catch(err => setError(extractApiErrorMessage(err)));
	}, [targetListId, sourceListId, mine, onlyOpen]);

	useEffect(load, [load]);

	const identities = useIdentities((proposals ?? []).map(p => p.authorId));

	// Nothing to show: no open proposals, and the user never switched to "all".
	if (!error && proposals !== null && total === 0 && onlyOpen && !hasAny) return null;

	return (
		<section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="flex items-center gap-2 font-bold text-slate-800">
					<GitPullRequestArrow className="h-5 w-5 text-primary" aria-hidden="true" />
					{title}
					<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{total}</span>
				</h2>
				<div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
					{[
						{ open: true, label: 'Đang chờ' },
						{ open: false, label: 'Tất cả' },
					].map(tab => (
						<button
							key={tab.label}
							type="button"
							onClick={() => setOnlyOpen(tab.open)}
							aria-pressed={onlyOpen === tab.open}
							className={`rounded-lg px-3 py-1.5 transition-colors ${onlyOpen === tab.open ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{error ? (
				<ErrorState message={error} onRetry={load} />
			) : proposals === null ? (
				<ListSkeleton rows={2} label="Đang tải đề xuất" />
			) : proposals.length === 0 ? (
				<p className="py-4 text-center text-sm text-slate-500">
					{onlyOpen ? 'Không có đề xuất nào đang chờ duyệt.' : 'Chưa có đề xuất nào.'}
				</p>
			) : (
				<ul className="divide-y divide-slate-100">
					{proposals.map(p => {
						const status = PROPOSAL_STATUS[p.status];
						return (
							<li key={p.id}>
								<Link
									href={proposalPath(p.targetListId, p.id)}
									className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate font-semibold text-slate-800">{p.title}</p>
										<p className="mt-0.5 truncate text-xs text-slate-500">
											{showTarget ? `Tới “${p.targetListName}”` : displayName(identities[p.authorId])}
											{' · '}
											{summarizeCounts({ added: p.addedCount, modified: p.modifiedCount, removed: p.removedCount })}
											{' · '}
											{formatRelativeTime(p.createdAt)}
										</p>
									</div>
									{status && (
										<span className={`shrink-0 rounded-lg border px-2 py-0.5 text-xs font-bold ${status.className}`}>
											{status.label}
										</span>
									)}
									<ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
