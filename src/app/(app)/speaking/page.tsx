import type { Metadata } from 'next';
import { SpeakingWritingPage } from '@/components/SpeakingWritingPage';

export const metadata: Metadata = {
  title: 'Speaking',
  description: 'Luyện nói tiếng Anh 1-1 với AI. Nhận feedback phát âm, ngữ pháp, từ vựng tức thì theo chuẩn IELTS Speaking.',
  openGraph: {
    title: 'Luyện Speaking Với AI | Lingriser',
    description: 'Luyện nói tiếng Anh 1-1 với AI. Nhận feedback phát âm, ngữ pháp, từ vựng tức thì theo chuẩn IELTS Speaking.',
  },
};

export default function SpeakingPage() {
	return <SpeakingWritingPage mode="speaking" />;
}
