'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { addFlashcardList } from '@/components/store/flashcardListSlice';
import { useAppDispatch } from '@/lib/store/hooks';
import { extractApiErrorMessage } from '@/lib/api-errors';
import type { FlashCardListResponse } from '@/lib/api/services/FlashcardListService';
import { FlashcardProposalService, unwrapEntity } from '@/lib/api/services/FlashcardProposalService';
import { cn } from '@/components/ui/utils';

/**
 * "Lưu về bộ của tôi": saves a private copy of someone else's public list, then opens the copy
 * (which the user can edit without touching the original).
 */
export function ForkListButton({
	listId,
	className,
	size = 'default',
}: {
	listId: string;
	className?: string;
	size?: 'default' | 'sm' | 'lg';
}) {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { toast } = useToast();
	const [saving, setSaving] = useState(false);

	const handleFork = async (e: React.MouseEvent) => {
		e.stopPropagation();
		setSaving(true);
		try {
			const copy = unwrapEntity<FlashCardListResponse>(await FlashcardProposalService.forkFlashCardList(listId));
			dispatch(
				addFlashcardList({
					id: copy.id,
					authorId: copy.authorId,
					name: copy.name,
					description: copy.description || undefined,
					isPublic: copy.isPublic,
					tags: copy.tags ?? [],
					createdAt: new Date(copy.createdAt).getTime(),
					forkedFromId: copy.forkedFromId,
					forkedFromName: copy.forkedFromName,
					forkedFromAuthorId: copy.forkedFromAuthorId,
					forkCount: copy.forkCount ?? 0,
				}),
			);
			toast({
				title: 'Đã lưu về bộ của bạn',
				description: `Bạn có thể chỉnh sửa “${copy.name}” mà không ảnh hưởng tới bản gốc.`,
			});
			router.push(`/flashcards/${copy.id}`);
		} catch (err) {
			toast({ title: 'Không thể lưu bộ thẻ', description: extractApiErrorMessage(err), variant: 'destructive' });
		} finally {
			setSaving(false);
		}
	};

	return (
		<Button
			type="button"
			size={size}
			variant="outline"
			onClick={handleFork}
			disabled={saving}
			className={cn('rounded-xl border-emerald-200 bg-white font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800', className)}
		>
			{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
			Lưu về bộ của tôi
		</Button>
	);
}
