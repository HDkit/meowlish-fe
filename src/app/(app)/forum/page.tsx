import type { Metadata } from 'next';
import { ForumHome } from '@/components/forum/ForumHome';

export const metadata: Metadata = {
  title: 'Diễn đàn',
  description: 'Hỏi đáp, chia sẻ kinh nghiệm luyện thi IELTS, TOEIC và học tiếng Anh cùng cộng đồng Lingriser.',
};

export default function ForumPage() {
  return <ForumHome />;
}
