import type { Metadata } from 'next';
import { SpeakingWritingPage } from '@/components/SpeakingWritingPage';
import { AiUnavailableNotice } from '@/components/AiUnavailableNotice';

export const metadata: Metadata = {
  title: 'Viết Bài (Writing)',
  description: 'Luyện viết IELTS Writing Task 1 & Task 2 với AI chấm điểm. Phân tích chi tiết ngữ pháp, từ vựng, coherence theo band descriptors.',
  openGraph: {
    title: 'Luyện Writing Với AI | Lingriser',
    description: 'Luyện viết IELTS Writing Task 1 & Task 2 với AI chấm điểm theo band descriptors.',
  },
};

export default function WritingPage() {
	return (
		<>
			<AiUnavailableNotice feature='Luyện Viết (Writing)' />
			<SpeakingWritingPage mode="writing" />
		</>
	);
}
