import type { Metadata } from 'next';
import { FlashcardProposalDetail } from '@/components/flashcards/FlashcardProposalDetail';

export const metadata: Metadata = {
	title: 'Đề xuất thay đổi bộ flashcard',
};

export default function FlashcardProposalPage() {
	return <FlashcardProposalDetail />;
}
