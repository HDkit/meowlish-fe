'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, GitPullRequestArrow, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FieldError, FormErrorSummary, fieldA11y } from '@/components/ui/form-feedback';
import { useToast } from '@/components/ui/use-toast';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/community/States';
import { useAppSelector, useIsStoreHydrated } from '@/lib/store/hooks';
import { useIdentities } from '@/hooks/useIdentities';
import { displayName } from '@/lib/identity-cache';
import { extractApiErrorMessage, normalizeApiError } from '@/lib/api-errors';
import {
	FlashcardProposalService,
	type FlashCardListDiffResponse,
	type FlashCardProposalResponse,
	unwrapEntity,
} from '@/lib/api/services/FlashcardProposalService';
import { countChanges, proposalPath, summarizeChanges } from '@/lib/flashcard-proposals';
import { ProposalDiffView } from './ProposalDiffView';

/** "Đề xuất thay đổi cho bản gốc": review the copy's diff, then send it with a title and message. */
export function FlashcardProposeChanges() {
	const router = useRouter();
	const params = useParams();
	const forkId = params?.listId as string;
	const { toast } = useToast();
	const currentUser = useAppSelector(state => state.currUser.current);
	const isHydrated = useIsStoreHydrated();

	const [diff, setDiff] = useState<FlashCardListDiffResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [title, setTitle] = useState('');
	const [message, setMessage] = useState('');
	const [titleError, setTitleError] = useState('');
	const [formErrors, setFormErrors] = useState<string[]>([]);
	const [sending, setSending] = useState(false);

	const owner = useIdentities([diff?.targetOwnerId])[diff?.targetOwnerId ?? ''];

	useEffect(() => {
		if (isHydrated && !currentUser) router.push('/auth');
	}, [isHydrated, currentUser, router]);

	const load = useCallback(() => {
		if (!forkId) return;
		setLoading(true);
		setError(null);
		FlashcardProposalService.getFlashCardListDiff(forkId)
			.then(res => setDiff(unwrapEntity<FlashCardListDiffResponse>(res)))
			.catch(err => setError(extractApiErrorMessage(err)))
			.finally(() => setLoading(false));
	}, [forkId]);

	useEffect(load, [load]);

	const handleSubmit = async () => {
		if (!title.trim()) {
			setTitleError('Vui lòng nhập tiêu đề đề xuất');
			return;
		}
		setSending(true);
		setFormErrors([]);
		try {
			const created = unwrapEntity<FlashCardProposalResponse>(
				await FlashcardProposalService.createFlashCardProposal(forkId, {
					title: title.trim(),
					message: message.trim() || undefined,
				}),
			);
			toast({ title: 'Đã gửi đề xuất', description: 'Chủ bộ thẻ sẽ nhận được thông báo để xem xét.' });
			router.push(proposalPath(created.targetListId, created.id));
		} catch (err) {
			const { messages, fieldErrors } = normalizeApiError(err, {
				fallback: 'Không thể gửi đề xuất',
				fields: { title: 'title' },
				labels: { title: 'Tiêu đề', message: 'Lời nhắn' },
			});
			setTitleError(fieldErrors.title ?? '');
			setFormErrors(messages);
		} finally {
			setSending(false);
		}
	};

	if (!isHydrated || !currentUser) return null;

	return (
		<div className="min-h-screen bg-slate-50/50 pb-20">
			<div className="mx-auto max-w-4xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
				<Button
					variant="ghost"
					onClick={() => router.push(`/flashcards/${forkId}`)}
					className="-ml-2 flex items-center gap-2 font-semibold text-slate-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" /> Trở về bộ của bạn
				</Button>

				<header className="flex items-start gap-4">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<GitPullRequestArrow className="h-6 w-6" />
					</div>
					<div className="min-w-0">
						<h1 className="text-2xl font-black tracking-tight text-slate-800 md:text-3xl">Đề xuất thay đổi cho bản gốc</h1>
						{diff && (
							<p className="mt-1 text-sm font-medium text-slate-500">
								Gửi tới{' '}
								<Link href={`/flashcards/${diff.targetListId}`} className="font-bold text-primary hover:underline">
									{diff.targetListName}
								</Link>{' '}
								của {displayName(owner)}. Chủ bộ thẻ sẽ xem từng thay đổi và quyết định có áp dụng hay không.
							</p>
						)}
					</div>
				</header>

				{loading && !diff ? (
					<ListSkeleton rows={3} label="Đang so sánh với bản gốc" />
				) : error ? (
					<ErrorState message={error} onRetry={load} />
				) : diff && diff.openProposalId ? (
					<EmptyState icon={<GitPullRequestArrow className="size-6" />} title="Bạn đã có một đề xuất đang chờ duyệt">
						<p>Hãy chờ chủ bộ thẻ xử lý, hoặc rút lại đề xuất đó trước khi gửi đề xuất mới.</p>
						<Button asChild variant="outline" className="mt-4 rounded-xl">
							<Link href={proposalPath(diff.targetListId, diff.openProposalId)}>Xem đề xuất</Link>
						</Button>
					</EmptyState>
				) : diff && countChanges(diff.changes) === 0 ? (
					<EmptyState icon={<GitPullRequestArrow className="size-6" />} title="Chưa có thay đổi nào">
						Bộ của bạn đang giống bản gốc. Hãy thêm, sửa hoặc xoá thẻ trong bộ của bạn rồi quay lại đây.
					</EmptyState>
				) : diff ? (
					<>
						<section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
							<h2 className="font-bold text-slate-800">Thay đổi so với bản gốc</h2>
							<p className="text-sm text-slate-500">{summarizeChanges(diff.changes)}</p>
							<ProposalDiffView changes={diff.changes} />
						</section>

						<section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
							<div className="space-y-2">
								<Label htmlFor="proposal-title" className="font-bold text-slate-700">
									Tiêu đề <span className="text-red-500">*</span>
								</Label>
								<Input
									{...fieldA11y('proposal-title', titleError)}
									value={title}
									maxLength={200}
									placeholder="VD: Bổ sung ví dụ cho các từ chủ đề môi trường"
									onChange={e => {
										setTitle(e.target.value);
										if (titleError) setTitleError('');
									}}
									className="h-11 rounded-xl border-slate-200 bg-slate-50 aria-[invalid=true]:border-destructive"
								/>
								<FieldError id="proposal-title" message={titleError} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="proposal-message" className="font-bold text-slate-700">Lời nhắn</Label>
								<Textarea
									id="proposal-message"
									value={message}
									maxLength={5000}
									rows={4}
									placeholder="Giải thích vì sao những thay đổi này hữu ích…"
									onChange={e => setMessage(e.target.value)}
									className="resize-none rounded-xl border-slate-200 bg-slate-50"
								/>
							</div>
							<FormErrorSummary messages={formErrors} />
							<div className="flex justify-end">
								<Button onClick={handleSubmit} disabled={sending} className="rounded-xl px-6 font-bold">
									{sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
									Gửi đề xuất
								</Button>
							</div>
						</section>
					</>
				) : null}
			</div>
		</div>
	);
}
