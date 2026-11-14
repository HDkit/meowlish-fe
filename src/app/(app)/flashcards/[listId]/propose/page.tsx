import type { Metadata } from 'next';
import { FlashcardProposeChanges } from '@/components/flashcards/FlashcardProposeChanges';

export const metadata: Metadata = {
	title: 'Đề xuất thay đổi bộ flashcard',
};

export default function FlashcardProposePage() {
	return <FlashcardProposeChanges />;
}
