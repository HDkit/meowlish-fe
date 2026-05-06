import type { Metadata } from 'next';
import ExamApprovalPage from '@/components/ExamApprovalPage';

export const metadata: Metadata = {
  title: 'Duyệt Đề Thi',
  robots: { index: false, follow: false },
};

export default function ExamApprovalRoute() {
	return <ExamApprovalPage />;
}
