import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FlashcardPage } from '@/components/FlashcardPage';

export const metadata: Metadata = {
  title: 'Flashcards',
  description: 'Học từ vựng IELTS & TOEIC với flashcards thông minh. Spaced repetition giúp ghi nhớ hiệu quả gấp 3 lần.',
};

export default function FlashcardsPage() {
	// FlashcardPage keeps its tab, pages and search in the URL (useSearchParams)
	return (
		<Suspense>
			<FlashcardPage />
		</Suspense>
	);
}
