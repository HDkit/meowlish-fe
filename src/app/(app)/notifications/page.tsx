import type { Metadata } from 'next';
import NotificationPage from '@/components/NotificationPage';

export const metadata: Metadata = {
  title: 'Thông báo',
  description: 'Theo dõi các cập nhật và phản hồi từ hệ thống.',
};

export default function NotificationsRoutePage() {
	return <NotificationPage />;
}
