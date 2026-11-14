import { BlogDetail } from '@/components/blog/BlogDetail';

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <BlogDetail blogId={decodeURIComponent(id)} />;
}
