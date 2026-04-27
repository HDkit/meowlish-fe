'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/lib/hooks/useAuth';
import { RootState } from '@/lib/store/store';
import { addBlog, updateBlog, removeBlog } from '@/components/store/blogSlice';
import { Blog, BlogCategory } from '@/types/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Plus, Edit, Trash2, Search, BookOpen, Eye,
    FileText, GraduationCap, Lightbulb, Star, Globe, Filter,
} from 'lucide-react';

type BlogFormData = {
    title: string;
    summary: string;
    category: BlogCategory;
    content: string;
};

const CATEGORY_OPTIONS: { value: BlogCategory; label: string; icon: React.ElementType; color: string }[] = [
    { value: BlogCategory.WebUsage, label: 'Cách sử dụng web', icon: FileText, color: 'bg-primary/10 text-primary' },
    { value: BlogCategory.LanguageLearning, label: 'Học ngôn ngữ', icon: GraduationCap, color: 'bg-green-100 text-green-800' },
    { value: BlogCategory.ExamTips, label: 'Cách làm bài thi', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800' },
    { value: BlogCategory.StudentReview, label: 'Review học viên', icon: Star, color: 'bg-secondary/10 text-secondary' },
    { value: BlogCategory.StudyAbroad, label: 'Du học', icon: Globe, color: 'bg-orange-100 text-orange-800' },
];

function getCategoryInfo(category: BlogCategory) {
    return CATEGORY_OPTIONS.find((c) => c.value === category) ?? CATEGORY_OPTIONS[0];
}

export default function BlogManagementPage() {
    const dispatch = useDispatch();
    const { currUser, isStaff, isHeadStaff } = useAuth();
    const blogs = useSelector((state: RootState) => state.blogs.list);
    const users = useSelector((state: RootState) => state.users.list);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const DEFAULT_FORM: BlogFormData = { title: '', summary: '', category: BlogCategory.WebUsage, content: '' };
    const [formData, setFormData] = useState<BlogFormData>(DEFAULT_FORM);

    if (!currUser || (!isStaff && !isHeadStaff)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-secondary/10">
                <Card className="w-96 border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-red-600">Không có quyền truy cập</CardTitle>
                        <CardDescription>Bạn không có quyền quản lý bài viết.</CardDescription>
                    </CardHeader>
                    <CardContent />
                </Card>
            </div>
        );
    }

    const filteredBlogs = blogs.filter((blog) => {
        const matchesSearch =
            blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.summary.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || blog.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const getAuthorName = (userId: string) =>
        users.find((u) => u.id === userId)?.fullName ?? 'Unknown';

    const resetForm = () => setFormData(DEFAULT_FORM);

    const handleCreate = () => {
        if (!formData.title || !formData.summary || !formData.content) return;
        const newBlog: Blog = {
            id: `b-${Date.now()}`,
            createdBy: currUser.id,
            title: formData.title,
            summary: formData.summary,
            category: formData.category,
            content: formData.content,
            createdAt: Date.now(),
            views: 0,
        };
        dispatch(addBlog(newBlog));
        setIsCreateDialogOpen(false);
        resetForm();
    };

    const handleEdit = () => {
        if (!selectedBlog) return;
        dispatch(updateBlog({ ...selectedBlog, title: formData.title, summary: formData.summary, category: formData.category, content: formData.content }));
        setIsEditDialogOpen(false);
        setSelectedBlog(null);
        resetForm();
    };

    const handleDelete = () => {
        if (!selectedBlog) return;
        dispatch(removeBlog(selectedBlog.id));
        setIsDeleteDialogOpen(false);
        setSelectedBlog(null);
    };

    const openCreateDialog = () => { resetForm(); setIsCreateDialogOpen(true); };
    const openEditDialog = (blog: Blog) => {
        setSelectedBlog(blog);
        setFormData({ title: blog.title, summary: blog.summary, category: blog.category, content: blog.content });
        setIsEditDialogOpen(true);
    };
    const openDeleteDialog = (blog: Blog) => { setSelectedBlog(blog); setIsDeleteDialogOpen(true); };
    const isFormValid = formData.title.trim() && formData.summary.trim() && formData.content.trim();
    const totalViews = blogs.reduce((sum, b) => sum + (b.views ?? 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-secondary/10 to-secondary/5">

            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-secondary to-secondary/80 text-white">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-secondary-foreground" />
                                Quản lý bài viết
                            </h1>
                            <p className="text-secondary-foreground mt-1 text-sm">Tạo, chỉnh sửa và xoá các bài viết trên nền tảng</p>
                        </div>
                        <Button onClick={openCreateDialog} className="bg-white text-secondary hover:bg-secondary/10 font-semibold shadow border-0">
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo bài viết
                        </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        {[
                            { label: 'Tổng bài viết', value: blogs.length, color: 'bg-white/20' },
                            { label: 'Lượt xem', value: totalViews.toLocaleString(), color: 'bg-secondary/30' },
                            { label: 'Đang hiển thị', value: filteredBlogs.length, color: 'bg-rose-400/30' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className={`${color} backdrop-blur-sm rounded-xl px-4 py-3 text-center`}>
                                <div className="text-2xl font-bold">{value}</div>
                                <div className="text-xs text-secondary-foreground mt-0.5">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 max-w-6xl mx-auto">

                {/* Filter Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex gap-3 items-center flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm theo tiêu đề hoặc tóm tắt..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-gray-50 border-gray-200"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-44 bg-gray-50 border-gray-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg z-[300]">
                                <SelectItem value="all" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Tất cả danh mục</SelectItem>
                                {CATEGORY_OPTIONS.map((c) => (
                                    <SelectItem key={c.value} value={c.value} className="text-gray-900 hover:bg-gray-100 cursor-pointer">{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <span className="text-sm text-gray-400">{filteredBlogs.length} bài viết</span>
                </div>

                {/* Table */}
                {filteredBlogs.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                        <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Chưa có bài viết nào</p>
                        <p className="text-gray-400 text-sm mt-1">Nhấn &quot;Tạo bài viết&quot; để bắt đầu</p>
                        <Button onClick={openCreateDialog} className="mt-4 bg-gradient-to-r from-secondary to-secondary/80 text-white border-0">
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo bài viết đầu tiên
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Tiêu đề</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Danh mục</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Tác giả</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Ngày tạo</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Lượt xem</th>
                                    <th className="text-right px-5 py-3 font-semibold text-gray-600">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredBlogs.map((blog) => {
                                    const catInfo = getCategoryInfo(blog.category);
                                    const CatIcon = catInfo.icon;
                                    return (
                                        <tr key={blog.id} className="hover:bg-secondary/10 transition-colors group">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-800 truncate max-w-xs">{blog.title}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{blog.summary}</p>
                                            </td>
                                            <td className="px-4 py-4 hidden md:table-cell">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${catInfo.color}`}>
                                                    <CatIcon className="h-3 w-3" />
                                                    {catInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 hidden lg:table-cell text-gray-600 text-sm">{getAuthorName(blog.createdBy)}</td>
                                            <td className="px-4 py-4 hidden lg:table-cell text-gray-500 text-sm">
                                                {new Date(blog.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-4 py-4 hidden md:table-cell">
                                                <span className="flex items-center gap-1 text-gray-600">
                                                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                                                    {(blog.views ?? 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => openEditDialog(blog)}
                                                        className="text-secondary border-secondary/30 hover:bg-secondary/10 h-8 px-3">
                                                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                                                        Chỉnh sửa
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => openDeleteDialog(blog)}
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 px-2">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                        <DialogHeader>
                            <DialogTitle>Tạo bài viết mới</DialogTitle>
                            <DialogDescription>Thêm bài viết mới vào nền tảng</DialogDescription>
                        </DialogHeader>
                        <BlogForm formData={formData} onChange={setFormData} />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Huỷ</Button>
                            <Button onClick={handleCreate} disabled={!isFormValid}>
                                <Plus className="h-4 w-4 mr-2" />Tạo bài viết
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
                            <DialogDescription>Cập nhật nội dung bài viết</DialogDescription>
                        </DialogHeader>
                        <BlogForm formData={formData} onChange={setFormData} />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Huỷ</Button>
                            <Button onClick={handleEdit} disabled={!isFormValid}>
                                <Edit className="h-4 w-4 mr-2" />Lưu thay đổi
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xoá bài viết?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc muốn xoá <strong>&quot;{selectedBlog?.title}&quot;</strong>? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Huỷ</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
                                <Trash2 className="h-4 w-4 mr-2" />Xoá
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

// ── Form component ──────────────────────────────────────────────

function BlogForm({ formData, onChange }: { formData: BlogFormData; onChange: (data: BlogFormData) => void }) {
    const field = <K extends keyof BlogFormData>(key: K) => (value: BlogFormData[K]) =>
        onChange({ ...formData, [key]: value });

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="blog-title">Tiêu đề</Label>
                <Input id="blog-title" value={formData.title} onChange={(e) => field('title')(e.target.value)}
                    placeholder="Nhập tiêu đề bài viết" className="bg-gray-100 border-gray-200" />
            </div>
            <div>
                <Label htmlFor="blog-category">Danh mục</Label>
                <Select value={formData.category} onValueChange={(v) => field('category')(v as BlogCategory)}>
                    <SelectTrigger id="blog-category" className="bg-gray-100 border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-[300]">
                        {CATEGORY_OPTIONS.map((c) => (
                            <SelectItem key={c.value} value={c.value} className="text-gray-900 hover:bg-gray-100 cursor-pointer">{c.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="blog-summary">Tóm tắt</Label>
                <Textarea id="blog-summary" value={formData.summary} onChange={(e) => field('summary')(e.target.value)}
                    placeholder="Mô tả ngắn hiển thị trong danh sách bài viết"
                    rows={2} className="resize-none bg-gray-100 border-gray-200" />
            </div>
            <div>
                <Label htmlFor="blog-content">Nội dung</Label>
                <p className="text-xs text-muted-foreground mb-1">Hỗ trợ markdown: # Tiêu đề, - danh sách, **in đậm**</p>
                <Textarea id="blog-content" value={formData.content} onChange={(e) => field('content')(e.target.value)}
                    placeholder="Viết nội dung đầy đủ của bài viết tại đây..."
                    rows={12} className="font-mono text-sm bg-gray-100 border-gray-200" />
            </div>
        </div>
    );
}
