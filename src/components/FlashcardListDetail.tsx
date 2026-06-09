'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch, useIsStoreHydrated } from '@/lib/store/hooks';
import { FlashCard, TagType } from '../types/client';
import { FlashcardService } from '@/lib/api/services/FlashcardService';
import { FlashcardListService } from '@/lib/api/services/FlashcardListService';
import { ReportDialog } from './ReportDialog';
import { addFlashcardList } from './store/flashcardListSlice';
import { useToast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-response';
import { Card, CardContent } from './ui/card';
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

function FlashcardCard({
	flashcard,
	tagNames,
	editable,
	onEdit,
	onDelete,
}: {
	flashcard: FlashCard;
	tagNames?: string[];
	editable?: boolean;
	onEdit: () => void;
	onDelete: () => void;
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
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	flashcard?: FlashCard;
	onSave: (data: { word: string; definition: string; notes: string; tags: string[] }) => void;
}) {
	const [word, setWord] = useState('');
	const [definition, setDefinition] = useState('');
	const [notes, setNotes] = useState('');
	const { toast } = useToast();
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState('');
	const [tagSearch, setTagSearch] = useState('');
	const tags = useAppSelector((state) => state.tags.list);
	const flashcardTags = tags.filter((t) => t.tagType === TagType.Flashcard || t.tagType === TagType.Question);
	const isSelectedTag = (tagId: string, tagName: string) =>
		selectedTagIds.some((value) => value === tagId || value === tagName);
	const suggestedTags = flashcardTags
		.filter((tag) => {
			const q = tagSearch.trim().toLowerCase();
			if (!q) return true;
			return tag.name.toLowerCase().includes(q);
		})
		.filter((tag) => !isSelectedTag(tag.id, tag.name))
		.slice(0, 8);

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
		setTagInput('');
		setTagSearch('');
	}, [flashcard, open]);

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

	const handleSave = () => {
		if (!word.trim() || !definition.trim()) {
			toast({ title: 'Vui lòng điền đầy đủ từ và định nghĩa', variant: 'destructive' });
			return;
		}
		onSave({ word: word.trim(), definition: definition.trim(), notes: notes.trim(), tags: selectedTagIds });
		setWord('');
		setDefinition('');
		setNotes('');
		setSelectedTagIds([]);
		setTagInput('');
		setTagSearch('');
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent hideCloseButton className="bg-white rounded-2xl border-0 shadow-2xl overflow-hidden sm:max-w-lg p-0 max-h-[90vh] flex flex-col">
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
							id="word"
							placeholder="VD: Aberration, Present Perfect..."
							value={word}
							onChange={(e) => setWord(e.target.value)}
							className="bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl h-11"
						/>
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
							id="definition"
							placeholder="Nghĩa của từ hoặc cụm từ..."
							value={definition}
							onChange={(e) => setDefinition(e.target.value)}
							rows={3}
							className="bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl resize-none"
						/>
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
							id="notes"
							placeholder="Ví dụ minh hoạ, ghi chú thêm..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							className="bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl resize-none"
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-slate-700 font-bold">Tags</Label>
						<div className="space-y-2">
							<div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
						{selectedTagIds.map((tagId) => {
							const tagName = tags.find((t) => t.id === tagId)?.name ?? tagId;
							return (
										<Badge key={tagId} variant="secondary" className="gap-1 px-2.5 py-1 text-sm">
											{tagName}
											<button type="button" onClick={() => setSelectedTagIds((prev) => prev.filter((id) => id !== tagId))} className="ml-0.5 hover:text-red-500">
											<X className="h-3 w-3" />
										</button>
										</Badge>
									);
								})}
								<Input
									value={tagInput}
									onChange={(e) => {
										setTagInput(e.target.value);
										setTagSearch(e.target.value);
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ',') {
											e.preventDefault();
											const value = tagInput.trim();
											if (value && !selectedTagIds.some((id) => tags.find((t) => t.id === id)?.name.toLowerCase() === value.toLowerCase())) {
												setSelectedTagIds((prev) => [...prev, value]);
											}
											setTagInput('');
											setTagSearch('');
										}
										if (e.key === 'Backspace' && !tagInput && selectedTagIds.length > 0) {
											setSelectedTagIds((prev) => prev.slice(0, -1));
										}
									}}
									placeholder={selectedTagIds.length > 0 ? '' : 'Nhập tag rồi chọn gợi ý...'}
									className="min-w-[160px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
								/>
							</div>
							<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
								<div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">Gợi ý tag</div>
								<div className="max-h-40 overflow-y-auto">
								{suggestedTags.length === 0 ? (
									<div className="px-3 py-3 text-sm text-slate-500">Không có tag phù hợp</div>
								) : (
									suggestedTags.map((tag) => (
										<button
											key={tag.id}
											type="button"
											onClick={() => {
												setSelectedTagIds((prev) => [...prev, tag.id]);
												setTagInput('');
												setTagSearch('');
											}}
											className="w-full px-3 py-2 text-left text-sm hover:bg-primary/5 transition-colors flex items-center justify-between"
										>
												<span className="font-medium text-slate-800">{tag.name}</span>
												<span className="text-[11px] text-slate-400">{tag.tagType}</span>
											</button>
										))
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
				<DialogFooter className="shrink-0 px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex gap-2 justify-end">
					<Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-slate-200 hover:bg-slate-100 font-bold text-slate-600">
						Hủy
					</Button>
					<Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md hover:-translate-y-0.5 transition-all font-bold px-6">
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
	}, [listId, cardPage]);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTagId, setSelectedTagId] = useState<string>('__all__');
	const [reportOpen, setReportOpen] = useState(false);
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

	const flashcardTags = tags.filter(
		(t) => t.tagType === TagType.Flashcard || t.tagType === TagType.Question
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
		} catch (err) {
			console.error('[FlashcardListDetail] save error:', err);
			toast({ title: 'Lưu thẻ ghi nhớ thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
		}
		setEditingFlashcard(undefined);
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

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto p-6">
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-gray-500">Đang tải...</p>
					</CardContent>
				</Card>
			</div>
		);
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
							onClick={() => router.push('/flashcards')}
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

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
								{flashcardTags.map((tag) => (
									<SelectItem key={tag.id} value={tag.id} className="font-medium">
										{tag.name}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
                      {filteredFlashcards.map((flashcard) => (
						<FlashcardCard
							key={flashcard.id}
							flashcard={flashcard}
							tagNames={getTagNames(flashcard)}
							editable={isOwnList}
							onEdit={() => handleEditFlashcard(flashcard)}
							onDelete={() => handleDeleteFlashcard(flashcard.id)}
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
			/>

			{currentUser && (
				<ReportDialog
					open={reportOpen}
					onOpenChange={setReportOpen}
					targetType="other"
					targetId={listId}
					userId={currentUser.id}
				/>
			)}
		</div>
	);
}
