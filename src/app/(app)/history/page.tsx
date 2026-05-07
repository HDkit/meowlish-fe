import type { Metadata } from 'next';
import { History } from '@/components/History';

export const metadata: Metadata = {
  title: 'Lịch Sử Làm Bài',
  description: 'Xem lại lịch sử các bài thi đã làm, điểm số và phân tích chi tiết từng bài.',
};

export default function HistoryPage() {
	return <History />;
}
