'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch, useIsStoreHydrated } from '@/lib/store/hooks';
import { FlashCard } from '../types/client';
import { TagInput } from './TagInput';
import { FlashcardService } from '@/lib/api/services/FlashcardService';
import { FlashcardListService, type FlashCardListDetailResponse } from '@/lib/api/services/FlashcardListService';
import { FlashcardForkPanel } from './flashcards/FlashcardForkPanel';
import { ReportDialog } from './ReportDialog';
import { addFlashcardList } from './store/flashcardListSlice';
import { useToast } from '@/components/ui/use-toast';
import { extractApiErrorMessage, normalizeApiError } from '@/lib/api-errors';
import { FieldError, FormErrorSummary, fieldA11y } from './ui/form-feedback';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { LoadingRegion } from './skeletons';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import {
	Plus,
	Search,
	Edit,
	Trash2,
	BookOpen,
	Filter,
	X,
	Folder,
	ArrowLeft,
	Flag,
	Loader2,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

function mapFlashCard(fc: any, listId: string): FlashCard {
	return {
		id: fc.id,
		word: fc.word,
		definition: fc.definition,
		image: fc.image,
		partOfSpeech: fc.partOfSpeech,
		pronunciation: fc.pronunciation,
		examples: fc.examples ?? [],
		notes: fc.notes,
		authorId: fc.authorId,
		tags: fc.tags ?? [],
		listId,
		createdAt: new Date(fc.createdAt).getTime(),
		updatedAt: fc.updatedAt ? new Date(fc.updatedAt).getTime() : undefined,
	};
}

// Header + toolbar + card grid placeholder, shaped like the loaded page below
function FlashcardListDetailSkeleton() {
	return (
		<LoadingRegion label="Đang tải bộ flashcard…" className="min-h-screen bg-slate-50/50 pb-20">
			<div className="bg-white border-b border-gray-200 mb-8 pt-6 pb-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mb-6 flex items-center justify-between">
						<Skeleton className="h-9 w-64 max-w-[60%]" />
						<Skeleton className="h-9 w-24" />
					</div>
					<div className="flex flex-col md:flex-row items-center justify-between gap-6">
						<div className="flex items-center gap-5">
							<Skeleton className="size-16 shrink-0 rounded-2xl" />
							<div className="space-y-3">
								<Skeleton className="h-9 w-72 max-w-[60vw]" />
								<Skeleton className="h-7 w-32 rounded-full" />
							</div>
						</div>
						<Skeleton className="h-14 w-48 rounded-xl" />
					</div>
				</div>
			</div>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
				<div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
					<Skeleton className="h-12 flex-1 rounded-xl" />
					<Skeleton className="h-12 w-full rounded-xl sm:w-56" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
					{Array.from({ length: 6 }, (_, i) => (
						<div key={i} className="flex min-h-[18rem] flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
							<div className="flex gap-1.5">
								<Skeleton className="h-5 w-16 rounded-full" />
								<Skeleton className="h-5 w-12 rounded-full" />
							</div>
							<div className="flex flex-1 flex-col items-center justify-center gap-3">
								<Skeleton className="h-8 w-1/2" />
								<Skeleton className="h-4 w-1/3" />
							</div>
						</div>
					))}
				</div>
			</div>
		</LoadingRegion>
	);
}

function FlashcardCard({
	flashcard,
	tagNames,
	editable,
	onEdit,
	onDelete,
	onReport,
}: {
	flashcard: FlashCard;
	tagNames?: string[];
	editable?: boolean;
	onEdit: () => void;
	onDelete: () => void;
	onReport: () => void;
}) {
	const [isFlipped, setIsFlipped] = useState(false);

	return (
		<Card
			className={`group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[18rem] h-full flex flex-col border-0 shadow-sm rounded-2xl overflow-hidden relative ${isFlipped ? 'bg-primary text-white' : 'bg-white ring-1 ring-slate-200/50'}`}
			onClick={() => setIsFlipped(!isFlipped)}
		>
			<CardContent className="p-6 flex-1 flex flex-col relative z-10">
				{!isFlipped && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>}
				{isFlipped && <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>}

				<div className="flex items-start justify-between mb-4 relative z-20">
					<div className="flex flex-wrap items-center gap-1.5">
						{(tagNames ?? []).slice(0, 3).map((tagName) => (
							<Badge key={tagName} variant="outline" className={`text-xs font-semibold ${isFlipped ? 'bg-white/20 border-white/30 text-white' : 'bg-primary/10 text-primary border-primary/30'}`}>
								{tagName}
							</Badge>
						))}
						{(tagNames?.length ?? 0) > 3 && (
							<Badge variant="outline" className={`text-xs font-semibold ${isFlipped ? 'bg-white/10 border-white/20 text-white/80' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
								+{(tagNames?.length ?? 0) - 3}
							</Badge>
						)}
					</div>
					{editable && (
						<div className={`flex items-center gap-1.5 transition-opacity relative z-50 ${isFlipped ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
							<Button
								variant={isFlipped ? 'ghost' : 'outline'}
								size="icon"
								className={`h-8 w-8 rounded-lg shadow-sm ${isFlipped ? 'text-white hover:bg-white/20' : 'bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50'}`}
								onClick={(e) => { e.stopPropagation(); onReport(); }}
							>
								<Flag className="h-4 w-4" />
							</Button>
							<Button
								variant={isFlipped ? 'ghost' : 'outline'}
								size="icon"
								className={`h-8 w-8 rounded-lg shadow-sm ${isFlipped ? 'text-white hover:bg-white/20' : 'bg-white border-slate-200 text-slate-500 hover:text-primary hover:bg-primary/10'}`}
								onClick={(e) => { e.stopPropagation(); onEdit(); }}
							>
								<Edit className="h-4 w-4" />
							</Button>
							<Button
								variant={isFlipped ? 'ghost' : 'outline'}
								size="icon"
								className={`h-8 w-8 rounded-lg shadow-sm ${isFlipped ? 'text-rose-200 hover:text-rose-100 hover:bg-rose-500/30' : 'bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`}
								onClick={(e) => { e.stopPropagation(); onDelete(); }}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>

				<div className="flex-1 flex items-center justify-center relative z-10 overflow-hidden py-4">
					<div className="text-center w-full max-h-full overflow-y-auto custom-scrollbar">
						{isFlipped ? (
							<div className="space-y-3 px-2">
								<p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/60">Định nghĩa</p>
								<p className="text-lg font-medium text-white whitespace-pre-wrap leading-relaxed">
									{flashcard.definition}
								</p>
								{flashcard.notes && (
									<>
										<p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/60 mt-4">Ghi chú</p>
										<p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
											{flashcard.notes}
										</p>
									</>
								)}
							</div>
						) : (
							<div className="px-2">
								<p className="text-3xl font-extrabold text-slate-800 tracking-tight">
									{flashcard.word}
								</p>
								{flashcard.pronunciation && (
									<p className="text-sm text-slate-400 mt-2 italic">{flashcard.pronunciation}</p>
								)}
							</div>
						)}
					</div>
				</div>

				<div className={`mt-4 pt-4 text-center border-t relative z-10 ${isFlipped ? 'border-white/20' : 'border-slate-100'}`}>
					<p className={`text-xs font-bold uppercase tracking-widest ${isFlipped ? 'text-primary-foreground/60' : 'text-slate-400'}`}>
						{isFlipped ? 'Nhấn thẻ để lật lại' : 'Nhấn thẻ xem định nghĩa'}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

function FlashcardDialog({
	open,
	onOpenChange,
	flashcard,
	onSave,
	tagSuggestions,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	flashcard?: FlashCard;
	/** Rejects on failure: the dialog then shows the error and stays open. */
	onSave: (data: { word: string; definition: string; notes: string; tags: string[] }) => Promise<void>;
	/** Tags already used in this list, offered next to the exam tags. */
	tagSuggestions?: string[];
}) {
	const [word, setWord] = useState('');
	const [definition, setDefinition] = useState('');
	const [notes, setNotes] = useState('');
	const [saving, setSaving] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [formErrors, setFormErrors] = useState<string[]>([]);
	// tag NAMES (the resource service stores free-text tags)
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

	useEffect(() => {
		if (flashcard) {
			setWord(flashcard.word);
			setDefinition(flashcard.definition);
			setNotes(flashcard.notes || '');
			setSelectedTagIds(flashcard.tags ?? []);
		} else {
			setWord('');
			setDefinition('');
			setNotes('');
			setSelectedTagIds([]);
		}
		setFieldErrors({});
		setFormErrors([]);
	}, [flashcard, open]);

	const clearFieldError = (field: string) =>
		setFieldErrors((prev) => {
			if (!prev[field]) return prev;
			const { [field]: _, ...rest } = prev;
			return rest;
		});

	const applyTemplate = (field: 'definition' | 'notes') => {
		if (field === 'definition') {
			setDefinition(`(n/v/adj) Nghĩa tiếng Việt
Synonym: ...
Antonym: ...`);
		} else {
			setNotes(`Ví dụ 1: ...
Ví dụ 2: ...
Cách nhớ: ...
Lưu ý: ...`);
		}
	};

	const handleSave = async () => {
		const missing: Record<string, string> = {};
		if (!word.trim()) missing.word = 'Vui lòng nhập từ hoặc cụm từ';
		if (!definition.trim()) missing.definition = 'Vui lòng nhập định nghĩa';
		setFieldErrors(missing);
		setFormErrors([]);
		if (Object.keys(missing).length > 0) return;
		setSaving(true);
		try {
			await onSave({ word: word.trim(), definition: definition.trim(), notes: notes.trim(), tags: selectedTagIds });
			onOpenChange(false);
		} catch (err) {
			const res = normalizeApiError(err, {
				fallback: 'Không thể lưu thẻ ghi nhớ',
				fields: { word: 'word', definition: 'definition', notes: 'notes' },
			});
			setFieldErrors(res.fieldErrors);
			setFormErrors(res.messages);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
			<DialogContent hideCloseButton className="bg-white rounded-2xl border-0 shadow-2xl overflow-hidden sm:max-w-lg p-0 max-h-[min(90vh,calc(100dvh-2rem))] flex flex-col">
				<div className="h-2 w-full bg-primary"></div>
				<DialogHeader className="px-6 pt-6 pb-2">
					<DialogTitle className="text-xl font-bold text-slate-800">
						{flashcard ? 'Cập Nhật Flashcard' : 'Thêm Flashcard Mới'}
					</DialogTitle>
					<DialogDescription className="text-slate-500 font-medium">
						{flashcard
							? 'Chỉnh sửa mặt trước và mặt sau của thẻ học.'
							: 'Thêm một thẻ ghi nhớ mới để học từ vựng hay ngữ pháp hiệu quả.'}
					</DialogDescription>
				</DialogHeader>
				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
					<div className="space-y-2">
						<Label htmlFor="word" className="text-slate-700 font-bold">Từ / Cụm từ (Mặt trước) <span className="text-red-500">*</span></Label>
						<Input
							{...fieldA11y('word', fieldErrors.word)}
							placeholder="VD: Aberration, Present Perfect..."
							value={word}
							onChange={(e) => {
								setWord(e.target.value);
								clearFieldError('word');
							}}
							className="bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl h-11 aria-[invalid=true]:border-destructive"
						/>
						<FieldError id="word" message={fieldErrors.word} className="-mt-2" />
					</div>
					<div className="space-y-2">
					<div className="flex items-center justify-between">
							<Label htmlFor="definition" className="text-slate-700 font-bold">Định nghĩa <span className="text-red-500">*</span></Label>
							{!flashcard && !definition && (
								<button type="button" onClick={() => applyTemplate('definition')} className="text-xs text-primary hover:underline font-medium">
									Dùng mẫu
								</button>
							)}
						</div>
						<Textarea
							{...fieldA11y('definition', fieldErrors.definition)}
							placeholder="Nghĩa của từ hoặc cụm từ..."
							value={definition}
							onChange={(e) => {
								setDefinition(e.target.value);
								clearFieldError('definition');
							}}
							rows={3}
							className="bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl resize-none aria-[invalid=true]:border-destructive"
						/>
						<FieldError id="definition" message={fieldErrors.definition} className="-mt-2" />
					</div>
					<div className="space-y-2">
					<div className="flex items-center justify-between">
							<Label htmlFor="notes" className="text-slate-700 font-bold">Ghi chú</Label>
							{!flashcard && !notes && (
								<button type="button" onClick={() => applyTemplate('notes')} className="text-xs text-primary hover:underline font-medium">
									Dùng mẫu
								</button>
							)}
						</div>
						<Textarea
							{...fieldA11y('notes', fieldErrors.notes)}
							placeholder="Ví dụ minh hoạ, ghi chú thêm..."
							value={notes}
							onChange={(e) => {
								setNotes(e.target.value);
								clearFieldError('notes');
							}}
							rows={3}
							className="bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl resize-none"
						/>
						<FieldError id="notes" message={fieldErrors.notes} className="-mt-2" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="card-tags" className="text-slate-700 font-bold">Tags</Label>
						<TagInput
							id="card-tags"
							value={selectedTagIds}
							onChange={setSelectedTagIds}
							suggestions={tagSuggestions}
							placeholder="Nhập tag, chọn gợi ý rồi nhấn Enter…"
						/>
					</div>
					<FormErrorSummary messages={formErrors} />
				</div>
				<DialogFooter className="shrink-0 px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex gap-2 justify-end">
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="rounded-xl border-slate-200 hover:bg-slate-100 font-bold text-slate-600">
						Hủy
					</Button>
					<Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md hover:-translate-y-0.5 transition-all font-bold px-6">
						{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						{flashcard ? 'Lưu Thay Đổi' : 'Tạo Mới'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function FlashcardListDetail() {
	const router = useRouter();
	const params = useParams();
	const dispatch = useAppDispatch();
	const currentUser = useAppSelector((state) => state.currUser.current);
	const isHydrated = useIsStoreHydrated();
	const lists = useAppSelector((state) => state.flashcardLists.list);
	const tags = useAppSelector((state) => state.tags.list);
	const { toast } = useToast();

	const listId = params?.listId as string;

	const [cards, setCards] = useState<FlashCard[]>([]);
	const [loading, setLoading] = useState(true);
	/** The list as fetched (lineage, fork count, proposals), for the copy/proposal panel. */
	const [listMeta, setListMeta] = useState<FlashCardListDetailResponse | null>(null);
	/** Bumped to reload the cards (after pulling from the original). */
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		if (!isHydrated) return;
		if (!currentUser) {
			router.push('/auth');
		}
	}, [isHydrated, currentUser, router]);

	const [cardPage, setCardPage] = useState(1);
	const [cardTotalCount, setCardTotalCount] = useState(0);
	const cardLimit = 24;

	useEffect(() => {
		if (!listId) return;
		setLoading(true);
		Promise.all([
			FlashcardListService.getFlashCardList(listId),
			FlashcardListService.listCardsInList(listId, cardPage, cardLimit),
		])
			.then(([listRes, cardsRes]) => {
				const listData = (listRes as any)?.data ?? listRes;
				setListMeta(listData);
				if (!lists.find((l) => l.id === listId) && listData.id) {
					dispatch(addFlashcardList({
						id: listData.id,
						authorId: listData.authorId,
						name: listData.name,
						description: listData.description || undefined,
						isPublic: listData.isPublic,
						tags: listData.tags ?? [],
						createdAt: new Date(listData.createdAt).getTime(),
					}));
				}
				const cardsData = (cardsRes as any)?.data ?? cardsRes;
				setCards((cardsData.flashCards ?? []).map((fc: any) => mapFlashCard(fc, listId)));
				setCardTotalCount(cardsData.totalCount ?? 0);
			})
			.catch((err) => {
				console.error('[FlashcardListDetail] fetch error:', err);
				toast({ title: 'Tải danh sách thẻ thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
			})
			.finally(() => setLoading(false));
	}, [listId, cardPage, reloadKey]);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTagId, setSelectedTagId] = useState<string>('__all__');
	const [reportOpen, setReportOpen] = useState(false);
	const [reportFlashcardId, setReportFlashcardId] = useState<string | null>(null);
	const [flashcardDialogOpen, setFlashcardDialogOpen] = useState(false);
	const [editingFlashcard, setEditingFlashcard] = useState<FlashCard | undefined>();

	const currentList = useMemo(() => {
		return lists.find((l) => l.id === listId);
	}, [lists, listId]);

	const isOwnList = currentList?.authorId === currentUser?.id;

	const filteredFlashcards = useMemo(() => {
		let filtered = cards;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(f) =>
					f.word.toLowerCase().includes(q) ||
					f.definition.toLowerCase().includes(q) ||
					f.notes?.toLowerCase().includes(q)
			);
		}
		if (selectedTagId && selectedTagId !== '__all__') {
			filtered = filtered.filter((f) => f.tags.includes(selectedTagId));
		}
		return filtered;
	}, [cards, searchQuery, selectedTagId]);

	/** The tags used on this list's cards (free-text names), for the filter and suggestions. */
	const cardTagNames = useMemo(
		() => [...new Set(cards.flatMap((c) => c.tags ?? []))].sort((a, b) => a.localeCompare(b)),
		[cards],
	);

	const handleAddFlashcard = async (data: {
		word: string;
		definition: string;
		notes: string;
		tags: string[];
	}) => {
		if (!currentUser) return;

		try {
			if (editingFlashcard) {
				const res = await FlashcardService.updateFlashCard(editingFlashcard.id, {
					word: data.word,
					definition: data.definition,
					notes: data.notes,
					tags: data.tags,
				});
				const fc = (res as any)?.data ?? res;
				setCards((prev) => prev.map((c) => c.id === editingFlashcard.id ? mapFlashCard(fc, listId) : c));
			} else {
				const res = await FlashcardService.createFlashCard({
					word: data.word,
					definition: data.definition,
					notes: data.notes,
					listId,
					tags: data.tags,
				});
				const fc = (res as any)?.data ?? res;
				setCards((prev) => [...prev, mapFlashCard(fc, listId)]);
			}
			setEditingFlashcard(undefined);
		} catch (err) {
			console.error('[FlashcardListDetail] save error:', err);
			// FlashcardDialog shows the error and stays open.
			throw err;
		}
	};

	const handleEditFlashcard = (flashcard: FlashCard) => {
		setEditingFlashcard(flashcard);
		setFlashcardDialogOpen(true);
	};

	const handleDeleteFlashcard = async (flashcardId: string) => {
		if (confirm('Bạn có chắc muốn xóa flashcard này?')) {
			try {
				await FlashcardService.deleteFlashCard(flashcardId);
				setCards((prev) => prev.filter((c) => c.id !== flashcardId));
			} catch (err) {
				console.error('[FlashcardListDetail] delete error:', err);
				toast({ title: 'Xóa thẻ ghi nhớ thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
			}
		}
	};

	const getTagNames = (flashcard: FlashCard) => {
		return flashcard.tags
			.map((tagValue) => tags.find((t) => t.id === tagValue || t.name === tagValue)?.name ?? tagValue)
			.filter((name): name is string => !!name);
	};

	if (!isHydrated || !currentUser) {
		return null;
	}

	// first load of this list: skeleton; later page changes/reloads keep the page and dim the grid
	if (loading && listMeta?.id !== listId) {
		return <FlashcardListDetailSkeleton />;
	}

	if (!currentList) {
		return (
			<div className="max-w-7xl mx-auto p-6">
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-gray-500 mb-4">Không tìm thấy list này</p>
						<Button onClick={() => router.push('/flashcards')}>
							Quay lại
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50/50 pb-20">
			{/* Premium Header Region */}
			<div className='bg-white border-b border-gray-200 mb-8 pt-6 pb-12 relative overflow-hidden'>
				<div className='absolute inset-0 bg-primary/5 pointer-events-none'></div>

				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
					<div className="flex items-center justify-between mb-6">
						<Button
							variant="ghost"
							onClick={() => {
								// back to the list view it was opened from (tab, page, search kept in ?from=)
								const from = new URLSearchParams(window.location.search).get('from');
								router.push(from && from.startsWith('/flashcards') && !from.startsWith('//') ? from : '/flashcards');
							}}
							className="flex items-center gap-2 -ml-2 text-slate-500 hover:text-primary font-semibold"
						>
							<ArrowLeft className="h-4 w-4" />
							Trở về danh sách bộ sưu tập
						</Button>
						{currentUser && (
							<Button
								variant="ghost"
								onClick={() => setReportOpen(true)}
								className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-semibold"
							>
								<Flag className="h-4 w-4" />
								Báo cáo
							</Button>
						)}
					</div>

					<div className="flex flex-col md:flex-row items-center justify-between gap-6">
						<div className="flex items-center gap-5 text-center md:text-left">
							<div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
								<Folder className="h-8 w-8" strokeWidth={2.5} />
							</div>
							<div>
								<h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-2">
									{currentList.name}
								</h1>
								<div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
									<div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
										<BookOpen className="h-4 w-4 text-primary/80" />
										{cardTotalCount} thẻ ghi nhớ
									</div>
									{currentList.description && (
										<p className="text-slate-500 font-medium">
											{currentList.description}
										</p>
									)}
								</div>
							</div>
						</div>
						<div className="flex flex-wrap items-center justify-center gap-3">
						{/* review mode only takes the player's own lists */}
						{isOwnList && cardTotalCount > 0 && (
							<Button
								variant="outline"
								onClick={() => router.push(`/flashcards/review?list=${encodeURIComponent(listId)}`)}
								className="rounded-xl px-6 py-6 h-auto font-bold text-base border-primary/40 text-primary hover:bg-primary/10 flex-shrink-0"
							>
								<BookOpen className="h-5 w-5 mr-2" />
								Ôn tập bộ này
							</Button>
						)}
						{isOwnList && (
							<Button
								onClick={() => {
									setEditingFlashcard(undefined);
									setFlashcardDialogOpen(true);
								}}
								className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-6 h-auto shadow-md transition-all hover:-translate-y-1 font-bold text-base flex-shrink-0"
							>
								<Plus className="h-5 w-5 mr-2" strokeWidth={3} />
								Thêm Flashcard
							</Button>
						)}
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
				{listMeta && (
					<FlashcardForkPanel list={listMeta} isOwnList={isOwnList} onPulled={() => setReloadKey((k) => k + 1)} />
				)}

				{/* Search and Filter */}
				<div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
					<div className="flex-1 w-full relative">
						<Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
						<Input
							placeholder="Tìm kiếm từ, định nghĩa hoặc ghi chú..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-11 bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl h-12 text-base font-medium"
						/>
					</div>
					<div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4">
						<Select value={selectedTagId} onValueChange={setSelectedTagId}>
							<SelectTrigger className="w-full sm:w-56 h-12 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-primary text-slate-600">
								<div className="flex items-center">
									<Filter className="h-4 w-4 mr-2 text-slate-400" />
									<SelectValue placeholder="Lọc theo chủ đề" />
								</div>
							</SelectTrigger>
							<SelectContent className="rounded-xl border-slate-200">
								<SelectItem value="__all__" className="font-semibold text-primary">Tất cả chủ đề</SelectItem>
								{cardTagNames.map((tag) => (
									<SelectItem key={tag} value={tag} className="font-medium">
										{tag}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{(searchQuery || (selectedTagId && selectedTagId !== '__all__')) && (
							<Button
								variant="ghost"
								onClick={() => {
									setSearchQuery('');
									setSelectedTagId('__all__');
								}}
								className="h-12 w-full sm:w-auto px-4 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold"
							>
								<X className="h-4 w-4 mr-2" />
								Xóa lọc
							</Button>
						)}
					</div>
				</div>

				{/* Flashcard Grid */}
				{filteredFlashcards.length === 0 && cardTotalCount === 0 && !loading ? (
					<div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
						<div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
							<BookOpen className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
						</div>
						<h3 className="text-xl font-bold text-slate-800 mb-2">Danh sách thẻ trống</h3>
						<p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">
							Bộ sưu tập này chưa có thẻ ghi nhớ nào.
						</p>
						{isOwnList && (
							<Button
								onClick={() => {
									setEditingFlashcard(undefined);
									setFlashcardDialogOpen(true);
								}}
								className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 py-6 h-auto shadow-md transition-all hover:-translate-y-1 inline-flex"
							>
								<Plus className="h-5 w-5 mr-2" strokeWidth={2.5} />
								Tạo thẻ ghi nhớ đầu tiên
							</Button>
						)}
					</div>
				) : filteredFlashcards.length === 0 && cardTotalCount > 0 ? (
					<div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
						<div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
							<BookOpen className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
						</div>
						<h3 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy kết quả</h3>
						<p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">
							Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn chủ đề khác nhé.
						</p>
					</div>
              ) : (
                  <>
                    <div
                      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch transition-opacity duration-200 ${loading ? 'pointer-events-none opacity-60' : ''}`}
                      aria-busy={loading}
                    >
                      {filteredFlashcards.map((flashcard) => (
						<FlashcardCard
							key={flashcard.id}
							flashcard={flashcard}
							tagNames={getTagNames(flashcard)}
							editable={isOwnList}
							onEdit={() => handleEditFlashcard(flashcard)}
							onDelete={() => handleDeleteFlashcard(flashcard.id)}
							onReport={() => {
								setReportFlashcardId(flashcard.id);
								setReportOpen(true);
							}}
						/>
					))}
                    </div>
                  </>
                )}
                {cardTotalCount > 0 && (
                  <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" size="sm" disabled={cardPage <= 1} onClick={() => setCardPage(cardPage - 1)}>
                      Trước
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Trang {cardPage} / {Math.max(1, Math.ceil(cardTotalCount / cardLimit))}
                    </span>
                    <Button variant="outline" size="sm" disabled={cardPage >= Math.ceil(cardTotalCount / cardLimit)} onClick={() => setCardPage(cardPage + 1)}>
                      Sau
                    </Button>
                  </div>
                )}
			</div>

			{/* Flashcard Dialog */}
			<FlashcardDialog
				open={flashcardDialogOpen}
				onOpenChange={setFlashcardDialogOpen}
				flashcard={editingFlashcard}
				onSave={handleAddFlashcard}
				tagSuggestions={cardTagNames}
			/>

			{currentUser && (
				<ReportDialog
					open={reportOpen}
					onOpenChange={setReportOpen}
					targetType={reportFlashcardId ? 'flashcard' : 'flashcard list'}
					targetId={reportFlashcardId ? `${listId}/${reportFlashcardId}` : listId}
					userId={currentUser.id}
				/>
			)}
		</div>
	);
}
