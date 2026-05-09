import type { Metadata } from 'next';
import ChatPage from '@/components/ChatPage';

export const metadata: Metadata = {
  title: 'Phòng Chat',
  description: 'Trao đổi và học tập cùng cộng đồng trong các phòng chat.',
};

export default function ChatRoutePage() {
	return <ChatPage />;
}
