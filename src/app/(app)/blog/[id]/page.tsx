'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/lib/store/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ReportDialog } from '@/components/ReportDialog';
import { Badge } from '@/components/ui/badge';
import {
	Calendar,
	User,
	ChevronRight,
	Tag,
	Flag,
	Loader2,
} from 'lucide-react';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { BlogService, type BlogResponse } from '@/lib/api/services/BlogService';
import { AuthService } from '@/lib/api-client';

export default function BlogDetailPage() {
	const params = useParams();
	const router = useRouter();
	const currUser = useAppSelector((state) => state.currUser.current);
	const [blog, setBlog] = useState<BlogResponse | null>(null);
	const [authorName, setAuthorName] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [reportOpen, setReportOpen] = useState(false);

	const blogId = params?.id as string;

	useEffect(() => {
		if (!blogId) return;
		BlogService.getBlog(blogId)
			.then((res: any) => {
				const data = (res as any).data ?? res;
				setBlog(data);
				if (data?.authorId) {
					AuthService.authGatewayControllerHydrateIdentityV1(data.authorId)
						.then((hydRes: any) => {
							const identity = (hydRes as any).data ?? hydRes;
							setAuthorName(identity?.fullName || identity?.username || 'Unknown');
						})
						.catch(() => {});
				}
			})
			.catch(() => setBlog(null))
			.finally(() => setLoading(false));
	}, [blogId]);

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('vi-VN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!blog) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
				<h2 className="text-xl font-bold text-gray-800">Không tìm thấy bài viết</h2>
				<button
					onClick={() => router.push('/blog')}
					className="text-primary hover:underline"
				>
					Quay lại danh sách
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-primary border-b border-white/10 text-white min-h-[300px] flex items-end relative overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
				<div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/80 rounded-full blur-[100px] opacity-30"></div>

				<div className="max-w-4xl mx-auto w-full px-6 pb-12 relative z-10 pt-20">
					<div className="flex items-center justify-between mb-8">
						<button
							onClick={() => router.push('/blog')}
							className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 w-fit px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm focus:outline-none"
						>
							<ChevronRight className="h-4 w-4 rotate-180" />
							Quay lại danh sách
						</button>
						{currUser && (
							<button
								onClick={() => setReportOpen(true)}
								className="flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm focus:outline-none"
							>
								<Flag className="h-4 w-4" />
								Báo cáo
							</button>
						)}
					</div>

					{(blog.tags?.length ?? 0) > 0 && (
						<div className="flex flex-wrap gap-2 mb-6">
							{(blog.tags ?? []).map((tag) => (
								<Badge key={tag} className="bg-white/20 text-white border-0 uppercase tracking-wider text-xs px-3 py-1.5">
									<Tag className="h-3.5 w-3.5 mr-2" />
									{tag}
								</Badge>
							))}
						</div>
					)}
					<h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight drop-shadow-sm">{blog.title}</h1>
					<div className="flex flex-wrap items-center gap-6 text-sm text-primary-foreground/80 font-medium">
						{authorName && (
							<div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
								<div className="h-6 w-6 rounded-full bg-primary/50 flex items-center justify-center border border-primary/80">
									<User className="h-3.5 w-3.5 text-white" />
								</div>
								<span>{authorName}</span>
							</div>
						)}
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 opacity-70" />
							<span>{formatDate(blog.createdAt)}</span>
						</div>
					</div>
				</div>
			</div>

			<article className="max-w-4xl mx-auto bg-white shadow-xl shadow-gray-200/50 rounded-2xl -mt-8 relative z-20 p-8 md:p-12 mb-20 border border-gray-100">
				<MarkdownPreview content={blog.content} />
			</article>

			{currUser && (
				<ReportDialog
					open={reportOpen}
					onOpenChange={setReportOpen}
					targetType="blog"
					targetId={blog.id}
					userId={currUser.id}
				/>
			)}
		</div>
	);
}
