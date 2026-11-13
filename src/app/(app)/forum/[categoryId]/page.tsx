import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ForumCategoryView } from '@/components/forum/ForumCategoryView';
import { ListSkeleton } from '@/components/community/States';

export const metadata: Metadata = {
  title: 'Diễn đàn',
};

export default async function ForumCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <ForumCategoryView categoryId={decodeURIComponent(categoryId)} />
    </Suspense>
  );
}
