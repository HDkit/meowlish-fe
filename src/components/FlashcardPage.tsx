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
			<DialogContent hideCloseButton className="bg-white rounded-2xl border-0 shadow-2xl overflow-hidden sm:max-w-md p-0">
				<div className="h-2 w-full bg-gradient-to-r from-primary to-primary"></div>
				<DialogHeader className="px-6 pt-6 pb-2">
					<DialogTitle className="text-xl font-bold text-slate-800">
						{list ? 'Cập Nhật Bộ Flashcard' : 'Tạo Bộ Flashcard Mới'}
					</DialogTitle>
					<DialogDescription className="text-slate-500 font-medium">
						{list
							? 'Chỉnh sửa tên và mô tả của bộ sưu tập này.'
							: 'Tổ chức các thẻ ghi nhớ vào một bộ sưu tập mới để tiện ôn luyện.'}
					</DialogDescription>
				</DialogHeader>
				<div className="px-6 py-4 space-y-5">
					<div className="space-y-2">
						<Label htmlFor="list-name" className="text-slate-700 font-bold">Tên Bộ Flashcard <span className="text-red-500">*</span></Label>
						<Input
							id="list-name"
							placeholder="VD: Từ vựng IELTS, Ngữ pháp cơ bản..."
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl h-11 transition-all"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="list-description" className="text-slate-700 font-bold">Mô Tả</Label>
						<Textarea
							id="list-description"
							placeholder="Thêm một vài dòng tâm sự hay ghi chú về danh sách này..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							className="bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl resize-none transition-all"
						/>
					</div>
				</div>
				<DialogFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex gap-2 justify-end">
					<Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-slate-200 hover:bg-slate-100 font-bold text-slate-600">
						Hủy
					</Button>
					<Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all font-bold px-6">
						{list ? 'Lưu Thay Đổi' : 'Tạo Mới'}
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
		<div className="min-h-screen bg-slate-50/50 pb-20">
			{/* Premium Header */}
			<div className='bg-white border-b border-gray-200 mb-8 md:mb-12 relative overflow-hidden'>
				<div className='absolute inset-0 bg-gradient-to-r from-primary to-primary/80 pointer-events-none'></div>
				<div className="absolute inset-0 bg-black/10 pointer-events-none" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6'>
					<div className="text-center md:text-left">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-bold mb-4 mx-auto md:mx-0 shadow-sm">
							<BookOpen className="w-4 h-4" /> BỘ SƯU TẬP CỦA TÔI
						</div>
						<h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight mb-4">
							Quản Lý Flashcards
						</h1>
						<p className="text-primary-foreground/80 font-medium max-w-xl text-base md:text-lg opacity-90 leading-relaxed">
							Tạo và tổ chức các thẻ ghi nhớ từ vựng, ngữ pháp để ôn tập mỗi ngày một cách khoa học nhất.
						</p>
					</div>
					<div className="flex-shrink-0">
						<Button
							onClick={() => {
								setEditingList(undefined);
								setListDialogOpen(true);
							}}
							className="bg-white hover:bg-primary/10 text-primary rounded-2xl px-8 py-7 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-1 font-bold text-lg border-2 border-white/90"
						>
							<Plus className="h-6 w-6 mr-2" strokeWidth={3} />
							Tạo Bộ Mới
						</Button>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
				{/* Lists Section */}
				{myLists.length === 0 ? (
					<div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center animate-in fade-in duration-500">
						<div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
							<Folder className="h-10 w-10 text-primary/60" strokeWidth={1.5} />
						</div>
						<h3 className="text-xl font-bold text-slate-800 mb-2">Chưa Có Bộ Flashcard Nào</h3>
						<p className="text-slate-500 mb-8 max-w-md mx-auto font-medium">
							Hãy tạo danh sách flashcard đầu tiên để bắt đầu quá trình ghi nhớ từ vựng hiệu quả hơn.
						</p>
						<Button
							onClick={() => {
								setEditingList(undefined);
								setListDialogOpen(true);
							}}
							className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-8 py-6 h-auto shadow-md transition-all hover:-translate-y-1 inline-flex"
						>
							<Plus className="h-5 w-5 mr-2" strokeWidth={2.5} />
							Bắt Đầu Ngay
						</Button>
					</div>
				) : (
					<div className="space-y-6">
						<div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
							<h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
								Danh sách của bạn
								<span className="bg-slate-200 text-slate-700 text-sm font-bold px-2.5 py-0.5 rounded-full inline-flex leading-tight items-center justify-center min-w-[28px]">{myLists.length}</span>
							</h2>
						</div>

						{/* List Cards Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
							{myLists.map((list) => (
								<Card key={list.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-sm bg-white rounded-2xl overflow-hidden hover:-translate-y-1 flex flex-col relative ring-1 ring-slate-200/50">
									{/* Decorative Blob */}
									<div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

									<CardContent className="p-6 flex-1 flex flex-col relative z-10">
										{/* Header */}
										<div className="flex items-start justify-between mb-5">
											<div className="flex items-start gap-4 flex-1">
												<div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
													<Folder className="h-6 w-6" strokeWidth={2} />
												</div>
												<div className="flex-1 min-w-0 pt-0.5">
													<h3 className="font-bold text-slate-800 text-lg mb-1 truncate group-hover:text-primary transition-colors">
														{list.name}
													</h3>
													<div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold mb-3 border border-slate-200/60">
														<BookOpen className="w-3.5 h-3.5 text-primary/80" />
														{getFlashcardCount(list.id)} thẻ
													</div>
												</div>
											</div>
											<div className="flex flex-col gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity ml-2">
												<Button
													variant="outline"
													size="icon"
													className="h-8 w-8 rounded-lg border-slate-200 text-slate-500 hover:text-primary hover:bg-primary/10 hover:border-primary/30 bg-white shadow-sm"
													onClick={(e) => { e.stopPropagation(); handleEditList(list); }}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="outline"
													size="icon"
													className="h-8 w-8 rounded-lg border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 bg-white shadow-sm"
													onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>

										<p className="text-sm text-slate-500 mb-6 line-clamp-2 min-h-[40px] font-medium leading-relaxed">
											{list.description || 'Chưa có mô tả chi tiết cho bộ flashcard này. Bấm vào nút sửa hình cây bút bên trên để viết thêm...'}
										</p>

										{/* View Button */}
										<Button
											className="w-full mt-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl h-12 transition-all group-hover:shadow-[0_4px_14px_0_rgb(15,23,42,0.39)] gap-2"
											onClick={() => router.push(`/flashcards/${list.id}`)}
										>
											Mở Bộ Sưu Tập <ChevronRight className="h-4 w-4" />
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}
			</div>

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
