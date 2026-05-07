import type { Metadata } from 'next';
import { BlogPage } from '@/components/BlogPage';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Mẹo luyện thi IELTS & TOEIC, kinh nghiệm học tiếng Anh hiệu quả, và cập nhật từ Lingriser.',
};

export default function BlogListPage() {
	return <BlogPage />;
}
