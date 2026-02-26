'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
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
			className="group cursor-pointer hover:shadow-lg transition-all duration-300 h-64"
			onClick={() => setIsFlipped(!isFlipped)}
		>
			<CardContent className="p-6 h-full flex flex-col relative">
				{/* Header với actions */}
				<div className="flex items-start justify-between mb-4">
					<div className="flex items-center gap-2">
						{tag && (
							<Badge variant="secondary" className="text-xs">
								{tag.name}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0"
							onClick={(e) => {
								e.stopPropagation();
								onEdit();
							}}
						>
							<Edit className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center w-full">
						{isFlipped ? (
							<div className="space-y-2">
								<p className="text-sm text-gray-500 mb-2">Ghi chú:</p>
								<p className="text-lg text-gray-800 whitespace-pre-wrap">
									{flashcard.notes || 'Không có ghi chú'}
								</p>
							</div>
						) : (
							<div>
								<p className="text-2xl font-bold text-gray-900">
									{flashcard.content}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="mt-4 pt-4 border-t border-gray-200">
					<p className="text-xs text-gray-400">
						{isFlipped ? 'Nhấn để xem từ' : 'Nhấn để xem ghi chú'}
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
			<DialogContent hideCloseButton className="bg-white">
				<DialogHeader>
					<DialogTitle>
						{flashcard ? 'Sửa Flashcard' : 'Thêm Flashcard vào List'}
					</DialogTitle>
					<DialogDescription>
						{flashcard
							? 'Chỉnh sửa thông tin flashcard của bạn'
							: 'Thêm một flashcard mới vào list này'}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="content">Từ/Cụm từ *</Label>
						<Input
							id="content"
							placeholder="Ví dụ: Aberration, Present Perfect..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="bg-gray-50 border-gray-200"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="notes">Ghi chú</Label>
						<Textarea
							id="notes"
							placeholder="Định nghĩa, ví dụ, cách sử dụng..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={4}
							className="bg-gray-50 border-gray-200"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="tag">Chủ đề *</Label>
						<Select value={tagId} onValueChange={setTagId}>
							<SelectTrigger id="tag" className="bg-gray-50 border-gray-200">
								<SelectValue placeholder="Chọn chủ đề" />
							</SelectTrigger>
							<SelectContent>
								{flashcardTags.map((tag) => (
									<SelectItem key={tag.id} value={tag.id}>
										{tag.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Hủy
					</Button>
					<Button onClick={handleSave} className="bg-black hover:bg-gray-800 !text-white">
						{flashcard ? 'Lưu thay đổi' : 'Thêm vào List'}
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
	const flashcards = useAppSelector((state) => state.flashCards.list);
	const lists = useAppSelector((state) => state.flashcardLists.list);
	const tags = useAppSelector((state) => state.tags.list);

	const listId = params?.listId as string;

	// Redirect if not logged in
	useEffect(() => {
		if (!currentUser) {
			router.push('/auth');
		}
	}, [currentUser, router]);

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

	if (!currentUser) {
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
		<div className="max-w-7xl mx-auto p-6 space-y-6">
			{/* Back Button */}
			<Button
				variant="ghost"
				onClick={() => router.push('/flashcards')}
				className="flex items-center gap-2 -ml-2"
			>
				<ArrowLeft className="h-4 w-4" />
				Quay lại
			</Button>

			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
						<Folder className="h-8 w-8 text-blue-600" />
						{currentList.name}
					</h1>
					{currentList.description && (
						<p className="text-gray-600 mt-1">
							{currentList.description}
						</p>
					)}
				</div>
				<Button
					onClick={() => {
						setEditingFlashcard(undefined);
						setFlashcardDialogOpen(true);
					}}
					className="bg-blue-600 hover:bg-blue-700 !text-white"
				>
					<Plus className="h-4 w-4 mr-2" />
					Thêm Flashcard
				</Button>
			</div>

			{/* Stats */}
			<div className="flex items-center gap-6 text-sm text-gray-600">
				<div className="flex items-center gap-2">
					<BookOpen className="h-4 w-4" />
					<span>{flashcardsInList.length} flashcard</span>
				</div>
			</div>

			{/* Search and Filter */}
			<div className="flex items-center gap-4 flex-wrap">
				<div className="flex-1 min-w-[200px] relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Tìm kiếm flashcard..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Select value={selectedTagId} onValueChange={setSelectedTagId}>
					<SelectTrigger className="w-48">
						<Filter className="h-4 w-4 mr-2" />
						<SelectValue placeholder="Lọc theo chủ đề" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__all__">Tất cả chủ đề</SelectItem>
						{flashcardTags.map((tag) => (
							<SelectItem key={tag.id} value={tag.id}>
								{tag.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{(searchQuery || (selectedTagId && selectedTagId !== '__all__')) && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setSearchQuery('');
							setSelectedTagId('__all__');
						}}
					>
						<X className="h-4 w-4 mr-1" />
						Xóa bộ lọc
					</Button>
				)}
			</div>

			{/* Flashcard Grid */}
			{filteredFlashcards.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center">
						<BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						<p className="text-gray-500 mb-4">
							{searchQuery || (selectedTagId && selectedTagId !== '__all__')
								? 'Không tìm thấy flashcard nào'
								: 'List này chưa có flashcard nào. Hãy thêm flashcard đầu tiên!'}
						</p>
						<Button
							onClick={() => {
								setEditingFlashcard(undefined);
								setFlashcardDialogOpen(true);
							}}
							className="bg-blue-600 hover:bg-blue-700 !text-white"
						>
							<Plus className="h-4 w-4 mr-2" />
							Thêm Flashcard
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
