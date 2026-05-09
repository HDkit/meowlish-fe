import { Notification, NotificationType } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const notifications: Notification[] = [
	{
		id: 'notif1',
		userId: 'u2',
		type: NotificationType.BlogFollow,
		title: 'Bài viết mới',
		message: 'Tác giả bạn theo dõi vừa đăng bài: "Hướng dẫn sử dụng EnglishAI Pro"',
		isRead: false,
		linkType: 'blog',
		linkId: 'b1',
		createdAt: Date.now() - 3600000,
	},
	{
		id: 'notif2',
		userId: 'u2',
		type: NotificationType.ReportResponse,
		title: 'Phản hồi báo cáo',
		message: 'Admin đã phản hồi báo cáo của bạn: "Lỗi hiển thị câu hỏi"',
		isRead: false,
		linkType: 'report',
		linkId: 'rep1',
		createdAt: Date.now() - 7200000,
	},
	{
		id: 'notif3',
		userId: 'u2',
		type: NotificationType.System,
		title: 'Chào mừng!',
		message: 'Chào mừng bạn đến với EnglishAI Pro. Khám phá các tính năng mới!',
		isRead: true,
		createdAt: Date.now() - 86400000,
	},
	{
		id: 'notif4',
		userId: 'u1',
		type: NotificationType.BlogFollow,
		title: 'Bài viết mới',
		message: 'Có bài viết mới trong danh mục "Cách làm bài thi"',
		isRead: false,
		linkType: 'blog',
		linkId: 'b3',
		createdAt: Date.now() - 1800000,
	},
	{
		id: 'notif5',
		userId: 'u1',
		type: NotificationType.ReportResponse,
		title: 'Báo cáo đã được xử lý',
		message: 'Báo cáo "Nội dung không phù hợp" đã được giải quyết',
		isRead: true,
		linkType: 'report',
		linkId: 'rep2',
		createdAt: Date.now() - 172800000,
	},
];

const notificationsSlice = createGenericSlice<Notification>('notifications', notifications);

export const {
	addItem: addNotification,
	updateItem: updateNotification,
	removeItem: removeNotification,
	setList: setNotifications,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
