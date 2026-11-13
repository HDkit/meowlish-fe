'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, GitPullRequestArrow, Loader2, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useIdentities } from '@/hooks/useIdentities';
import { displayName } from '@/lib/identity-cache';
import { extractApiErrorMessage } from '@/lib/api-errors';
import type { FlashCardListDetailResponse } from '@/lib/api/services/FlashcardListService';
import {
	FlashcardProposalService,
	type PullUpstreamResponse,
	unwrapEntity,
} from '@/lib/api/services/FlashcardProposalService';
import { lineageText, proposePath, pullResultMessage } from '@/lib/flashcard-proposals';
import { FlashcardProposalList } from './FlashcardProposalList';
import { ForkListButton } from './ForkListButton';

/**
 * Copy-related parts of a list's page: where a copy came from, "Lưu về bộ của tôi" on others'
 * public lists, "Đề xuất thay đổi" / "Cập nhật từ bản gốc" on the user's copies, and proposals
 * (received on the user's lists, sent from the user's copies).
 */
export function FlashcardForkPanel({
	list,
	isOwnList,
	onPulled,
}: {
	list: FlashCardListDetailResponse;
	isOwnList: boolean;
	/** Called after the copy was updated from its original (reload the cards). */
	onPulled?: () => void;
}) {
	const { toast } = useToast();
	const [pullOpen, setPullOpen] = useState(false);
	const [pulling, setPulling] = useState(false);
	const originAuthor = useIdentities([list.forkedFromAuthorId])[list.forkedFromAuthorId ?? ''];

	const lineage = lineageText(list, list.forkedFromAuthorId ? displayName(originAuthor) : undefined);
	const isOwnCopy = isOwnList && !!list.forkedFromName;
	const canUseOriginal = isOwnCopy && !!list.forkedFromId && !!list.upstreamAvailable;
	const forkCount = list.forkCount ?? 0;
	const openProposals = list.openProposalCount ?? 0;

	const handlePull = async () => {
		setPulling(true);
		try {
			const result = unwrapEntity<PullUpstreamResponse>(
				await FlashcardProposalService.pullFlashCardListUpstream(list.id),
			);
			toast({ title: 'Đã cập nhật từ bản gốc', description: pullResultMessage(result) });
			setPullOpen(false);
			onPulled?.();
		} catch (err) {
			toast({ title: 'Không thể cập nhật từ bản gốc', description: extractApiErrorMessage(err), variant: 'destructive' });
		} finally {
			setPulling(false);
		}
	};

	const hasActions = (!isOwnList && list.isPublic) || canUseOriginal;
	if (!lineage && !hasActions && !isOwnList && openProposals === 0 && forkCount === 0) return null;

	return (
		<div className="space-y-4">
			{(lineage || hasActions || forkCount > 0 || openProposals > 0) && (
				<div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
					<div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
						{lineage && (
							<span className="inline-flex min-w-0 items-center gap-1.5">
								<Copy className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
								{list.forkedFromId && list.upstreamAvailable ? (
									<Link href={`/flashcards/${list.forkedFromId}`} className="truncate font-medium hover:text-primary hover:underline">
										{lineage}
									</Link>
								) : (
									<span className="truncate">
										{lineage} <span className="text-slate-400">(bản gốc không còn khả dụng)</span>
									</span>
								)}
							</span>
						)}
						{forkCount > 0 && (
							<span className="inline-flex items-center gap-1.5">
								<Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
								{forkCount} lượt lưu bản sao
							</span>
						)}
						{openProposals > 0 && (
							<a href="#proposals" className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100">
								<GitPullRequestArrow className="h-3.5 w-3.5" aria-hidden="true" />
								{openProposals} đề xuất đang chờ duyệt
							</a>
						)}
					</div>
					{hasActions && (
						<div className="flex shrink-0 flex-wrap gap-2">
							{!isOwnList && list.isPublic && <ForkListButton listId={list.id} />}
							{canUseOriginal && (
								<>
									<Button variant="outline" onClick={() => setPullOpen(true)} className="rounded-xl font-semibold">
										<RefreshCw className="mr-2 h-4 w-4" /> Cập nhật từ bản gốc
									</Button>
									<Button asChild className="rounded-xl font-semibold">
										<Link href={proposePath(list.id)}>
											<GitPullRequestArrow className="mr-2 h-4 w-4" /> Đề xuất thay đổi cho bản gốc
										</Link>
									</Button>
								</>
							)}
						</div>
					)}
				</div>
			)}

			<div id="proposals" className="space-y-4 scroll-mt-24">
				{(isOwnList || openProposals > 0) && (
					<FlashcardProposalList title="Đề xuất cho bộ thẻ này" query={{ targetListId: list.id }} />
				)}
				{isOwnCopy && (
					<FlashcardProposalList title="Đề xuất bạn đã gửi" query={{ sourceListId: list.id, mine: true }} showTarget />
				)}
			</div>

			<AlertDialog open={pullOpen} onOpenChange={open => !pulling && setPullOpen(open)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cập nhật từ bản gốc?</AlertDialogTitle>
						<AlertDialogDescription>
							Các thẻ bản gốc đã sửa sẽ được cập nhật, thẻ mới sẽ được thêm và thẻ bản gốc đã xoá sẽ bị xoá khỏi bộ của bạn.
							Những thẻ bạn đã tự sửa được giữ nguyên.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={pulling}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={e => {
								e.preventDefault();
								void handlePull();
							}}
							disabled={pulling}
						>
							{pulling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Cập nhật
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
