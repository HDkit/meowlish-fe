'use client';

import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { updateNotification } from '@/components/store/notificationSlice';
import { Notification, NotificationType } from '@/types/client';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
	Bell, BookOpen, Flag, Info, CheckCheck, Filter,
} from 'lucide-react';
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: React.ElementType; color: string }> = {
	[NotificationType.BlogFollow]: { label: 'Bài viết mới', icon: BookOpen, color: 'text-blue-600 bg-blue-100' },
	[NotificationType.ReportResponse]: { label: 'Phản hồi báo cáo', icon: Flag, color: 'text-orange-600 bg-orange-100' },
	[NotificationType.System]: { label: 'Hệ thống', icon: Info, color: 'text-gray-600 bg-gray-100' },
};

export default function NotificationPage() {
	const dispatch = useAppDispatch();
	const currUser = useAppSelector((state) => state.currUser.current);
	const allNotifications = useAppSelector((state) => state.notifications.list);

	const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
	const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

	const myNotifications = useMemo(() => {
		let filtered = allNotifications.filter((n) => n.userId === currUser?.id);
		if (filterType !== 'all') filtered = filtered.filter((n) => n.type === filterType);
		if (filterRead === 'unread') filtered = filtered.filter((n) => !n.isRead);
		if (filterRead === 'read') filtered = filtered.filter((n) => n.isRead);
		return filtered.sort((a, b) => b.createdAt - a.createdAt);
	}, [allNotifications, currUser?.id, filterType, filterRead]);

	const unreadCount = allNotifications.filter((n) => n.userId === currUser?.id && !n.isRead).length;

	const handleMarkRead = (notif: Notification) => {
		dispatch(updateNotification({ ...notif, isRead: true }));
	};

	const handleMarkAllRead = () => {
		allNotifications
			.filter((n) => n.userId === currUser?.id && !n.isRead)
			.forEach((n) => dispatch(updateNotification({ ...n, isRead: true })));
	};

	const formatDate = (ts: number) => {
		const diff = Date.now() - ts;
		if (diff < 60000) return 'Vừa xong';
		if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
		if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
		return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	};

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
								<Bell className="h-7 w-7" />
								<h1 className="text-3xl font-bold">Thông báo</h1>
								{unreadCount > 0 && (
									<Badge className="bg-white/20 text-white border-0">{unreadCount} chưa đọc</Badge>
								)}
							</div>
							<p className="text-white/80">Theo dõi các cập nhật và phản hồi</p>
						</div>
						{unreadCount > 0 && (
							<Button onClick={handleMarkAllRead} className="bg-white/15 hover:bg-white/25 text-white border-0 rounded-xl">
								<CheckCheck className="h-4 w-4 mr-2" /> Đánh dấu tất cả đã đọc
							</Button>
						)}
					</div>
				</div>
			</div>

			<div className="container mx-auto px-6 mt-6">
				{/* Filters */}
				<div className="flex flex-wrap gap-3 mb-6">
					<Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
						<SelectTrigger className="w-[200px] rounded-xl">
							<Filter className="h-4 w-4 mr-2" />
							<SelectValue placeholder="Loại thông báo" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tất cả loại</SelectItem>
							{Object.entries(TYPE_CONFIG).map(([k, v]) => (
								<SelectItem key={k} value={k}>{v.label}</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={filterRead} onValueChange={(v) => setFilterRead(v as any)}>
						<SelectTrigger className="w-[180px] rounded-xl">
							<SelectValue placeholder="Trạng thái" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tất cả</SelectItem>
							<SelectItem value="unread">Chưa đọc</SelectItem>
							<SelectItem value="read">Đã đọc</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Notification List */}
				{myNotifications.length === 0 ? (
					<div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
						<Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
						<h3 className="text-lg font-bold text-gray-800">Không có thông báo</h3>
						<p className="text-gray-500 mt-1">Chưa có thông báo nào phù hợp với bộ lọc</p>
					</div>
				) : (
					<div className="space-y-3">
						{myNotifications.map((notif) => {
							const conf = TYPE_CONFIG[notif.type];
							const Icon = conf.icon;
							return (
								<Card key={notif.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${!notif.isRead ? 'ring-1 ring-primary/20 bg-primary/[0.02]' : ''}`}>
									<CardContent className="p-4 flex items-start gap-4">
										<div className={`w-10 h-10 rounded-full ${conf.color} flex items-center justify-center shrink-0`}>
											<Icon className="h-5 w-5" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h3 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
													{notif.title}
												</h3>
												{!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
												<Badge variant="outline" className="text-[10px] ml-auto shrink-0">{conf.label}</Badge>
											</div>
											<p className="text-sm text-gray-600">{notif.message}</p>
											<p className="text-xs text-gray-400 mt-2">{formatDate(notif.createdAt)}</p>
										</div>
										{!notif.isRead && (
											<Button variant="ghost" size="sm" className="shrink-0 text-xs rounded-lg" onClick={() => handleMarkRead(notif)}>
												Đánh dấu đã đọc
											</Button>
										)}
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
