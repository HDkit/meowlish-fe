import type { Metadata } from 'next';
import ReportManagementPage from '@/components/ReportManagementPage';

export const metadata: Metadata = {
  title: 'Quản lý Báo cáo',
  description: 'Xem xét và xử lý các báo cáo từ người dùng.',
};

export default function ReportManagementRoutePage() {
	return <ReportManagementPage />;
}
