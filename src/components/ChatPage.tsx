'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch, useIsStoreHydrated } from '@/lib/store/hooks';
import { addChatRoom, updateChatRoom, removeChatRoom } from '@/components/store/chatRoomSlice';
import { addChatMessage } from '@/components/store/chatMessageSlice';
import { addUser } from '@/components/store/userSlice';
import { ChatRoomService } from '@/lib/api/services/ChatRoomService';
import { useAuth } from '@/lib/hooks/useAuth';
import { ChatRoom, ChatMessage, User } from '@/types/client';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
	Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from './ui/dialog';
import { Label } from './ui/label';
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
	AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';
import {
	MessageCircle, Plus, Send, Hash, ArrowLeft,
	Video, Calendar, Trash2, Search, Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:1511';

function CreateRoomDialog({ open, onOpenChange, onSave }: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (name: string, liveUrl?: string, liveDate?: number) => void;
}) {
	const [name, setName] = useState('');
	const [liveUrl, setLiveUrl] = useState('');
	const [liveDate, setLiveDate] = useState('');

	const handleSave = () => {
		if (!name.trim()) return;
		onSave(name.trim(), liveUrl.trim() || undefined, liveDate ? new Date(liveDate).getTime() : undefined);
		setName(''); setLiveUrl(''); setLiveDate('');
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
				<div className="h-2 w-full bg-primary" />
				<DialogHeader className="px-6 pt-6 pb-2">
					<DialogTitle className="text-xl font-bold">Tạo phòng chat mới</DialogTitle>
					<DialogDescription className="text-gray-500">Tạo phòng trò chuyện nhóm mới</DialogDescription>
				</DialogHeader>
				<div className="px-6 py-4 space-y-4">
					<div className="space-y-2">
						<Label className="font-bold">Tên phòng <span className="text-red-500">*</span></Label>
						<Input placeholder="VD: IELTS Study Group" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
					</div>
					<div className="space-y-2">
						<Label className="font-bold">URL phát trực tiếp (tùy chọn)</Label>
						<Input placeholder="https://meet.google.com/..." value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} className="rounded-xl" />
					</div>
					{liveUrl && (
						<div className="space-y-2">
							<Label className="font-bold">Ngày giờ dự kiến</Label>
							<Input type="datetime-local" value={liveDate} onChange={(e) => setLiveDate(e.target.value)} className="rounded-xl" />
						</div>
					)}
				</div>
				<DialogFooter className="px-6 py-4 bg-gray-50 border-t">
					<Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Hủy</Button>
					<Button onClick={handleSave} disabled={!name.trim()} className="rounded-xl">Tạo phòng</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function EditRoomScheduleDialog({ room, open, onOpenChange, onSave }: {
	room: ChatRoom | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (url?: string, time?: number, clearUrl?: boolean, clearTime?: boolean) => void;
}) {
	const [url, setUrl] = useState(room?.scheduledLiveUrl ?? '');
	const [liveDate, setLiveDate] = useState(
		room?.scheduledDate ? new Date(room.scheduledDate).toISOString().slice(0, 16) : ''
	);
	const [clearUrl, setClearUrl] = useState(false);
	const [clearTime, setClearTime] = useState(false);

	useEffect(() => {
		setUrl(room?.scheduledLiveUrl ?? '');
		setLiveDate(room?.scheduledDate ? new Date(room.scheduledDate).toISOString().slice(0, 16) : '');
		setClearUrl(false);
		setClearTime(false);
	}, [room]);

	const currentUrl = clearUrl ? '' : url;
	const currentDate = clearTime ? '' : liveDate;

	const handleSave = () => {
		onSave(
			currentUrl || undefined,
			currentDate ? new Date(currentDate).getTime() : undefined,
			clearUrl && !currentUrl,
			clearTime && !currentDate,
		);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
				<div className="h-2 w-full bg-primary" />
				<DialogHeader className="px-6 pt-6 pb-2">
					<DialogTitle className="text-xl font-bold">Chỉnh sửa phòng: {room?.name}</DialogTitle>
					<DialogDescription className="text-gray-500">Cập nhật lịch livestream</DialogDescription>
				</DialogHeader>
				<div className="px-6 py-4 space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="font-bold">URL phát trực tiếp</Label>
							{room?.scheduledLiveUrl && !clearUrl && (
								<Button variant="ghost" size="sm" className="text-red-500 h-auto px-2 py-1 text-xs" onClick={() => setClearUrl(true)}>
									Xóa URL
								</Button>
							)}
							{clearUrl && (
								<Button variant="ghost" size="sm" className="text-blue-500 h-auto px-2 py-1 text-xs" onClick={() => setClearUrl(false)}>
									Khôi phục
								</Button>
							)}
						</div>
						<Input
							placeholder={clearUrl ? '' : (room?.scheduledLiveUrl || 'Nhập URL...')}
							value={currentUrl}
							onChange={(e) => { setUrl(e.target.value); setClearUrl(false); }}
							className="rounded-xl"
						/>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="font-bold">Ngày giờ dự kiến</Label>
							{room?.scheduledDate && !clearTime && (
								<Button variant="ghost" size="sm" className="text-red-500 h-auto px-2 py-1 text-xs" onClick={() => setClearTime(true)}>
									Xóa ngày
								</Button>
							)}
							{clearTime && (
								<Button variant="ghost" size="sm" className="text-blue-500 h-auto px-2 py-1 text-xs" onClick={() => setClearTime(false)}>
									Khôi phục
								</Button>
							)}
						</div>
						<Input
							type="datetime-local"
							value={currentDate}
							onChange={(e) => { setLiveDate(e.target.value); setClearTime(false); }}
							className="rounded-xl"
						/>
					</div>
				</div>
				<DialogFooter className="px-6 py-4 bg-gray-50 border-t">
					<Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Hủy</Button>
					<Button onClick={handleSave} className="rounded-xl">Lưu</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function getEmbedUrl(url: string): string | null {
	try {
		const parsed = new URL(url);
		// YouTube
		if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
			let videoId = parsed.searchParams.get('v');
			if (!videoId) {
				const pathParts = parsed.pathname.split('/').filter(Boolean);
				if (pathParts[0] === 'live' || pathParts[0] === 'embed') videoId = pathParts[1];
				else if (parsed.hostname.includes('youtu.be')) videoId = pathParts[0];
				else videoId = pathParts[pathParts.length - 1];
			}
			if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
		}
		// Twitch
		if (parsed.hostname.includes('twitch.tv')) {
			const channel = parsed.pathname.split('/').filter(Boolean)[0];
			if (channel) return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
		}
	} catch {
		// invalid URL
	}
	return null;
}

function ChatRoomView({ room, onBack }: { room: ChatRoom; onBack: () => void }) {
	const dispatch = useAppDispatch();
	const { currUser } = useAuth();
	const users = useAppSelector((state) => state.users.list);
	const allMessages = useAppSelector((state) => state.chatMessages.list);
	const [input, setInput] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const socketRef = useRef<Socket | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	const messages = useMemo(
		() => allMessages.filter((m) => m.roomId === room.id).sort((a, b) => a.createdAt - b.createdAt),
		[allMessages, room.id]
	);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages.length]);

	useEffect(() => {
		const token = typeof window !== 'undefined'
			? window.localStorage.getItem('access_token') || document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*=\s*([^;]*).*$)|^.*$/, '$1')
			: null;
		const socket = io(SOCKET_URL, {
			transports: ['websocket'],
			extraHeaders: { Authorization: token ? `Bearer ${token}` : '' },
		});
		socketRef.current = socket;

		socket.emit('join-room', room.id);

		socket.on('message', (data: { id: string; fromId: string; message: string; createdAt: string }) => {
			const msg: ChatMessage = {
				id: data.id,
				roomId: room.id,
				uid: data.fromId,
				message: data.message,
				createdAt: new Date(data.createdAt).getTime(),
			};
			dispatch(addChatMessage(msg));
			if (data.fromId && !users.find((u) => u.id === data.fromId)) {
				fetch(`/api/v1/auth/hydrate?id=${data.fromId}`)
					.then((r) => r.json())
					.then((res) => {
						const d = res?.data ?? res;
						if (d?.id) {
							const user: User = {
								id: d.id,
								email: d.email ?? '',
								password: '',
								fullName: d.fullName ?? d.username ?? 'Ẩn danh',
								roleId: d.roles?.[0] ?? '',
								status: 'active',
								createdAt: Date.now(),
							};
							dispatch(addUser(user));
						}
					})
					.catch(() => {});
			}
		});

		return () => {
			socket.emit('leave-room', room.id);
			socket.disconnect();
		};
	}, [room.id, dispatch]);

	const getUserName = (uid: string) => users.find((u) => u.id === uid)?.fullName || 'Ẩn danh';

	const handleSend = () => {
		if (!input.trim() || !socketRef.current) return;
		socketRef.current.emit('chat', {
			roomId: room.id,
			message: input.trim(),
		});
		setInput('');
	};

	const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

	const formatDate = (ts: number) => {
		const d = new Date(ts);
		const today = new Date();
		if (d.toDateString() === today.toDateString()) return 'Hôm nay';
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
		return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
	};

	let lastDateLabel = '';

	const embedUrl = room.scheduledLiveUrl ? getEmbedUrl(room.scheduledLiveUrl) : null;

	return (
		<div className="flex flex-col h-[calc(100vh-4rem)]">
			{/* Header */}
			<div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
				<Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div className="flex-1 min-w-0">
					<h2 className="font-bold text-lg truncate">{room.name}</h2>
				</div>
				<Button size="sm" variant="ghost" className="rounded-xl gap-1" onClick={() => setEditDialogOpen(true)}>
					<Settings className="h-4 w-4" />
				</Button>
				{room.scheduledLiveUrl && (
					<a href={room.scheduledLiveUrl} target="_blank" rel="noopener noreferrer">
						<Button size="sm" variant="outline" className="rounded-xl gap-1">
							<Video className="h-4 w-4" /> Mở tab mới
						</Button>
					</a>
				)}
			</div>
			<EditRoomScheduleDialog
				room={room}
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
				onSave={async (url, time, clearUrl, clearTime) => {
					try {
						await ChatRoomService.updateSchedule(room.id, {
							url,
							time: time ? new Date(time).toISOString() : undefined,
							setUrlNull: clearUrl,
							setTimeNull: clearTime,
						});
						dispatch(updateChatRoom({
							...room,
							scheduledLiveUrl: clearUrl ? undefined : (url || room.scheduledLiveUrl),
							scheduledDate: clearTime ? undefined : (time || room.scheduledDate),
						}));
					} catch (err) {
						console.error('Failed to update room schedule:', err);
					}
				}}
			/>

			{/* Live Stream Iframe */}
			{embedUrl && (
				<div className="shrink-0 bg-black">
					<iframe
						src={embedUrl}
						className="w-full aspect-video max-h-[40vh]"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
						title="Live Stream"
					/>
				</div>
			)}

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50">
				{room.scheduledLiveUrl && room.scheduledDate && (
					<div className="flex justify-center mb-4">
						<div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
							<Calendar className="h-4 w-4" />
							Live dự kiến: {new Date(room.scheduledDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
						</div>
					</div>
				)}
				{messages.map((msg) => {
					const isMe = msg.uid === currUser?.id;
					const dateLabel = formatDate(msg.createdAt);
					let showDateSep = false;
					if (dateLabel !== lastDateLabel) { showDateSep = true; lastDateLabel = dateLabel; }
					return (
						<React.Fragment key={msg.id}>
							{showDateSep && (
								<div className="flex items-center gap-3 my-4">
									<div className="flex-1 h-px bg-gray-200" />
									<span className="text-xs text-gray-400 font-medium">{dateLabel}</span>
									<div className="flex-1 h-px bg-gray-200" />
								</div>
							)}
							<div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
								<div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
									{!isMe && (
										<p className="text-xs font-semibold text-gray-500 mb-0.5 ml-3">{getUserName(msg.uid)}</p>
									)}
									<div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-md' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md shadow-sm'}`}>
										{msg.message}
									</div>
									<p className={`text-[10px] text-gray-400 mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-3'}`}>{formatTime(msg.createdAt)}</p>
								</div>
							</div>
						</React.Fragment>
					);
				})}
				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<div className="bg-white border-t px-4 py-3 shrink-0">
				<div className="flex items-center gap-2">
					<Input
						placeholder="Nhập tin nhắn..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
						className="rounded-full flex-1"
					/>
					<Button size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={!input.trim()}>
						<Send className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

export default function ChatPage() {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { currUser } = useAuth();
	const isHydrated = useIsStoreHydrated();
	const rooms = useAppSelector((state) => state.chatRooms.list);
	const allMessages = useAppSelector((state) => state.chatMessages.list);
	const users = useAppSelector((state) => state.users.list);

	const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		if (isHydrated && !currUser) router.push('/auth');
	}, [isHydrated, currUser, router]);

	const getUserName = (uid: string) => users.find((u) => u.id === uid)?.fullName || 'Ẩn danh';

	const getLastMessage = (roomId: string) => {
		const msgs = allMessages.filter((m) => m.roomId === roomId);
		if (msgs.length === 0) return null;
		return msgs.sort((a, b) => b.createdAt - a.createdAt)[0];
	};

	const filteredRooms = useMemo(() => {
		const sorted = [...rooms].sort((a, b) => {
			const lastA = getLastMessage(a.id)?.createdAt ?? 0;
			const lastB = getLastMessage(b.id)?.createdAt ?? 0;
			return lastB - lastA;
		});
		if (!searchQuery) return sorted;
		const q = searchQuery.toLowerCase();
		return sorted.filter((r) => r.name.toLowerCase().includes(q));
	}, [rooms, searchQuery, allMessages]);

	const handleCreateRoom = async (name: string, liveUrl?: string, liveDate?: number) => {
		if (!currUser) return;
		try {
			const res = await ChatRoomService.createRoom({ name });
			const newRoom: ChatRoom = {
				id: res.id,
				name: res.name,
				scheduledLiveUrl: res.scheduledLiveUrl,
				scheduledDate: res.scheduledDate ? new Date(res.scheduledDate).getTime() : undefined,
			};
			if (liveUrl || liveDate) {
				await ChatRoomService.updateSchedule(res.id, {
					url: liveUrl,
					time: liveDate ? new Date(liveDate).toISOString() : undefined,
				});
				newRoom.scheduledLiveUrl = liveUrl;
				newRoom.scheduledDate = liveDate;
			}
			dispatch(addChatRoom(newRoom));
		} catch (err) {
			console.error('Failed to create room:', err);
		}
	};

	const handleDeleteRoom = async () => {
		if (!deleteRoomId) return;
		try {
			await ChatRoomService.deleteRoom(deleteRoomId);
			dispatch(removeChatRoom(deleteRoomId));
			setDeleteRoomId(null);
		} catch (err) {
			console.error('Failed to delete room:', err);
		}
	};

	const formatRelativeTime = (ts: number) => {
		const diff = Date.now() - ts;
		if (diff < 60000) return 'Vừa xong';
		if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
		if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ`;
		return `${Math.floor(diff / 86400000)} ngày`;
	};

	if (!isHydrated || !currUser) return null;

	if (selectedRoom) {
		return <ChatRoomView room={selectedRoom} onBack={() => setSelectedRoom(null)} />;
	}

	return (
		<div className="min-h-screen bg-background pb-20">
			{/* Hero Header */}
			<div className="relative overflow-hidden bg-primary text-white">
				<div className="absolute inset-0 bg-black/10" />
				<div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
				<div className="relative container mx-auto px-6 py-10">
					<div className="flex items-center justify-between">
						<div>
							<div className="flex items-center gap-3 mb-2">
								<MessageCircle className="h-7 w-7" />
								<h1 className="text-3xl font-bold">Phòng Chat</h1>
							</div>
							<p className="text-white/80">Trao đổi và học tập cùng cộng đồng</p>
						</div>
						<Button onClick={() => setCreateDialogOpen(true)} className="bg-white text-primary hover:bg-gray-100 rounded-xl px-6 py-6 font-bold shadow-lg">
							<Plus className="h-5 w-5 mr-2" /> Tạo phòng
						</Button>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-6 mt-6">
				{/* Search */}
				<div className="relative mb-6">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input placeholder="Tìm phòng chat..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
				</div>

				{/* Room List */}
				{filteredRooms.length === 0 ? (
					<div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
						<MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
						<h3 className="text-lg font-bold text-gray-800">Chưa có phòng chat</h3>
						<p className="text-gray-500 mt-1">Tạo phòng mới để bắt đầu trò chuyện</p>
						<Button className="mt-4 rounded-xl" onClick={() => setCreateDialogOpen(true)}>
							<Plus className="h-4 w-4 mr-1" /> Tạo phòng đầu tiên
						</Button>
					</div>
				) : (
					<div className="space-y-3">
						{filteredRooms.map((room) => {
							const lastMsg = getLastMessage(room.id);
							return (
								<Card key={room.id} className="hover:shadow-lg transition-all cursor-pointer border-0 shadow-sm group" onClick={() => setSelectedRoom(room)}>
									<CardContent className="p-4 flex items-center gap-4">
										<div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
											<Hash className="h-6 w-6 text-primary" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-0.5">
												<h3 className="font-bold text-gray-900 truncate">{room.name}</h3>
												{room.scheduledLiveUrl && (
													<Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">
														<Video className="h-3 w-3 mr-0.5" /> Live
													</Badge>
												)}
											</div>
											<p className="text-sm text-gray-500 truncate">
												{lastMsg ? `${getUserName(lastMsg.uid)}: ${lastMsg.message}` : 'Chưa có tin nhắn'}
											</p>
										</div>
										<div className="text-right shrink-0 flex items-center gap-2">
											<div>
												<p className="text-xs text-gray-400">{lastMsg ? formatRelativeTime(lastMsg.createdAt) : ''}</p>
											</div>
											<Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50"
												onClick={(e) => { e.stopPropagation(); setDeleteRoomId(room.id); }}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>

			<CreateRoomDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSave={handleCreateRoom} />

			<AlertDialog open={!!deleteRoomId} onOpenChange={(open) => { if (!open) setDeleteRoomId(null); }}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xóa phòng chat?</AlertDialogTitle>
						<AlertDialogDescription>Toàn bộ tin nhắn trong phòng sẽ bị xóa. Hành động không thể hoàn tác.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Hủy</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteRoom} className="bg-red-600 hover:bg-red-700">Xóa phòng</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
