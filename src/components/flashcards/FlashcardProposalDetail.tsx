'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Check, GitPullRequestArrow, Loader2, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ErrorState, ListSkeleton } from '@/components/community/States';
import { useAppSelector, useIsStoreHydrated } from '@/lib/store/hooks';
import { useIdentities } from '@/hooks/useIdentities';
import { displayName } from '@/lib/identity-cache';
import { extractApiErrorMessage } from '@/lib/api-errors';
import { formatDateTime, formatRelativeTime } from '@/lib/relative-time';
import {
	FlashcardProposalService,
	type FlashCardProposalDetailResponse,
	unwrapEntity,
} from '@/lib/api/services/FlashcardProposalService';
import {
	PROPOSAL_STATUS,
	summarizeCounts,
	toResolutions,
	unresolvedConflicts,
} from '@/lib/flashcard-proposals';
import { ProposalDiffView } from './ProposalDiffView';

type Decision = 'accept' | 'reject' | 'withdraw';

const DECISION_TEXT: Record<Decision, { title: string; description: string; confirm: string; done: string }> = {
	accept: {
		title: 'Chấp nhận đề xuất?',
		description: 'Các thay đổi sẽ được áp dụng ngay vào bộ thẻ của bạn: thêm thẻ mới, sửa và xoá thẻ như trong đề xuất.',
		confirm: 'Chấp nhận và áp dụng',
		done: 'Đã áp dụng đề xuất vào bộ thẻ',
	},
	reject: {
		title: 'Từ chối đề xuất?',
		description: 'Bộ thẻ của bạn giữ nguyên. Người gửi sẽ nhận được thông báo kèm ghi chú (nếu có).',
		confirm: 'Từ chối',
		done: 'Đã từ chối đề xuất',
	},
	withdraw: {
		title: 'Rút lại đề xuất?',
		description: 'Chủ bộ thẻ sẽ không thể chấp nhận đề xuất này nữa. Bạn có thể gửi đề xuất mới sau.',
		confirm: 'Rút lại',
		done: 'Đã rút lại đề xuất',
	},
};

