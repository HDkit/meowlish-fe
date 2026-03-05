'use client';

import React, { useState, useMemo } from 'react';
import { useAppSelector } from '@/lib/store/hooks';
import { Blog, BlogCategory } from '../types/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
	BookOpen,
	Search,
	Eye,
	Calendar,
	User,
	ChevronRight,
	FileText,
	GraduationCap,
	Lightbulb,
	Globe,
	Star,
} from 'lucide-react';

// Component hiển thị từng blog card
function BlogCard({
	blog,
	authorName,
	onClick,
}: {
	blog: Blog;
	authorName?: string;
	onClick: () => void;
}) {
	const getCategoryInfo = (category: BlogCategory) => {
		switch (category) {
			case BlogCategory.WebUsage:
				return { label: 'Cách sử dụng web', icon: FileText, color: 'bg-blue-100 text-blue-800' };
			case BlogCategory.LanguageLearning:
				return { label: 'Học ngôn ngữ', icon: GraduationCap, color: 'bg-green-100 text-green-800' };
			case BlogCategory.ExamTips:
				return { label: 'Cách làm bài thi', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800' };
			case BlogCategory.StudentReview:
				return { label: 'Review học viên', icon: Star, color: 'bg-purple-100 text-purple-800' };
			case BlogCategory.StudyAbroad:
				return { label: 'Du học', icon: Globe, color: 'bg-orange-100 text-orange-800' };
			default:
				return { label: 'Khác', icon: BookOpen, color: 'bg-gray-100 text-gray-800' };
		}
	};

	const categoryInfo = getCategoryInfo(blog.category);
	const CategoryIcon = categoryInfo.icon;
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
			className="cursor-pointer hover:shadow-lg transition-all duration-300 h-full"
			onClick={onClick}
		>
			<CardHeader>
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1">
						<CardTitle className="text-xl mb-2 line-clamp-2">{blog.title}</CardTitle>
						<Badge className={categoryInfo.color}>
							<CategoryIcon className="h-3 w-3 mr-1" />
							{categoryInfo.label}
						</Badge>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<p className="text-gray-600 mb-4 line-clamp-3">{blog.summary}</p>
				<div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
					<div className="flex items-center gap-4">
						{authorName && (
							<div className="flex items-center gap-1">
								<User className="h-4 w-4" />
								<span>{authorName}</span>
							</div>
						)}
						<div className="flex items-center gap-1">
							<Calendar className="h-4 w-4" />
							<span>{formatDate(blog.createdAt)}</span>
						</div>
					</div>
					{blog.views !== undefined && (
						<div className="flex items-center gap-1">
							<Eye className="h-4 w-4" />
							<span>{blog.views.toLocaleString()}</span>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

// Component hiển thị chi tiết blog
function BlogDetail({
	blog,
	authorName,
	onBack,
}: {
	blog: Blog;
	authorName?: string;
	onBack: () => void;
}) {
	const getCategoryInfo = (category: BlogCategory) => {
		switch (category) {
			case BlogCategory.WebUsage:
				return { label: 'Cách sử dụng web', icon: FileText, color: 'bg-blue-100 text-blue-800' };
			case BlogCategory.LanguageLearning:
				return { label: 'Học ngôn ngữ', icon: GraduationCap, color: 'bg-green-100 text-green-800' };
			case BlogCategory.ExamTips:
				return { label: 'Cách làm bài thi', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800' };
			case BlogCategory.StudentReview:
				return { label: 'Review học viên', icon: Star, color: 'bg-purple-100 text-purple-800' };
			case BlogCategory.StudyAbroad:
				return { label: 'Du học', icon: Globe, color: 'bg-orange-100 text-orange-800' };
			default:
				return { label: 'Khác', icon: BookOpen, color: 'bg-gray-100 text-gray-800' };
		}
	};

	const categoryInfo = getCategoryInfo(blog.category);
	const CategoryIcon = categoryInfo.icon;
	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('vi-VN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	// Format content với markdown-like syntax
	const formatContent = (content: string) => {
		const lines = content.split('\n');
		return lines.map((line, index) => {
			if (line.startsWith('# ')) {
				return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{line.substring(2)}</h1>;
			}
			if (line.startsWith('## ')) {
				return <h2 key={index} className="text-2xl font-semibold mt-6 mb-3">{line.substring(3)}</h2>;
			}
			if (line.startsWith('### ')) {
				return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
			}
			if (line.startsWith('- ') || line.startsWith('* ')) {
				return <li key={index} className="ml-6 mb-2">{line.substring(2)}</li>;
			}
			if (line.trim() === '') {
				return <br key={index} />;
			}
			if (line.startsWith('**') && line.endsWith('**')) {
				return <p key={index} className="font-semibold mb-2">{line.substring(2, line.length - 2)}</p>;
			}
			return <p key={index} className="mb-4 leading-relaxed">{line}</p>;
		});
	};

	return (
		<div className="max-w-4xl mx-auto">
			<button
				onClick={onBack}
				className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
			>
				<ChevronRight className="h-4 w-4 rotate-180" />
				Quay lại danh sách
			</button>

			<article className="bg-white rounded-lg shadow-sm p-8">
				{/* Header */}
				<div className="mb-6">
					<Badge className={`${categoryInfo.color} mb-4`}>
						<CategoryIcon className="h-3 w-3 mr-1" />
						{categoryInfo.label}
					</Badge>
					<h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
					<div className="flex items-center gap-4 text-sm text-gray-600">
						{authorName && (
							<div className="flex items-center gap-1">
								<User className="h-4 w-4" />
								<span>{authorName}</span>
							</div>
						)}
						<div className="flex items-center gap-1">
							<Calendar className="h-4 w-4" />
							<span>{formatDate(blog.createdAt)}</span>
						</div>
						{blog.views !== undefined && (
							<div className="flex items-center gap-1">
								<Eye className="h-4 w-4" />
								<span>{blog.views.toLocaleString()} lượt xem</span>
							</div>
						)}
					</div>
				</div>

				{/* Content */}
				<div className="prose prose-lg max-w-none">
					{formatContent(blog.content)}
				</div>
			</article>
		</div>
	);
}

export function BlogPage() {
	const blogs = useAppSelector((state) => state.blogs.list);
	const users = useAppSelector((state) => state.users.list);

	const [selectedCategory, setSelectedCategory] = useState<BlogCategory | '__all__'>('__all__');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

	// Lọc blogs
	const filteredBlogs = useMemo(() => {
		let filtered = blogs;

		// Lọc theo category
		if (selectedCategory !== '__all__') {
			filtered = filtered.filter((b) => b.category === selectedCategory);
		}

		// Lọc theo search
		if (searchQuery) {
			filtered = filtered.filter(
				(b) =>
					b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					b.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
					b.content.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Sắp xếp theo ngày tạo (mới nhất trước)
		return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
	}, [blogs, selectedCategory, searchQuery]);

	const getAuthorName = (userId: string) => {
		return users.find((u) => u.id === userId)?.fullName || 'Unknown';
	};

	const getCategoryInfo = (category: BlogCategory) => {
		switch (category) {
			case BlogCategory.WebUsage:
				return { label: 'Cách sử dụng web', icon: FileText, count: blogs.filter((b) => b.category === category).length };
			case BlogCategory.LanguageLearning:
				return { label: 'Học ngôn ngữ', icon: GraduationCap, count: blogs.filter((b) => b.category === category).length };
			case BlogCategory.ExamTips:
				return { label: 'Cách làm bài thi', icon: Lightbulb, count: blogs.filter((b) => b.category === category).length };
			case BlogCategory.StudentReview:
				return { label: 'Review học viên', icon: Star, count: blogs.filter((b) => b.category === category).length };
			case BlogCategory.StudyAbroad:
				return { label: 'Du học', icon: Globe, count: blogs.filter((b) => b.category === category).length };
			default:
				return { label: 'Khác', icon: BookOpen, count: 0 };
		}
	};

	const categories = [
		BlogCategory.WebUsage,
		BlogCategory.LanguageLearning,
		BlogCategory.ExamTips,
		BlogCategory.StudentReview,
		BlogCategory.StudyAbroad,
	];

	// Nếu đang xem chi tiết blog
	if (selectedBlog) {
		return (
			<BlogDetail
				blog={selectedBlog}
				authorName={getAuthorName(selectedBlog.createdBy)}
				onBack={() => setSelectedBlog(null)}
			/>
		);
	}

	return (
		<div className="max-w-7xl mx-auto p-6">
			<div className="flex gap-6">
				{/* Table of Contents - Sidebar bên trái */}
				<aside className="w-64 flex-shrink-0">
					<div className="sticky top-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<BookOpen className="h-5 w-5" />
									Danh mục
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<button
									onClick={() => setSelectedCategory('__all__')}
									className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${selectedCategory === '__all__'
											? 'bg-blue-100 text-blue-800 font-medium'
											: 'hover:bg-gray-100 text-gray-700'
										}`}
								>
									<span>Tất cả</span>
									<Badge variant="secondary">{blogs.length}</Badge>
								</button>
								{categories.map((category) => {
									const info = getCategoryInfo(category);
									const Icon = info.icon;
									return (
										<button
											key={category}
											onClick={() => setSelectedCategory(category)}
											className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${selectedCategory === category
													? 'bg-blue-100 text-blue-800 font-medium'
													: 'hover:bg-gray-100 text-gray-700'
												}`}
										>
											<div className="flex items-center gap-2">
												<Icon className="h-4 w-4" />
												<span>{info.label}</span>
											</div>
											<Badge variant="secondary">{info.count}</Badge>
										</button>
									);
								})}
							</CardContent>
						</Card>
					</div>
				</aside>

				{/* Main Content */}
				<main className="flex-1 space-y-6">
					{/* Header */}
					<div>
						<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
							<BookOpen className="h-8 w-8" />
							Blog
						</h1>
						<p className="text-gray-600">
							Khám phá các bài viết về học tiếng Anh, làm bài thi, và nhiều hơn nữa
						</p>
					</div>

					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Tìm kiếm bài viết..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>

					{/* Blog List */}
					{filteredBlogs.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
								<p className="text-gray-500">
									{searchQuery || selectedCategory !== '__all__'
										? 'Không tìm thấy bài viết nào'
										: 'Chưa có bài viết nào'}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredBlogs.map((blog) => (
								<BlogCard
									key={blog.id}
									blog={blog}
									authorName={getAuthorName(blog.createdBy)}
									onClick={() => setSelectedBlog(blog)}
								/>
							))}
						</div>
					)}
				</main>
			</div>
		</div>
	);
}

