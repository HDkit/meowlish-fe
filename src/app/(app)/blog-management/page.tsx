import type { Metadata } from 'next';
import BlogManagementPage from '@/components/BlogManagementPage';

export const metadata: Metadata = {
  title: 'Quản Lý Blog',
  robots: { index: false, follow: false },
};

export default function BlogManagementRoute() {
    return <BlogManagementPage />;
}