/** A proposal: its diff, and accept (with a choice per conflicting card) / reject / withdraw. */
export function FlashcardProposalDetail() {
	const router = useRouter();
	const params = useParams();
	const proposalId = params?.proposalId as string;
	const { toast } = useToast();
	const currentUser = useAppSelector(state => state.currUser.current);
	const isHydrated = useIsStoreHydrated();

	const [proposal, setProposal] = useState<FlashCardProposalDetailResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	/** targetCardId -> apply the proposal's version (true) or keep the owner's (false). */
	const [choices, setChoices] = useState<Record<string, boolean | undefined>>({});
	const [decision, setDecision] = useState<Decision | null>(null);
	const [note, setNote] = useState('');
	const [working, setWorking] = useState(false);

	const identities = useIdentities([proposal?.authorId, proposal?.decidedBy]);

	useEffect(() => {
		if (isHydrated && !currentUser) router.push('/auth');
	}, [isHydrated, currentUser, router]);

	const load = useCallback(() => {
		if (!proposalId) return;
		setLoading(true);
		setError(null);
		FlashcardProposalService.getFlashCardProposal(proposalId)
			.then(res => setProposal(unwrapEntity<FlashCardProposalDetailResponse>(res)))
			.catch(err => setError(extractApiErrorMessage(err)))
			.finally(() => setLoading(false));
	}, [proposalId]);

	useEffect(load, [load]);

	const unresolved = useMemo(
		() => (proposal ? unresolvedConflicts(proposal.changes, choices) : []),
		[proposal, choices],
	);

	const runDecision = async () => {
		if (!proposal || !decision) return;
		setWorking(true);
		try {
			if (decision === 'accept') {
				await FlashcardProposalService.acceptFlashCardProposal(proposal.id, {
					resolutions: toResolutions(proposal.changes, choices),
					decisionNote: note.trim() || undefined,
				});
			} else if (decision === 'reject') {
				await FlashcardProposalService.rejectFlashCardProposal(proposal.id, {
					decisionNote: note.trim() || undefined,
				});
			} else {
				await FlashcardProposalService.withdrawFlashCardProposal(proposal.id);
			}
			toast({ title: DECISION_TEXT[decision].done });
			setDecision(null);
			setNote('');
			load();
		} catch (err) {
			toast({ title: 'Thao tác thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
			// The original may have changed meanwhile (new conflicts): show the latest state.
			load();
		} finally {
			setWorking(false);
		}
	};

	if (!isHydrated || !currentUser) return null;

	const status = proposal ? PROPOSAL_STATUS[proposal.status] : null;
	const renderChoice = (targetCardId: string) => (
		<div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-100 pt-3">
			<span className="text-xs font-bold text-amber-800">Bạn muốn:</span>
			{[
				{ apply: true, label: 'Dùng bản đề xuất' },
				{ apply: false, label: 'Giữ bản của tôi' },
			].map(option => (
				<Button
					key={String(option.apply)}
					type="button"
					size="sm"
					variant={choices[targetCardId] === option.apply ? 'default' : 'outline'}
					aria-pressed={choices[targetCardId] === option.apply}
					onClick={() => setChoices(prev => ({ ...prev, [targetCardId]: option.apply }))}
					className="h-8 rounded-lg text-xs font-semibold"
				>
					{option.label}
				</Button>
			))}
		</div>
	);

	return (
		<div className="min-h-screen bg-slate-50/50 pb-20">
			<div className="mx-auto max-w-4xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
				<Button
					variant="ghost"
					onClick={() => router.push(proposal ? `/flashcards/${proposal.targetListId}` : '/flashcards')}
					className="-ml-2 flex items-center gap-2 font-semibold text-slate-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" /> Trở về bộ thẻ
				</Button>

				{loading && !proposal ? (
					<ListSkeleton rows={3} label="Đang tải đề xuất" />
				) : error && !proposal ? (
					<ErrorState message={error} onRetry={load} />
				) : proposal && status ? (
					<>
						<header className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
							<div className="flex flex-wrap items-center gap-2">
								<span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
								<span className="text-xs font-medium text-slate-400">
									{summarizeCounts({
										added: proposal.addedCount,
										modified: proposal.modifiedCount,
										removed: proposal.removedCount,
									})}
								</span>
							</div>
							<div className="flex items-start gap-3">
								<GitPullRequestArrow className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
								<h1 className="text-2xl font-black tracking-tight text-slate-800">{proposal.title}</h1>
							</div>
							<p className="text-sm text-slate-500">
								<span className="font-semibold text-slate-700">{displayName(identities[proposal.authorId])}</span> đề xuất thay đổi cho{' '}
								<Link href={`/flashcards/${proposal.targetListId}`} className="font-bold text-primary hover:underline">
									{proposal.targetListName}
								</Link>
								{proposal.sourceListId && proposal.sourceListName && (
									<>
										{' '}từ bộ{' '}
										<Link href={`/flashcards/${proposal.sourceListId}`} className="font-semibold text-slate-700 hover:underline">
											{proposal.sourceListName}
										</Link>
									</>
								)}{' '}
								· <time dateTime={proposal.createdAt} title={formatDateTime(proposal.createdAt)}>{formatRelativeTime(proposal.createdAt)}</time>
							</p>
							{proposal.message && (
								<p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{proposal.message}</p>
							)}
							{proposal.status !== 'OPEN' && proposal.decidedAt && (
								<div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
									<p>
										{status.label}
										{proposal.decidedBy && proposal.status !== 'WITHDRAWN' && <> bởi <span className="font-semibold">{displayName(identities[proposal.decidedBy])}</span></>}{' '}
										· {formatRelativeTime(proposal.decidedAt)}
									</p>
									{proposal.decisionNote && <p className="mt-1 whitespace-pre-wrap">Ghi chú: {proposal.decisionNote}</p>}
								</div>
							)}
						</header>

						{proposal.canDecide && proposal.conflictCount > 0 && (
							<div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
								<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
								<p>
									Bạn đã sửa {proposal.conflictCount} thẻ sau khi đề xuất được gửi. Hãy chọn giữ bản của bạn hay dùng bản đề xuất
									cho từng thẻ được đánh dấu trước khi chấp nhận.
								</p>
							</div>
						)}

						<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
							<ProposalDiffView changes={proposal.changes} renderChoice={proposal.canDecide ? renderChoice : undefined} />
						</section>

						{(proposal.canDecide || proposal.canWithdraw) && (
							<div className="flex flex-wrap justify-end gap-2">
								{proposal.canWithdraw && (
									<Button variant="outline" onClick={() => setDecision('withdraw')} className="rounded-xl font-semibold">
										<Undo2 className="mr-2 h-4 w-4" /> Rút lại
									</Button>
								)}
								{proposal.canDecide && (
									<>
										<Button
											variant="outline"
											onClick={() => setDecision('reject')}
											className="rounded-xl border-rose-200 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
										>
											<X className="mr-2 h-4 w-4" /> Từ chối
										</Button>
										<Button
											onClick={() => setDecision('accept')}
											disabled={unresolved.length > 0}
											title={unresolved.length > 0 ? `Còn ${unresolved.length} thẻ xung đột chưa chọn cách xử lý` : undefined}
											className="rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
										>
											<Check className="mr-2 h-4 w-4" /> Chấp nhận
										</Button>
									</>
								)}
							</div>
						)}
					</>
				) : null}
			</div>

			<Dialog open={decision !== null} onOpenChange={open => !working && !open && setDecision(null)}>
				{decision && (
					<DialogContent className="rounded-2xl sm:max-w-md">
						<DialogHeader>
							<DialogTitle>{DECISION_TEXT[decision].title}</DialogTitle>
							<DialogDescription>{DECISION_TEXT[decision].description}</DialogDescription>
						</DialogHeader>
						{decision !== 'withdraw' && (
							<div className="space-y-2">
								<Label htmlFor="decision-note" className="font-bold text-slate-700">Ghi chú cho người gửi (không bắt buộc)</Label>
								<Textarea
									id="decision-note"
									value={note}
									maxLength={2000}
									rows={3}
									onChange={e => setNote(e.target.value)}
									className="resize-none rounded-xl border-slate-200 bg-slate-50"
								/>
							</div>
						)}
						<DialogFooter className="gap-2">
							<Button variant="outline" onClick={() => setDecision(null)} disabled={working} className="rounded-xl">
								Hủy
							</Button>
							<Button
								onClick={runDecision}
								disabled={working}
								className={`rounded-xl font-bold ${decision === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700' : decision === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
							>
								{working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{DECISION_TEXT[decision].confirm}
							</Button>
						</DialogFooter>
					</DialogContent>
				)}
			</Dialog>
		</div>
	);
}
