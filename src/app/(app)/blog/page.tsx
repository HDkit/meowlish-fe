import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BlogPage } from '@/components/BlogPage';
import { CardGridSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/skeletons';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Mẹo luyện thi IELTS & TOEIC, kinh nghiệm học tiếng Anh hiệu quả, và cập nhật từ Lingriser.',
};

export default function BlogListPage() {
	return (
		<Suspense
			fallback={
				<LoadingRegion label='Đang tải bài viết…' className='space-y-8'>
					<PageHeaderSkeleton />
					<CardGridSkeleton cover className='sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3' />
				</LoadingRegion>
			}
		>
			<BlogPage />
		</Suspense>
	);
}
