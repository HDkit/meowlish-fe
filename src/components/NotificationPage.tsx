'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/lib/store/hooks';
import { NotificationType } from '@/types/client';
import { NotificationService, type NotificationResponse } from '@/lib/api/services/NotificationService';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
	Bell, Trophy, Flag, Info, CheckCheck, Filter,
} from 'lucide-react';
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import { NavPagination } from './ui/nav-pagination';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
	report: { label: 'Phản hồi báo cáo', icon: Flag, color: 'text-orange-600 bg-orange-100' },
	achievement: { label: 'Thành tích', icon: Trophy, color: 'text-amber-600 bg-amber-100' },
	system: { label: 'Hệ thống', icon: Info, color: 'text-gray-600 bg-gray-100' },
};

const DEFAULT_TYPE_CONFIG = { label: 'Thông báo', icon: Bell, color: 'text-gray-600 bg-gray-100' };

type FilterType = NotificationType | 'all';

function mapNotif(n: NotificationResponse) {
	return {
		...n,
		createdAt: new Date(n.createdAt).getTime(),
	};
}

export default function NotificationPage() {
	const currUser = useAppSelector((state) => (state as any).currUser?.entity ?? (state as any).currUser?.current);
	const { markAsRead, markAllAsRead, unreadCount } = useNotifications();

	const [filterType, setFilterType] = useState<FilterType>('all');
	const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [notifications, setNotifications] = useState<(NotificationResponse & { createdAt: number })[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const limit = 20;

	useEffect(() => { setPage(1); }, [filterType, filterRead]);

	const fetchNotifications = useCallback(async () => {
		if (!currUser?.id) return;
		setLoading(true);
		try {
			const res = await NotificationService.listNotifications(
				currUser.id,
				filterType === 'all' ? undefined : filterType,
				filterRead === 'all' ? undefined : filterRead === 'unread' ? false : true,
				page,
				limit,
			);
			const data = (res as any)?.data ?? res;
			setNotifications((data.notifications ?? []).map(mapNotif));
			setTotalCount(data.totalCount ?? 0);
		} catch (err) {
			console.error('[NotificationPage] fetch error:', err);
			setNotifications([]);
			setTotalCount(0);
		} finally {
			setLoading(false);
		}
	}, [currUser?.id, filterType, filterRead, page]);

	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	const totalPages = Math.max(1, Math.ceil(totalCount / limit));

	return (
		<div className="min-h-screen bg-background pb-20">
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
							<Button onClick={markAllAsRead} className="bg-white/15 hover:bg-white/25 text-white border-0 rounded-xl">
								<CheckCheck className="h-4 w-4 mr-2" /> Đánh dấu tất cả đã đọc
							</Button>
						)}
					</div>
				</div>
			</div>

			<div className="container mx-auto px-6 mt-6">
				<div className="flex flex-wrap gap-3 mb-6">
					<Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
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

				{loading ? (
					<div className="text-center py-16 text-muted-foreground">Đang tải...</div>
				) : notifications.length === 0 ? (
					<div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
						<Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
						<h3 className="text-lg font-bold text-gray-800">Không có thông báo</h3>
						<p className="text-gray-500 mt-1">Chưa có thông báo nào phù hợp với bộ lọc</p>
					</div>
				) : (
					<div className="space-y-3">
						{notifications.map((notif) => {
							const conf = TYPE_CONFIG[notif.type] ?? DEFAULT_TYPE_CONFIG;
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
											<Button variant="ghost" size="sm" className="shrink-0 text-xs rounded-lg" onClick={() => markAsRead(notif.id)}>
												Đánh dấu đã đọc
											</Button>
										)}
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
				<NavPagination page={page} totalPages={totalPages} onPageChange={setPage} />
			</div>
		</div>
	);
}

function formatDate(ts: number) {
	const diff = Date.now() - ts;
	if (diff < 60000) return 'Vừa xong';
	if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
	if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
	return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
