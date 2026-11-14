import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ForumThreadView } from '@/components/forum/ForumThreadView';
import { ListSkeleton } from '@/components/community/States';

export const metadata: Metadata = {
  title: 'Chủ đề | Diễn đàn',
};

export default async function ForumThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <ForumThreadView threadId={decodeURIComponent(threadId)} />
    </Suspense>
  );
}
