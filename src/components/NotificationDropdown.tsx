'use client';

import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { updateNotification } from '@/components/store/notificationSlice';
import { Notification, NotificationType } from '@/types/client';
import { Button } from './ui/button';
import {
	Popover, PopoverContent, PopoverTrigger,
} from './ui/popover';
import {
	Bell, BookOpen, Flag, Info, CheckCheck, ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string }> = {
	[NotificationType.BlogFollow]: { icon: BookOpen, color: 'text-blue-600 bg-blue-100' },
	[NotificationType.ReportResponse]: { icon: Flag, color: 'text-orange-600 bg-orange-100' },
	[NotificationType.System]: { icon: Info, color: 'text-gray-600 bg-gray-100' },
};

export function NotificationDropdown() {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const currUser = useAppSelector((state) => state.currUser.current);
	const allNotifications = useAppSelector((state) => state.notifications.list);
	const [open, setOpen] = useState(false);

	const myNotifications = useMemo(
		() => allNotifications
			.filter((n) => n.userId === currUser?.id)
			.sort((a, b) => b.createdAt - a.createdAt),
		[allNotifications, currUser?.id]
	);

	const unreadCount = myNotifications.filter((n) => !n.isRead).length;

	const handleClick = (notif: Notification) => {
		if (!notif.isRead) {
			dispatch(updateNotification({ ...notif, isRead: true }));
		}
		if (notif.linkType === 'blog') {
			router.push('/blog');
		} else if (notif.linkType === 'report') {
			router.push('/notifications');
		}
		setOpen(false);
	};

	const handleMarkAllRead = () => {
		myNotifications.filter((n) => !n.isRead).forEach((n) => {
			dispatch(updateNotification({ ...n, isRead: true }));
		});
	};

	const formatRelativeTime = (ts: number) => {
		const diff = Date.now() - ts;
		if (diff < 60000) return 'Vừa xong';
		if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
		if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
		return `${Math.floor(diff / 86400000)} ngày trước`;
	};

	if (!currUser) return null;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="icon" className="relative rounded-full">
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
							{unreadCount > 9 ? '9+' : unreadCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-96 p-0 rounded-2xl shadow-2xl border-0" align="end" sideOffset={8}>
				<div className="px-4 py-3 border-b flex items-center justify-between">
					<h3 className="font-bold text-gray-900">Thông báo</h3>
					{unreadCount > 0 && (
						<Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80 rounded-lg" onClick={handleMarkAllRead}>
							<CheckCheck className="h-3.5 w-3.5 mr-1" /> Đọc tất cả
						</Button>
					)}
				</div>
				<div className="max-h-[400px] overflow-y-auto">
					{myNotifications.length === 0 ? (
						<div className="py-12 text-center text-gray-400">
							<Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">Chưa có thông báo</p>
						</div>
					) : (
						myNotifications.slice(0, 10).map((notif) => {
							const conf = TYPE_CONFIG[notif.type];
							const Icon = conf.icon;
							return (
								<button
									key={notif.id}
									onClick={() => handleClick(notif)}
									className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!notif.isRead ? 'bg-primary/5' : ''}`}
								>
									<div className={`w-9 h-9 rounded-full ${conf.color} flex items-center justify-center shrink-0 mt-0.5`}>
										<Icon className="h-4 w-4" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<p className={`text-sm truncate ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
												{notif.title}
											</p>
											{!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
										</div>
										<p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
										<p className="text-[10px] text-gray-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
									</div>
								</button>
							);
						})
					)}
				</div>
				{myNotifications.length > 0 && (
					<div className="px-4 py-2 border-t">
						<Button variant="ghost" size="sm" className="w-full text-sm text-primary rounded-lg" onClick={() => { router.push('/notifications'); setOpen(false); }}>
							Xem tất cả <ExternalLink className="h-3.5 w-3.5 ml-1" />
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
