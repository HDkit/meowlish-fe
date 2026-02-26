'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { FlashcardList } from '../types/client';
import { removeFlashCard } from './store/flashCardSlice';
import { addFlashcardList, removeFlashcardList, updateFlashcardList } from './store/flashcardListSlice';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
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
	Plus,
	Edit,
	Trash2,
	BookOpen,
	Folder,
	ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Dialog để tạo/sửa list
function ListDialog({
	open,
	onOpenChange,
	list,
	onSave,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	list?: FlashcardList;
	onSave: (data: { name: string; description: string }) => void;
}) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');

	useEffect(() => {
		if (list) {
			setName(list.name);
			setDescription(list.description || '');
		} else {
			setName('');
			setDescription('');
		}
	}, [list, open]);

	const handleSave = () => {
		if (!name.trim()) {
			alert('Vui lòng nhập tên list');
			return;
		}
		onSave({ name: name.trim(), description: description.trim() });
		setName('');
		setDescription('');
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent hideCloseButton className="bg-white">
				<DialogHeader>
					<DialogTitle>
						{list ? 'Sửa List' : 'Tạo List mới'}
					</DialogTitle>
					<DialogDescription>
						{list
							? 'Chỉnh sửa thông tin list của bạn'
							: 'Tạo một list mới để tổ chức flashcards của bạn'}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="list-name">Tên List *</Label>
						<Input
							id="list-name"
							placeholder="Ví dụ: Từ vựng IELTS, Ngữ pháp TOEIC..."
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="bg-gray-50 border-gray-200"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="list-description">Mô tả</Label>
						<Textarea
							id="list-description"
							placeholder="Mô tả về list này..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							className="bg-gray-50 border-gray-200"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Hủy
					</Button>
					<Button onClick={handleSave} className="bg-black hover:bg-gray-800 !text-white">
						{list ? 'Lưu thay đổi' : 'Tạo mới'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function FlashcardPage() {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const currentUser = useAppSelector((state) => state.currUser.current);
	const flashcards = useAppSelector((state) => state.flashCards.list);
	const lists = useAppSelector((state) => state.flashcardLists.list);

	// Redirect if not logged in
	useEffect(() => {
		if (!currentUser) {
			router.push('/auth');
		}
	}, [currentUser, router]);

	const [listDialogOpen, setListDialogOpen] = useState(false);
	const [editingList, setEditingList] = useState<FlashcardList | undefined>();

	// Lọc lists của user hiện tại
	const myLists = useMemo(
		() => lists.filter((l) => l.userId === currentUser?.id),
		[lists, currentUser]
	);

	const handleAddList = (data: { name: string; description: string }) => {
		if (!currentUser) return;

		if (editingList) {
			dispatch(
				updateFlashcardList({
					...editingList,
					name: data.name,
					description: data.description,
				})
			);
		} else {
			const newList: FlashcardList = {
				id: `fl${Date.now()}`,
				userId: currentUser.id,
				name: data.name,
				description: data.description,
				createdAt: Date.now(),
			};
			dispatch(addFlashcardList(newList));
		}
		setEditingList(undefined);
	};

	const handleEditList = (list: FlashcardList) => {
		setEditingList(list);
		setListDialogOpen(true);
	};

	const handleDeleteList = (listId: string) => {
		if (confirm('Bạn có chắc muốn xóa list này? Tất cả flashcard trong list sẽ bị xóa.')) {
			// Xóa tất cả flashcard trong list
			flashcards
				.filter((f) => f.listId === listId)
				.forEach((f) => dispatch(removeFlashCard(f.id)));
			// Xóa list
			dispatch(removeFlashcardList(listId));
		}
	};

	const getFlashcardCount = (listId: string) => {
		return flashcards.filter((f) => f.listId === listId).length;
	};

	if (!currentUser) {
		return null;
	}

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
						<BookOpen className="h-8 w-8" />
						Flashcards
					</h1>
					<p className="text-gray-600 mt-1">
						Quản lý flashcards theo list để học hiệu quả hơn
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingList(undefined);
						setListDialogOpen(true);
					}}
					className="bg-blue-600 hover:bg-blue-700 !text-white"
				>
					<Plus className="h-4 w-4 mr-2" />
					Tạo List
				</Button>
			</div>

			{/* Lists Section */}
			{myLists.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center">
						<Folder className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						<p className="text-gray-500 mb-4">
							Bạn chưa có list nào. Hãy tạo list đầu tiên!
						</p>
						<Button
							onClick={() => {
								setEditingList(undefined);
								setListDialogOpen(true);
							}}
							className="bg-blue-600 hover:bg-blue-700 !text-white"
						>
							<Plus className="h-4 w-4 mr-2" />
							Tạo List
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					<div>
						<h2 className="text-xl font-semibold text-gray-900 mb-4">
							Danh sách của tôi ({myLists.length})
						</h2>
						
						{/* List Cards Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{myLists.map((list) => (
								<Card key={list.id} className="hover:shadow-lg transition-all">
									<CardContent className="p-6 space-y-4">
										{/* Header */}
										<div className="flex items-start justify-between">
											<div className="flex items-start gap-3 flex-1">
												<Folder className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
												<div className="flex-1 min-w-0">
													<h3 className="font-semibold text-gray-900 text-lg mb-1">
														{list.name}
													</h3>
													{list.description && (
														<p className="text-sm text-gray-600 mb-2">
															{list.description}
														</p>
													)}
													<p className="text-sm text-gray-500">
														{getFlashcardCount(list.id)} flashcard
													</p>
												</div>
											</div>
											<div className="flex gap-1">
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0"
													onClick={() => handleEditList(list)}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
													onClick={() => handleDeleteList(list.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>

										{/* View Button */}
										<Button
											className="w-full bg-black hover:bg-gray-800 !text-white"
											onClick={() => router.push(`/flashcards/${list.id}`)}
										>
											Xem flashcard
											<ChevronRight className="h-4 w-4 ml-2" />
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			)}

			{/* List Dialog */}
			<ListDialog
				open={listDialogOpen}
				onOpenChange={setListDialogOpen}
				list={editingList}
				onSave={handleAddList}
			/>
		</div>
	);
}
