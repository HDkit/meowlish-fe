import type { Metadata } from 'next';
import UserManagementPage from '@/components/UserManagementPage';

export const metadata: Metadata = {
  title: 'Quản Lý User',
  robots: { index: false, follow: false },
};

export default function UserManagementRoute() {
	return <UserManagementPage />;
}
