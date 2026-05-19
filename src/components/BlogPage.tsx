'use client';

import React, { useState, useMemo } from 'react';
import { useAppSelector } from '@/lib/store/hooks';
import { Blog } from '../types/client';
import { ReportDialog } from './ReportDialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
	BookOpen,
	Search,
	Calendar,
	User,
	ChevronRight,
	FileText,
	Tag,
	Flag,
} from 'lucide-react';
import { MarkdownPreview } from './MarkdownPreview';

function BlogCard({
	blog,
	authorName,
	onClick,
}: {
	blog: Blog;
	authorName?: string;
	onClick: () => void;
}) {
	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('vi-VN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	return (
		<Card
			className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col overflow-hidden border-gray-100 group"
			onClick={onClick}
		>
			<div className="h-1.5 shrink-0 bg-primary" />
			<CardHeader className="pb-3 flex-1">
				<div className="flex flex-col gap-3">
					{(blog.tags?.length ?? 0) > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{(blog.tags ?? []).slice(0, 3).map((tag) => (
								<Badge key={tag} className="bg-primary/10 text-primary border-0 uppercase tracking-wider text-[10px] items-center py-1">
									<Tag className="h-3 w-3 mr-1" />
									{tag}
								</Badge>
							))}
							{(blog.tags?.length ?? 0) > 3 && (
								<Badge className="bg-gray-100 text-gray-500 border-0 text-[10px] py-1">
									+{(blog.tags?.length ?? 0) - 3}
								</Badge>
							)}
						</div>
					)}
					<CardTitle className="text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors">{blog.title}</CardTitle>
				</div>
				<p className="text-gray-500 mt-2 line-clamp-3 text-sm leading-relaxed flex-1">
					{blog.content.substring(0, 150).replace(/[#*_~`]/g, '')}...
				</p>
			</CardHeader>
			<CardContent className="pt-0 shrink-0">
				<div className="flex items-center justify-between text-xs font-medium text-gray-500 pt-4 border-t border-gray-100 mt-2">
					<div className="flex items-center gap-3">
						{authorName && (
							<div className="flex items-center gap-1.5 text-gray-700 bg-gray-50 px-2 py-1 rounded-md">
								<User className="h-3.5 w-3.5" />
								<span>{authorName}</span>
							</div>
						)}
						<div className="flex items-center gap-1.5">
							<Calendar className="h-3.5 w-3.5 text-gray-400" />
							<span>{formatDate(blog.createdAt)}</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function BlogDetail({
	blog,
	authorName,
	onBack,
}: {
	blog: Blog;
	authorName?: string;
	onBack: () => void;
}) {
	const currUser = useAppSelector((state) => state.currUser.current);
	const [reportOpen, setReportOpen] = useState(false);
	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('vi-VN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};



	return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-primary border-b border-white/10 text-white min-h-[300px] flex items-end relative overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
				<div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/80 rounded-full blur-[100px] opacity-30"></div>

				<div className="max-w-4xl mx-auto w-full px-6 pb-12 relative z-10 pt-20">
					<div className="flex items-center justify-between mb-8">
						<button
							onClick={onBack}
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

export function BlogPage() {
	const blogs = useAppSelector((state) => state.blogs.list);
	const users = useAppSelector((state) => state.users.list);

	const [selectedTag, setSelectedTag] = useState<string | '__all__'>('__all__');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

	const allTags = useMemo(() => {
		const tagSet = new Set<string>();
		blogs.forEach((b) => b.tags?.forEach((t) => tagSet.add(t)));
		return Array.from(tagSet).sort();
	}, [blogs]);

	const filteredBlogs = useMemo(() => {
		let filtered = blogs;

		if (selectedTag !== '__all__') {
			filtered = filtered.filter((b) => b.tags?.includes(selectedTag));
		}

		if (searchQuery) {
			filtered = filtered.filter(
				(b) =>
					b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					b.content.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
	}, [blogs, selectedTag, searchQuery]);

	const getAuthorName = (authorId: string) => {
		return users.find((u) => u.id === authorId)?.fullName || 'Unknown';
	};

	if (selectedBlog) {
		return (
			<BlogDetail
				blog={selectedBlog}
				authorName={getAuthorName(selectedBlog.authorId)}
				onBack={() => setSelectedBlog(null)}
			/>
		);
	}

	return (
		<div className="min-h-screen bg-background pb-20">
			{/* Hero Header */}
			<div className="relative overflow-hidden bg-primary text-white shadow-lg">
				<div className="absolute inset-0 bg-black/10" />
				<div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
				<div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-2xl translate-y-1/3 translate-x-1/3" />

				<div className="relative px-6 py-16 max-w-7xl mx-auto text-center flex flex-col items-center">
					<div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md mb-6 inline-block border border-white/10 shadow-xl">
						<BookOpen className="h-10 w-10 text-primary-foreground/80" />
					</div>
					<h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-md">
						Thư viện Kiến thức
					</h1>
					<p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto font-medium">
						Khám phá các bài viết hữu ích về chiến lược học tiếng Anh, kỹ năng làm bài thi, và kinh nghiệm học viên.
					</p>

					<div className="mt-10 w-full max-w-2xl mx-auto relative group">
					<div className="relative flex items-center bg-white rounded-full shadow-2xl overflow-hidden border-2 border-transparent focus-within:border-primary transition-colors p-1">
							<div className="pl-5 pr-3 text-gray-400 shrink-0">
								<Search className="h-5 w-5" />
							</div>
							<input
								placeholder="Tìm kiếm tựa đề, nội dung bài viết..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full py-3 pr-6 text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 text-lg font-medium"
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-6 mt-10">
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Sidebar */}
					<aside className="w-full lg:w-72 flex-shrink-0 order-2 lg:order-1">
						<div className="sticky top-6">
							<Card className="border-0 shadow-xl shadow-gray-200/40 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
								<div className="h-1.5 w-full bg-primary" />
								<CardHeader className="pb-4 bg-gray-50/50 border-b border-gray-100">
									<CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
										<FileText className="h-5 w-5 text-primary/80" />
										Phân loại
									</CardTitle>
								</CardHeader>
								<CardContent className="p-3 space-y-1">
									<button
										onClick={() => setSelectedTag('__all__')}
										className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedTag === '__all__'
											? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
											: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-100'
											}`}
									>
										<span className="font-semibold">Tất cả bài viết</span>
										<Badge className={`${selectedTag === '__all__' ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}>{blogs.length}</Badge>
									</button>

									<div className="h-px w-full bg-gray-100 my-2" />

									{allTags.map((tag) => {
										const count = blogs.filter((b) => b.tags?.includes(tag)).length;
										const isSelected = selectedTag === tag;
										return (
											<button
												key={tag}
												onClick={() => setSelectedTag(tag)}
												className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${isSelected
													? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
													: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-100'
													}`}
											>
												<div className="flex items-center gap-3">
													<div className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'}`}>
														<Tag className="h-4 w-4" />
													</div>
													<span className={isSelected ? 'font-semibold' : 'font-medium'}>{tag}</span>
												</div>
												<Badge className={`${isSelected ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-0'} transition-colors`}>{count}</Badge>
											</button>
										);
									})}
								</CardContent>
							</Card>
						</div>
					</aside>

					{/* Main Content */}
					<main className="flex-1 order-1 lg:order-2">
						<div className="mb-6 flex items-center justify-between">
							<h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
								{selectedTag === '__all__' ? 'Bài viết mới nhất' : selectedTag}
								<span className="text-sm font-normal text-gray-500 bg-gray-200 px-2.5 py-0.5 rounded-full ml-2">
									{filteredBlogs.length}
								</span>
							</h2>
						</div>

						{filteredBlogs.length === 0 ? (
							<div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center shadow-sm">
								<div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
									<Search className="h-8 w-8 text-gray-400" />
								</div>
								<h3 className="text-lg font-bold text-gray-900 mb-1">Không có kết quả</h3>
								<p className="text-gray-500 max-w-md mx-auto">
									{searchQuery
										? `Không tìm thấy bài viết nào chứa từ khóa "${searchQuery}"`
										: 'Chưa có bài viết nào thuộc tag này.'}
								</p>
								{searchQuery && (
									<Button variant="outline" className="mt-6" onClick={() => setSearchQuery('')}>
										Xóa tìm kiếm
									</Button>
								)}
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
								{filteredBlogs.map((blog) => (
									<div key={blog.id} className="h-full">
										<BlogCard
											blog={blog}
											authorName={getAuthorName(blog.authorId)}
											onClick={() => setSelectedBlog(blog)}
										/>
									</div>
								))}
							</div>
						)}
					</main>
				</div>
			</div>
		</div>
	);
}
