import type { Metadata } from 'next';
import ExamManagementPage from '@/components/ExamManagementPage';

export const metadata: Metadata = {
  title: 'Quản Lý Đề Thi',
  robots: { index: false, follow: false },
};

export default function ExamManagementRoute() {
    return <ExamManagementPage />;
}
