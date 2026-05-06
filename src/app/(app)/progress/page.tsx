import type { Metadata } from 'next';
import { ProgressTracker } from '@/components/ProgressTracker';

export const metadata: Metadata = {
  title: 'Tiến Độ Học Tập',
  description: 'Theo dõi tiến độ luyện thi với biểu đồ chi tiết. Phân tích điểm mạnh, điểm yếu từng kỹ năng.',
};

export default function ProgressPage() {
	return <ProgressTracker />;
}
