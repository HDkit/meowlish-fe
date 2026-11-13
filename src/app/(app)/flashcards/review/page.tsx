import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FlashcardReview } from '@/components/flashcard-review/FlashcardReview';

export const metadata: Metadata = {
	title: 'Ôn tập flashcards',
	description: 'Ôn tập từ vựng: xem từ, nghĩa hoặc ghi chú rồi gõ phần còn lại và so sánh với thẻ đã lưu.',
};

export default function FlashcardReviewPage() {
	// useSearchParams (?list=) needs a Suspense boundary
	return (
		<Suspense fallback={null}>
			<FlashcardReview />
		</Suspense>
	);
}
