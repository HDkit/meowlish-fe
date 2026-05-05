'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch, useIsStoreHydrated } from '@/lib/store/hooks';
import { FlashCard, Tag, TagType } from '../types/client';
import { addFlashCard, removeFlashCard, updateFlashCard } from './store/flashCardSlice';
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
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

// Component hiển thị từng flashcard
function FlashcardCard({
	flashcard,
	tag,
	onEdit,
	onDelete,
}: {
	flashcard: FlashCard;
	tag?: Tag;
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
				{/* Decorative elements */}
				{!isFlipped && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>}
				{isFlipped && <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>}

				{/* Header với actions */}
				<div className="flex items-start justify-between mb-4 relative z-20">
					<div className="flex items-center gap-2">
						{tag && (
							<Badge variant="outline" className={`text-xs font-semibold ${isFlipped ? 'bg-white/20 border-white/30 text-white' : 'bg-primary/10 text-primary border-primary/30'}`}>
								{tag.name}
							</Badge>
						)}
					</div>
					<div className={`flex items-center gap-1.5 transition-opacity relative z-50 ${isFlipped ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
						<Button
							variant={isFlipped ? 'ghost' : 'outline'}
							size="icon"
							className={`h-8 w-8 rounded-lg shadow-sm ${isFlipped ? 'text-white hover:bg-white/20' : 'bg-white border-slate-200 text-slate-500 hover:text-primary hover:bg-primary/10'}`}
							onClick={(e) => {
								e.stopPropagation();
								onEdit();
							}}
						>
							<Edit className="h-4 w-4" />
						</Button>
						<Button
							variant={isFlipped ? 'ghost' : 'outline'}
							size="icon"
							className={`h-8 w-8 rounded-lg shadow-sm ${isFlipped ? 'text-rose-200 hover:text-rose-100 hover:bg-rose-500/30' : 'bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`}
							onClick={(e) => {
								e.stopPropagation();
								onDelete();
							}}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Card content */}
				<div className="flex-1 flex items-center justify-center relative z-10 overflow-hidden py-4">
					<div className="text-center w-full max-h-full overflow-y-auto custom-scrollbar">
						{isFlipped ? (
							<div className="space-y-3 px-2">
								<p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/60">Ghi chú & Giải nghĩa</p>
								<p className="text-lg font-medium text-white whitespace-pre-wrap leading-relaxed">
									{flashcard.notes || 'Không có ghi chú'}
								</p>
							</div>
						) : (
							<div className="px-2">
								<p className="text-3xl font-extrabold text-slate-800 tracking-tight">
									{flashcard.content}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className={`mt-4 pt-4 text-center border-t relative z-10 ${isFlipped ? 'border-white/20' : 'border-slate-100'}`}>
					<p className={`text-xs font-bold uppercase tracking-widest ${isFlipped ? 'text-primary-foreground/60' : 'text-slate-400'}`}>
						{isFlipped ? 'Nhấn thẻ để lật lại' : 'Nhấn thẻ xem ghi chú'}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

// Dialog để thêm/sửa flashcard
function FlashcardDialog({
	open,
	onOpenChange,
	flashcard,
	listId,
	onSave,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	flashcard?: FlashCard;
	listId: string;
	onSave: (data: { content: string; notes: string; tagId: string }) => void;
}) {
	const [content, setContent] = useState('');
	const [notes, setNotes] = useState('');
	const [tagId, setTagId] = useState('');
	const tags = useAppSelector((state) => state.tags.list);
	const flashcardTags = tags.filter((t) => t.tagType === TagType.Flashcard || t.tagType === TagType.Question);

	useEffect(() => {
		if (flashcard) {
			setContent(flashcard.content);
			setNotes(flashcard.notes || '');
			setTagId(flashcard.tagId);
		} else {
			setContent('');
			setNotes('');
			setTagId('');
		}
	}, [flashcard, open]);

	const handleSave = () => {
		if (!content.trim() || !tagId) {
			alert('Vui lòng điền đầy đủ thông tin');
			return;
		}
		onSave({ content: content.trim(), notes: notes.trim(), tagId });
		setContent('');
		setNotes('');
		setTagId('');
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent hideCloseButton className="bg-white rounded-2xl border-0 shadow-2xl overflow-hidden sm:max-w-md p-0">
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
				<div className="px-6 py-4 space-y-5">
					<div className="space-y-2">
						<Label htmlFor="content" className="text-slate-700 font-bold">Từ / Cụm từ (Mặt trước) <span className="text-red-500">*</span></Label>
						<Input
							id="content"
							placeholder="VD: Aberration, Present Perfect..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl h-11"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="notes" className="text-slate-700 font-bold">Ghi chú (Mặt sau)</Label>
						<Textarea
							id="notes"
							placeholder="Định nghĩa, ví dụ minh hoạ, âm thanh..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={4}
							className="bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl resize-none"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="tag" className="text-slate-700 font-bold">Chủ đề <span className="text-red-500">*</span></Label>
						<Select value={tagId} onValueChange={setTagId}>
							<SelectTrigger id="tag" className="bg-slate-50 border-slate-200 rounded-xl h-11 focus:ring-primary focus:border-primary">
								<SelectValue placeholder="Chọn một chủ đề" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border-slate-200">
								{flashcardTags.map((tag) => (
									<SelectItem key={tag.id} value={tag.id} className="cursor-pointer">
										{tag.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex gap-2 justify-end">
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
	const flashcards = useAppSelector((state) => state.flashCards.list);
	const lists = useAppSelector((state) => state.flashcardLists.list);
	const tags = useAppSelector((state) => state.tags.list);

	const listId = params?.listId as string;

	// Redirect if not logged in (wait for Redux rehydration first)
	useEffect(() => {
		if (!isHydrated) return;
		if (!currentUser) {
			router.push('/auth');
		}
	}, [isHydrated, currentUser, router]);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTagId, setSelectedTagId] = useState<string>('__all__');
	const [flashcardDialogOpen, setFlashcardDialogOpen] = useState(false);
	const [editingFlashcard, setEditingFlashcard] = useState<FlashCard | undefined>();

	// Get current list
	const currentList = useMemo(() => {
		return lists.find((l) => l.id === listId);
	}, [lists, listId]);

	// Lọc flashcards theo list
	const flashcardsInList = useMemo(() => {
		return flashcards.filter((f) => f.listId === listId);
	}, [flashcards, listId]);

	// Lọc theo search và tag
	const filteredFlashcards = useMemo(() => {
		let filtered = flashcardsInList;
		if (searchQuery) {
			filtered = filtered.filter(
				(f) =>
					f.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
					f.notes?.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
		if (selectedTagId && selectedTagId !== '__all__') {
			filtered = filtered.filter((f) => f.tagId === selectedTagId);
		}
		return filtered;
	}, [flashcardsInList, searchQuery, selectedTagId]);

	const flashcardTags = tags.filter(
		(t) => t.tagType === TagType.Flashcard || t.tagType === TagType.Question
	);

	const handleAddFlashcard = (data: {
		content: string;
		notes: string;
		tagId: string;
	}) => {
		if (!currentUser) return;

		if (editingFlashcard) {
			dispatch(
				updateFlashCard({
					...editingFlashcard,
					content: data.content,
					notes: data.notes,
					tagId: data.tagId,
				})
			);
		} else {
			const newFlashcard: FlashCard = {
				id: `f${Date.now()}`,
				userId: currentUser.id,
				listId: listId,
				content: data.content,
				notes: data.notes,
				tagId: data.tagId,
			};
			dispatch(addFlashCard(newFlashcard));
		}
		setEditingFlashcard(undefined);
	};

	const handleEditFlashcard = (flashcard: FlashCard) => {
		setEditingFlashcard(flashcard);
		setFlashcardDialogOpen(true);
	};

	const handleDeleteFlashcard = (flashcardId: string) => {
		if (confirm('Bạn có chắc muốn xóa flashcard này?')) {
			dispatch(removeFlashCard(flashcardId));
		}
	};

	const getTag = (tagId: string) => {
		return tags.find((t) => t.id === tagId);
	};

	if (!isHydrated || !currentUser) {
		return null;
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

	// Check if user owns this list
	if (currentList.userId !== currentUser.id) {
		return (
			<div className="max-w-7xl mx-auto p-6">
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-gray-500 mb-4">Bạn không có quyền xem list này</p>
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
					<Button
						variant="ghost"
						onClick={() => router.push('/flashcards')}
						className="flex items-center gap-2 mb-6 -ml-2 text-slate-500 hover:text-primary font-semibold"
					>
						<ArrowLeft className="h-4 w-4" />
						Trở về danh sách bộ sưu tập
					</Button>

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
										{flashcardsInList.length} thẻ ghi nhớ
									</div>
									{currentList.description && (
										<p className="text-slate-500 font-medium">
											{currentList.description}
										</p>
									)}
								</div>
							</div>
						</div>
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
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
				{/* Search and Filter */}
				<div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
					<div className="flex-1 w-full relative">
						<Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
						<Input
							placeholder="Tìm kiếm nội dung thẻ học hoặc ghi chú..."
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
				{filteredFlashcards.length === 0 ? (
					<div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
						<div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
							<BookOpen className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
						</div>
						<h3 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy thẻ ghi nhớ nào.</h3>
						<p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">
							{searchQuery || (selectedTagId && selectedTagId !== '__all__')
								? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn chủ đề khác nhé.'
								: 'Bộ sưu tập này đang trống. Hãy nhấn nút thêm flashcard để làm đầy sổ học tập của bạn!'}
						</p>
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
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
						{filteredFlashcards.map((flashcard) => (
							<FlashcardCard
								key={flashcard.id}
								flashcard={flashcard}
								tag={getTag(flashcard.tagId)}
								onEdit={() => handleEditFlashcard(flashcard)}
								onDelete={() => handleDeleteFlashcard(flashcard.id)}
							/>
						))}
					</div>
				)}
			</div>

			{/* Flashcard Dialog */}
			<FlashcardDialog
				open={flashcardDialogOpen}
				onOpenChange={setFlashcardDialogOpen}
				flashcard={editingFlashcard}
				listId={listId}
				onSave={handleAddFlashcard}
			/>
		</div>
	);
}
