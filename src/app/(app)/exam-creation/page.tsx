import type { Metadata } from 'next';
import { ExamCreationPage } from '@/components/ExamCreationPage';

export const metadata: Metadata = {
  title: 'Tạo Đề Thi',
  robots: { index: false, follow: false },
};

export default function ExamCreationRoute() {
	return <ExamCreationPage />;
}
