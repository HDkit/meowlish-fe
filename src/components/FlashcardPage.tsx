import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from './store/main/hook';
import { FlashCard, FlashcardList, Tag, TagType } from '../types/client';
import { addFlashCard, removeFlashCard, updateFlashCard } from './store/flashCardSlice';
import { addFlashcardList, removeFlashcardList, updateFlashcardList } from './store/flashcardListSlice';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
	Copy,
	BookOpen,
	Filter,
	X,
	Folder,
	ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Component hiển thị từng flashcard
function FlashcardCard({
	flashcard,
	tag,
	ownerName,
	listName,
	isOwned,
	onEdit,
	onDelete,
	onCopy,
}: {
	flashcard: FlashCard;
	tag?: Tag;
	ownerName?: string;
	listName?: string;
	isOwned: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	onCopy?: () => void;
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
						{isOwned && onEdit && (
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
						)}
						{!isOwned && onCopy && (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0"
								onClick={(e) => {
									e.stopPropagation();
									onCopy();
								}}
							>
								<Copy className="h-4 w-4" />
							</Button>
						)}
						{isOwned && onDelete && (
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
						)}
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
				<div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
					{listName && (
						<div className="flex items-center gap-1 text-xs text-gray-600">
							<Folder className="h-3 w-3" />
							<span>{listName}</span>
						</div>
					)}
					{ownerName && (
						<p className="text-xs text-gray-500">
							Bởi: {ownerName}
						</p>
					)}
					<p className="text-xs text-gray-400 mt-1">
						{isFlipped ? 'Nhấn để xem từ' : 'Nhấn để xem ghi chú'}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

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
			<DialogContent>
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
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Hủy
					</Button>
					<Button onClick={handleSave}>
						{list ? 'Lưu thay đổi' : 'Tạo mới'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Dialog để thêm/sửa flashcard
function FlashcardDialog({
	open,
	onOpenChange,
	flashcard,
	selectedListId,
	onSave,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	flashcard?: FlashCard;
	selectedListId?: string;
	onSave: (data: { content: string; notes: string; tagId: string; listId: string }) => void;
}) {
	const [content, setContent] = useState('');
	const [notes, setNotes] = useState('');
	const [tagId, setTagId] = useState('');
	const [listId, setListId] = useState('');
	const tags = useAppSelector((state) => state.tags.list);
	const flashcardTags = tags.filter((t) => t.tagType === TagType.Flashcard || t.tagType === TagType.Question);
	const currentUser = useAppSelector((state) => state.currUser.current);
	const lists = useAppSelector((state) => state.flashcardLists.list);
	const myLists = lists.filter((l) => l.userId === currentUser?.id);

	useEffect(() => {
		if (flashcard) {
			setContent(flashcard.content);
			setNotes(flashcard.notes || '');
			setTagId(flashcard.tagId);
			setListId(flashcard.listId);
		} else {
			setContent('');
			setNotes('');
			setTagId('');
			setListId(selectedListId || '');
		}
	}, [flashcard, open, selectedListId]);

	const handleSave = () => {
		if (!content.trim() || !tagId || !listId) {
			alert('Vui lòng điền đầy đủ thông tin');
			return;
		}
		onSave({ content: content.trim(), notes: notes.trim(), tagId, listId });
		setContent('');
		setNotes('');
		setTagId('');
		setListId('');
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{flashcard ? 'Sửa Flashcard' : 'Thêm Flashcard vào List'}
					</DialogTitle>
					<DialogDescription>
						{flashcard
							? 'Chỉnh sửa thông tin flashcard của bạn'
							: 'Thêm một flashcard mới vào list đã chọn'}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="list">List *</Label>
						<Select value={listId} onValueChange={setListId} disabled={!!selectedListId}>
							<SelectTrigger id="list">
								<SelectValue placeholder="Chọn list" />
							</SelectTrigger>
							<SelectContent>
								{myLists.map((list) => (
									<SelectItem key={list.id} value={list.id}>
										{list.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="content">Từ/Cụm từ *</Label>
						<Input
							id="content"
							placeholder="Ví dụ: Aberration, Present Perfect..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
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
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="tag">Chủ đề *</Label>
						<Select value={tagId} onValueChange={setTagId}>
							<SelectTrigger id="tag">
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
					<Button onClick={handleSave}>
						{flashcard ? 'Lưu thay đổi' : 'Thêm vào List'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function FlashcardPage() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const currentUser = useAppSelector((state) => state.currUser.current);
	const flashcards = useAppSelector((state) => state.flashCards.list);
	const lists = useAppSelector((state) => state.flashcardLists.list);
	const tags = useAppSelector((state) => state.tags.list);
	const users = useAppSelector((state) => state.users.list);

	// Redirect if not logged in
	useEffect(() => {
		if (!currentUser) {
			navigate('/auth');
		}
	}, [currentUser, navigate]);

	const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
	const [selectedListId, setSelectedListId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTagId, setSelectedTagId] = useState<string>('__all__');
	const [listDialogOpen, setListDialogOpen] = useState(false);
	const [flashcardDialogOpen, setFlashcardDialogOpen] = useState(false);
	const [selectListDialogOpen, setSelectListDialogOpen] = useState(false);
	const [flashcardToCopy, setFlashcardToCopy] = useState<FlashCard | null>(null);
	const [editingList, setEditingList] = useState<FlashcardList | undefined>();
	const [editingFlashcard, setEditingFlashcard] = useState<FlashCard | undefined>();

	// Lọc lists của user hiện tại
	const myLists = useMemo(
		() => lists.filter((l) => l.userId === currentUser?.id),
		[lists, currentUser]
	);

	// Lọc flashcards theo list đã chọn
	const flashcardsInSelectedList = useMemo(() => {
		if (!selectedListId) return [];
		return flashcards.filter((f) => f.listId === selectedListId);
	}, [flashcards, selectedListId]);

	// Lấy tất cả lists của người khác
	const otherLists = useMemo(() => {
		return lists.filter((l) => l.userId !== currentUser?.id);
	}, [lists, currentUser]);

	// Lọc flashcards của người khác
	const otherFlashcards = useMemo(() => {
		return flashcards.filter((f) => f.userId !== currentUser?.id);
	}, [flashcards, currentUser]);

	// State để lọc theo list của người khác
	const [selectedOtherListId, setSelectedOtherListId] = useState<string>('__all__');

	// Lọc flashcards theo list đã chọn (trong tab Discover)
	const filteredOtherFlashcardsByList = useMemo(() => {
		if (selectedOtherListId === '__all__') {
			return otherFlashcards;
		}
		return otherFlashcards.filter((f) => f.listId === selectedOtherListId);
	}, [otherFlashcards, selectedOtherListId]);

	// Lọc theo search và tag
	const filteredFlashcardsInList = useMemo(() => {
		let filtered = flashcardsInSelectedList;
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
	}, [flashcardsInSelectedList, searchQuery, selectedTagId]);

	const filteredOtherFlashcards = useMemo(() => {
		let filtered = filteredOtherFlashcardsByList;
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
	}, [filteredOtherFlashcardsByList, searchQuery, selectedTagId]);

	const flashcardTags = tags.filter(
		(t) => t.tagType === TagType.Flashcard || t.tagType === TagType.Question
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

	const handleAddFlashcard = (data: {
		content: string;
		notes: string;
		tagId: string;
		listId: string;
	}) => {
		if (!currentUser) return;

		if (editingFlashcard) {
			dispatch(
				updateFlashCard({
					...editingFlashcard,
					content: data.content,
					notes: data.notes,
					tagId: data.tagId,
					listId: data.listId,
				})
			);
		} else {
			const newFlashcard: FlashCard = {
				id: `f${Date.now()}`,
				userId: currentUser.id,
				listId: data.listId,
				content: data.content,
				notes: data.notes,
				tagId: data.tagId,
			};
			dispatch(addFlashCard(newFlashcard));
		}
		setEditingFlashcard(undefined);
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
			if (selectedListId === listId) {
				setSelectedListId(null);
			}
		}
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

	const handleCopy = (flashcard: FlashCard) => {
		if (!currentUser || !selectedListId) {
			alert('Vui lòng chọn một list để thêm flashcard');
			return;
		}

		const newFlashcard: FlashCard = {
			id: `f${Date.now()}`,
			userId: currentUser.id,
			listId: selectedListId,
			content: flashcard.content,
			notes: flashcard.notes,
			tagId: flashcard.tagId,
		};
		dispatch(addFlashCard(newFlashcard));
		alert('Đã thêm flashcard vào list của bạn!');
	};

	const getOwnerName = (userId: string) => {
		return users.find((u) => u.id === userId)?.fullName || 'Unknown';
	};

	const getTag = (tagId: string) => {
		return tags.find((t) => t.id === tagId);
	};

	const getList = (listId: string) => {
		return lists.find((l) => l.id === listId);
	};

	const getFlashcardCount = (listId: string) => {
		return flashcards.filter((f) => f.listId === listId).length;
	};

	if (!currentUser) {
		return null;
	}

	const selectedList = selectedListId ? getList(selectedListId) : null;

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
				<Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
					<DialogTrigger asChild>
						<Button
							onClick={() => setEditingList(undefined)}
							className="bg-blue-600 hover:bg-blue-700"
						>
							<Plus className="h-4 w-4 mr-2" />
							Tạo List
						</Button>
					</DialogTrigger>
					<ListDialog
						open={listDialogOpen}
						onOpenChange={setListDialogOpen}
						list={editingList}
						onSave={handleAddList}
					/>
				</Dialog>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my' | 'discover')}>
				<TabsList>
					<TabsTrigger value="my">
						Flashcard của tôi
					</TabsTrigger>
					<TabsTrigger value="discover">
						Khám phá ({otherFlashcards.length})
					</TabsTrigger>
				</TabsList>

				{/* My Lists Tab */}
				<TabsContent value="my" className="space-y-6">
					{!selectedListId ? (
						// Hiển thị danh sách các list
						<div className="space-y-4">
							<h2 className="text-xl font-semibold text-gray-900">
								Danh sách của tôi ({myLists.length})
							</h2>
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
										>
											<Plus className="h-4 w-4 mr-2" />
											Tạo List
										</Button>
									</CardContent>
								</Card>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{myLists.map((list) => (
										<Card
											key={list.id}
											className="cursor-pointer hover:shadow-lg transition-all group"
											onClick={() => setSelectedListId(list.id)}
										>
											<CardHeader>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<CardTitle className="flex items-center gap-2">
															<Folder className="h-5 w-5 text-blue-600" />
															{list.name}
														</CardTitle>
														{list.description && (
															<p className="text-sm text-gray-600 mt-1">
																{list.description}
															</p>
														)}
													</div>
												</div>
											</CardHeader>
											<CardContent>
												<div className="flex items-center justify-between">
													<span className="text-sm text-gray-500">
														{getFlashcardCount(list.id)} flashcard
													</span>
													<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
														<Button
															variant="ghost"
															size="sm"
															className="h-8 w-8 p-0"
															onClick={(e) => {
																e.stopPropagation();
																handleEditList(list);
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
																handleDeleteList(list.id);
															}}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</div>
												<Button
													className="w-full mt-4"
													onClick={(e) => {
														e.stopPropagation();
														setSelectedListId(list.id);
													}}
												>
													Xem flashcard
													<ChevronRight className="h-4 w-4 ml-2" />
												</Button>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</div>
					) : (
						// Hiển thị flashcard trong list đã chọn
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelectedListId(null)}
									>
										<ChevronRight className="h-4 w-4 mr-1 rotate-180" />
										Quay lại
									</Button>
									<div>
										<h2 className="text-xl font-semibold text-gray-900">
											{selectedList?.name}
										</h2>
										{selectedList?.description && (
											<p className="text-sm text-gray-600">
												{selectedList.description}
											</p>
										)}
									</div>
								</div>
								<Dialog open={flashcardDialogOpen} onOpenChange={setFlashcardDialogOpen}>
									<DialogTrigger asChild>
										<Button
											onClick={() => {
												setEditingFlashcard(undefined);
											}}
											className="bg-blue-600 hover:bg-blue-700"
										>
											<Plus className="h-4 w-4 mr-2" />
											Thêm Flashcard
										</Button>
									</DialogTrigger>
									<FlashcardDialog
										open={flashcardDialogOpen}
										onOpenChange={setFlashcardDialogOpen}
										flashcard={editingFlashcard}
										selectedListId={selectedListId}
										onSave={handleAddFlashcard}
									/>
								</Dialog>
							</div>

							{/* Search and Filter */}
							<div className="flex items-center gap-4">
								<div className="flex-1 relative">
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
							{filteredFlashcardsInList.length === 0 ? (
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
										>
											<Plus className="h-4 w-4 mr-2" />
											Thêm Flashcard
										</Button>
									</CardContent>
								</Card>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{filteredFlashcardsInList.map((flashcard) => (
										<FlashcardCard
											key={flashcard.id}
											flashcard={flashcard}
											tag={getTag(flashcard.tagId)}
											isOwned={true}
											onEdit={() => handleEditFlashcard(flashcard)}
											onDelete={() => handleDeleteFlashcard(flashcard.id)}
										/>
									))}
								</div>
							)}
						</div>
					)}
				</TabsContent>

				{/* Discover Tab */}
				<TabsContent value="discover" className="space-y-4">
					<div className="space-y-4">
						{/* Header với thống kê */}
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold text-gray-900">
									Khám phá Flashcards
								</h2>
								<p className="text-sm text-gray-600 mt-1">
									Xem và thêm flashcard từ cộng đồng ({filteredOtherFlashcards.length} flashcard)
								</p>
							</div>
						</div>

						{/* Filters */}
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
							<Select value={selectedOtherListId} onValueChange={setSelectedOtherListId}>
								<SelectTrigger className="w-56">
									<Folder className="h-4 w-4 mr-2" />
									<SelectValue placeholder="Lọc theo list" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__all__">Tất cả các list</SelectItem>
									{otherLists.map((list) => {
										const owner = getOwnerName(list.userId);
										const count = flashcards.filter((f) => f.listId === list.id).length;
										return (
											<SelectItem key={list.id} value={list.id}>
												<div className="flex items-center justify-between w-full">
													<span>{list.name}</span>
													<span className="text-xs text-gray-500 ml-2">
														({count} từ {owner})
													</span>
												</div>
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
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
							{(searchQuery || (selectedTagId && selectedTagId !== '__all__') || (selectedOtherListId && selectedOtherListId !== '__all__')) && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSearchQuery('');
										setSelectedTagId('__all__');
										setSelectedOtherListId('__all__');
									}}
								>
									<X className="h-4 w-4 mr-1" />
									Xóa bộ lọc
								</Button>
							)}
						</div>

						{/* Info Cards */}
						{myLists.length === 0 ? (
							<Card className="bg-yellow-50 border-yellow-200">
								<CardContent className="p-4">
									<p className="text-sm text-yellow-800">
										<strong>Lưu ý:</strong> Bạn cần tạo ít nhất một list để thêm flashcard từ người khác vào bộ sưu tập của mình.
									</p>
								</CardContent>
							</Card>
						) : (
							<Card className="bg-blue-50 border-blue-200">
								<CardContent className="p-4">
									<p className="text-sm text-blue-800">
										<strong>💡 Mẹo:</strong> Click vào icon <Copy className="h-3 w-3 inline mx-1" /> trên flashcard để thêm vào list của bạn.
									</p>
								</CardContent>
							</Card>
						)}

						{/* Results */}
						{filteredOtherFlashcards.length === 0 ? (
							<Card>
								<CardContent className="py-12 text-center">
									<Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
									<p className="text-gray-500 mb-2">
										{searchQuery || (selectedTagId && selectedTagId !== '__all__') || (selectedOtherListId && selectedOtherListId !== '__all__')
											? 'Không tìm thấy flashcard nào phù hợp'
											: 'Chưa có flashcard từ người dùng khác'}
									</p>
									{(selectedOtherListId && selectedOtherListId !== '__all__') && (
										<Button
											variant="outline"
											size="sm"
											className="mt-4"
											onClick={() => setSelectedOtherListId('__all__')}
										>
											Xem tất cả flashcard
										</Button>
									)}
								</CardContent>
							</Card>
						) : (
							<div className="space-y-4">
								{/* Hiển thị thông tin list nếu đang lọc theo list */}
								{selectedOtherListId && selectedOtherListId !== '__all__' && (() => {
									const selectedList = getList(selectedOtherListId);
									if (!selectedList) return null;
									return (
										<Card className="bg-gray-50 border-gray-200">
											<CardContent className="p-4">
												<div className="flex items-center justify-between">
													<div>
														<h3 className="font-semibold text-gray-900 flex items-center gap-2">
															<Folder className="h-5 w-5 text-blue-600" />
															{selectedList.name}
														</h3>
														{selectedList.description && (
															<p className="text-sm text-gray-600 mt-1">
																{selectedList.description}
															</p>
														)}
														<p className="text-xs text-gray-500 mt-1">
															Bởi: {getOwnerName(selectedList.userId)} • {filteredOtherFlashcards.length} flashcard
														</p>
													</div>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setSelectedOtherListId('__all__')}
													>
														<X className="h-4 w-4 mr-1" />
														Bỏ lọc
													</Button>
												</div>
											</CardContent>
										</Card>
									);
								})()}

								{/* Flashcard Grid */}
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{filteredOtherFlashcards.map((flashcard) => {
										const list = getList(flashcard.listId);
										return (
											<FlashcardCard
												key={flashcard.id}
												flashcard={flashcard}
												tag={getTag(flashcard.tagId)}
												ownerName={getOwnerName(flashcard.userId)}
												listName={list?.name}
												isOwned={false}
												onCopy={() => {
													if (myLists.length === 0) {
														alert('Vui lòng tạo ít nhất một list trước khi thêm flashcard');
														return;
													}
													setFlashcardToCopy(flashcard);
													setSelectListDialogOpen(true);
												}}
											/>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</TabsContent>
			</Tabs>

			{/* Dialog chọn list để copy flashcard */}
			<Dialog open={selectListDialogOpen} onOpenChange={setSelectListDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Chọn List để thêm Flashcard</DialogTitle>
						<DialogDescription>
							Chọn list mà bạn muốn thêm flashcard này vào
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2 py-4">
						{myLists.map((list) => (
							<Button
								key={list.id}
								variant="outline"
								className="w-full justify-start"
								onClick={() => {
									if (flashcardToCopy && currentUser) {
										const newFlashcard: FlashCard = {
											id: `f${Date.now()}`,
											userId: currentUser.id,
											listId: list.id,
											content: flashcardToCopy.content,
											notes: flashcardToCopy.notes,
											tagId: flashcardToCopy.tagId,
										};
										dispatch(addFlashCard(newFlashcard));
										alert(`Đã thêm flashcard vào list "${list.name}"!`);
										setSelectListDialogOpen(false);
										setFlashcardToCopy(null);
									}
								}}
							>
								<Folder className="h-4 w-4 mr-2" />
								<div className="flex-1 text-left">
									<div className="font-medium">{list.name}</div>
									{list.description && (
										<div className="text-xs text-gray-500">{list.description}</div>
									)}
								</div>
								<ChevronRight className="h-4 w-4" />
							</Button>
						))}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => {
							setSelectListDialogOpen(false);
							setFlashcardToCopy(null);
						}}>
							Hủy
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
