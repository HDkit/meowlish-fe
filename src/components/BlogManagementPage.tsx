'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthService } from '@/lib/api-client';
import { BlogService, type BlogResponse } from '@/lib/api/services/BlogService';
import { useToast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-response';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Plus, Edit, Trash2, Search, BookOpen,
    Filter, Tag, X, ArrowLeft, Save, Loader2,
} from 'lucide-react';
import { NavPagination } from './ui/nav-pagination';
import { MarkdownEditor } from './MarkdownEditor';

type BlogFormData = {
    title: string;
    content: string;
    tags: string[];
};

type ViewMode = { type: 'list' } | { type: 'create' } | { type: 'edit'; blog: BlogResponse };

export default function BlogManagementPage() {
    const { currUser, isMod, isStaff, isHeadStaff } = useAuth();
    const { toast } = useToast();

    const [blogs, setBlogs] = useState<BlogResponse[]>([]);
    const [authorMap, setAuthorMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 20;

    const [viewMode, setViewMode] = useState<ViewMode>({ type: 'list' });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState<BlogResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [tagFilter, setTagFilter] = useState('');

    const DEFAULT_FORM: BlogFormData = { title: '', content: '', tags: [] };
    const [formData, setFormData] = useState<BlogFormData>(DEFAULT_FORM);

    const fetchBlogs = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await BlogService.listBlogs(undefined, pageNum, limit);
            const data = (res as any).data ?? res;
            const blogList: BlogResponse[] = data.blogs ?? [];
            setBlogs(blogList);
            setTotalCount(data.totalCount ?? blogList.length);

            const uniqueAuthorIds = [...new Set(blogList.map(b => b.authorId))];
            if (uniqueAuthorIds.length > 0) {
                AuthService.authGatewayControllerHydrateIdentitiesV1(uniqueAuthorIds)
                    .then((hydRes: any) => {
                        const identities = (hydRes as any).data?.identities ?? (hydRes as any).data ?? [];
                        const map: Record<string, string> = {};
                        (Array.isArray(identities) ? identities : []).forEach((i: any) => {
                            map[i.id] = i.fullName || i.username || 'Unknown';
                        });
                        setAuthorMap(map);
                    })
                    .catch(() => {});
            }
        } catch (err) {
            console.error('Failed to fetch blogs:', err);
            toast({ title: 'Lỗi tải dữ liệu', description: 'Không thể tải danh sách bài viết.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (currUser) fetchBlogs(page);
    }, [currUser, page, fetchBlogs]);

    if (!currUser || (!isStaff && !isHeadStaff && !isMod)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
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

    const allTags = Array.from(new Set(blogs.flatMap((b) => b.tags ?? []))).sort();

    const filteredBlogs = blogs.filter((blog) => {
        const matchesSearch =
            blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = !tagFilter || (blog.tags ?? []).includes(tagFilter);
        return matchesSearch && matchesTag;
    });

    const getAuthorName = (authorId: string) => authorMap[authorId] || 'Unknown';

    const resetForm = () => setFormData(DEFAULT_FORM);

    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.content.trim()) return;
        setSaving(true);
        try {
            const res = await BlogService.createBlog({
                title: formData.title,
                content: formData.content,
                authorId: currUser.id,
                tags: formData.tags.length > 0 ? formData.tags : undefined,
            });
            toast({ title: 'Đã tạo bài viết' });
            resetForm();
            setViewMode({ type: 'list' });
            await fetchBlogs(page);
        } catch (err) {
            console.error('Failed to create blog:', err);
            toast({ title: 'Tạo bài viết thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async () => {
        if (viewMode.type !== 'edit') return;
        setSaving(true);
        try {
            await BlogService.updateBlog(viewMode.blog.id, {
                title: formData.title,
                content: formData.content,
                tags: formData.tags.length > 0 ? formData.tags : undefined,
            });
            toast({ title: 'Đã cập nhật bài viết' });
            resetForm();
            setViewMode({ type: 'list' });
            await fetchBlogs(page);
        } catch (err) {
            console.error('Failed to update blog:', err);
            toast({ title: 'Cập nhật thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBlog) return;
        try {
            await BlogService.deleteBlog(selectedBlog.id);
            setBlogs(prev => prev.filter(b => b.id !== selectedBlog.id));
            setIsDeleteDialogOpen(false);
            setSelectedBlog(null);
            toast({ title: 'Đã xóa bài viết' });
        } catch (err) {
            console.error('Failed to delete blog:', err);
            toast({ title: 'Xóa thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
        }
    };

    const openCreateView = () => { resetForm(); setViewMode({ type: 'create' }); };
    const openEditView = (blog: BlogResponse) => {
        setFormData({ title: blog.title, content: blog.content, tags: blog.tags ?? [] });
        setViewMode({ type: 'edit', blog });
    };
    const openDeleteDialog = (blog: BlogResponse) => { setSelectedBlog(blog); setIsDeleteDialogOpen(true); };
    const isFormValid = formData.title.trim() && formData.content.trim();

    // Full-page create/edit view
    if (viewMode.type === 'create' || viewMode.type === 'edit') {
        const isEdit = viewMode.type === 'edit';
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                    <div className="mx-auto max-w-4xl px-6 h-14 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { resetForm(); setViewMode({ type: 'list' }); }}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <BookOpen className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-gray-900">
                                {isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                            </span>
                        </div>
                        <Button
                            onClick={isEdit ? handleEdit : handleCreate}
                            disabled={!isFormValid || saving}
                        >
                            <Save className="h-4 w-4 mr-1.5" />
                            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo bài viết'}
                        </Button>
                    </div>
                </div>

                <div className="mx-auto max-w-4xl px-6 py-6 space-y-6">
                    <Card className="border border-gray-200 shadow-none">
                        <CardContent className="p-6 space-y-5">
                            <div>
                                <Label htmlFor="blog-title" className="text-sm font-medium">Tiêu đề <span className="text-red-500">*</span></Label>
                                <Input
                                    id="blog-title"
                                    value={formData.title}
                                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                    placeholder="Nhập tiêu đề bài viết"
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Nhãn</Label>
                                <BlogTagInput tags={formData.tags} onChange={(tags) => setFormData(p => ({ ...p, tags }))} />
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Nội dung <span className="text-red-500">*</span></Label>
                                <MarkdownEditor
                                    value={formData.content}
                                    onChange={(content) => setFormData(p => ({ ...p, content }))}
                                    placeholder="Viết nội dung đầy đủ của bài viết tại đây..."
                                    rows={20}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // List view
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-primary text-white">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-primary-foreground" />
                                Quản lý bài viết
                            </h1>
                            <p className="text-primary-foreground/80 mt-1 text-sm">Tạo, chỉnh sửa và xoá các bài viết trên nền tảng</p>
                        </div>
                        <Button onClick={openCreateView} className="bg-white text-primary hover:bg-white/90 font-semibold shadow border-0">
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo bài viết
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        {[
                            { label: 'Tổng bài viết', value: blogs.length, color: 'bg-white/20' },
                            { label: 'Đang hiển thị', value: filteredBlogs.length, color: 'bg-rose-400/30' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className={`${color} backdrop-blur-sm rounded-xl px-4 py-3 text-center`}>
                                <div className="text-2xl font-bold">{value}</div>
                                <div className="text-xs text-primary-foreground/80 mt-0.5">{label}</div>
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
                            placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-gray-50 border-gray-200"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={tagFilter}
                            onChange={(e) => setTagFilter(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="">Tất cả tag</option>
                            {allTags.map((tag) => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>
                    <span className="text-sm text-gray-400">{filteredBlogs.length} bài viết</span>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                        <Loader2 className="h-8 w-8 text-primary/80 mx-auto mb-4 animate-spin" />
                        <p className="text-gray-500 font-medium">Đang tải danh sách bài viết...</p>
                    </div>
                ) : filteredBlogs.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                        <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Chưa có bài viết nào</p>
                        <p className="text-gray-400 text-sm mt-1">Nhấn &quot;Tạo bài viết&quot; để bắt đầu</p>
                        <Button onClick={openCreateView} className="mt-4 bg-primary text-white border-0">
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
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Nhãn</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Tác giả</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Ngày tạo</th>
                                    <th className="text-right px-5 py-3 font-semibold text-gray-600">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredBlogs.map((blog) => (
                                    <tr key={blog.id} className="hover:bg-primary/10 transition-colors group">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-800 truncate max-w-xs">{blog.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                                                {blog.content.substring(0, 80).replace(/[#*_~`]/g, '')}...
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {(blog.tags ?? []).slice(0, 3).map((tag) => (
                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                        <Tag className="h-3 w-3 mr-0.5" />{tag}
                                                    </Badge>
                                                ))}
                                                {(blog.tags ?? []).length > 3 && (
                                                    <Badge variant="outline" className="text-xs text-gray-400">+{blog.tags.length - 3}</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 hidden lg:table-cell text-gray-600 text-sm">{getAuthorName(blog.authorId)}</td>
                                        <td className="px-4 py-4 hidden lg:table-cell text-gray-500 text-sm">
                                            {new Date(blog.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openEditView(blog)}
                                                    className="text-primary border-primary/30 hover:bg-primary/10 h-8 px-3">
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <NavPagination page={page} totalPages={Math.ceil(totalCount / limit)} onPageChange={setPage} />

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

function BlogTagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
    const [tagInput, setTagInput] = useState('');

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !tags.includes(t)) {
            onChange([...tags, t]);
        }
        setTagInput('');
    };

    return (
        <div className="mt-1.5 space-y-2">
            <div className="flex gap-2 items-center">
                <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Nhập tag rồi nhấn Enter..."
                    className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="h-3 w-3 mr-1" />Thêm
                </Button>
            </div>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="ml-0.5 hover:text-red-500">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
