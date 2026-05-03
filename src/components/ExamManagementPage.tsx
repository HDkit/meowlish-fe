'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    FilePlus, Search, FileEdit, Trash2, Clock, CheckCircle,
    AlertCircle, FileText, ChevronRight, Filter, Eye, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from './ui/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { ExamManagementService, getAccessToken, getRefreshToken } from '@/lib/api-client';

// ─── Status config ───────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    Empty: {
        label: 'Bản nháp',
        color: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: <FileText className="h-3 w-3" />,
    },
    InDraft: {
        label: 'Chờ duyệt',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: <Clock className="h-3 w-3" />,
    },
    NeedsRevision: {
        label: 'Cần sửa',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: <AlertCircle className="h-3 w-3" />,
    },
    Published: {
        label: 'Đã xuất bản',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: <CheckCircle className="h-3 w-3" />,
    },
};

const SKILL_LABELS: Record<string, string> = {
    reading: 'Reading',
    listening: 'Listening',
    writing: 'Writing',
    speaking: 'Speaking',
};

interface ExamItem {
    id: string;
    title: string;
    description?: string;
    status: string;
    testType?: string;
    skill?: string;
    difficulty?: string;
    duration?: number;
    createdAt?: string;
    createdBy?: string;
    rejectionReason?: string;
}

export function ExamManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { currUser, isStaff } = useAuth();

    const [allExams, setAllExams] = useState<ExamItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const hasApiSession = () => Boolean(getAccessToken() || getRefreshToken());

    const fetchExams = useCallback(async () => {
        if (!hasApiSession()) {
            setAllExams([]);
            setLoading(false);
            toast({
                title: 'Thiếu phiên backend',
                description: 'Hãy đăng xuất rồi đăng nhập lại để lấy token backend trước khi quản lý đề thi.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const res = await ExamManagementService.examManagementGatewayControllerFindExamsV1(undefined, undefined, 100);
            setAllExams(res.data?.exams ?? []);
        } catch (err) {
            console.warn('ExamManagement: failed to load exams', err);
            toast({ title: 'Lỗi tải dữ liệu', description: 'Không thể tải danh sách đề thi.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (currUser) fetchExams();
    }, [currUser, fetchExams]);

    // Staff only sees their own exams
    const staffExams = isStaff
        ? allExams.filter(e => e.createdBy === currUser?.id)
        : allExams;

    const filtered = staffExams.filter(e => {
        const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.description?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: staffExams.length,
        draft: staffExams.filter(e => e.status === 'InDraft').length,
        needsRevision: staffExams.filter(e => e.status === 'NeedsRevision').length,
        published: staffExams.filter(e => e.status === 'Published').length,
    };

    const handleEdit = (exam: ExamItem) => {
        router.push(`/exam-creation?id=${exam.id}`);
    };

    const handleDelete = async (examId: string) => {
        if (!hasApiSession()) {
            toast({
                title: 'Thiếu phiên backend',
                description: 'Hãy đăng nhập lại trước khi xóa đề thi.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await ExamManagementService.examManagementGatewayControllerDeleteExamV1(examId);
            setAllExams(prev => prev.filter(e => e.id !== examId));
            toast({ title: 'Đã xóa đề thi', description: 'Đề thi đã được xóa thành công.' });
        } catch (err) {
            console.error('Failed to delete exam', err);
            toast({ title: 'Xóa thất bại', description: 'Không thể xóa đề thi này.', variant: 'destructive' });
        }
    };

    return (
        <div className="min-h-screen bg-background">

            {/* ── Hero Header ── */}
            <div className="relative overflow-hidden bg-primary text-white">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Quản lý đề thi</h1>
                            <p className="text-primary-foreground/80 mt-1 text-sm">Tạo, chỉnh sửa và theo dõi trạng thái phê duyệt đề thi</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={fetchExams}
                                variant="ghost"
                                className="text-white hover:bg-white/20 border-0"
                                size="sm"
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                                onClick={() => router.push('/exam-creation')}
                                className="bg-white text-primary hover:bg-primary/10 font-semibold shadow border-0"
                            >
                                <FilePlus className="h-4 w-4 mr-2" />
                                Tạo đề mới
                            </Button>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-3 mt-6">
                        {[
                            { label: 'Tổng đề', value: stats.total, color: 'bg-white/20' },
                            { label: 'Chờ duyệt', value: stats.draft, color: 'bg-orange-400/30' },
                            { label: 'Cần sửa', value: stats.needsRevision, color: 'bg-red-400/30' },
                            { label: 'Đã xuất bản', value: stats.published, color: 'bg-green-400/30' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className={`${color} backdrop-blur-sm rounded-xl px-4 py-3 text-center`}>
                                <div className="text-2xl font-bold">{value}</div>
                                <div className="text-xs text-primary-foreground/80 mt-0.5">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="px-6 py-6 max-w-6xl mx-auto">

                {/* Filter Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex gap-3 items-center flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm kiếm đề thi..."
                            className="pl-9 bg-gray-50 border-gray-200"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg z-[200]">
                                <SelectItem value="all" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Tất cả trạng thái</SelectItem>
                                <SelectItem value="Empty" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Bản nháp</SelectItem>
                                <SelectItem value="InDraft" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Chờ duyệt</SelectItem>
                                <SelectItem value="NeedsRevision" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Cần sửa</SelectItem>
                                <SelectItem value="Published" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Đã xuất bản</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <span className="text-sm text-gray-400">{filtered.length} đề thi</span>
                </div>

                {/* Exam Table */}
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                        <RefreshCw className="h-8 w-8 text-primary/80 mx-auto mb-4 animate-spin" />
                        <p className="text-gray-500 font-medium">Đang tải danh sách đề thi...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                        <FileText className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Chưa có đề thi nào</p>
                        <p className="text-gray-400 text-sm mt-1">Nhấn "Tạo đề mới" để bắt đầu</p>
                        <Button
                            onClick={() => router.push('/exam-creation')}
                            className="mt-4 bg-primary text-white border-0"
                        >
                            <FilePlus className="h-4 w-4 mr-2" />
                            Tạo đề thi đầu tiên
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Tên đề thi</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Loại / Kỹ năng</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Thời gian</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                                    <th className="text-right px-5 py-3 font-semibold text-gray-600">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(exam => {
                                    const statusCfg = STATUS_CONFIG[exam.status] ?? STATUS_CONFIG['Empty'];
                                    const canEdit = exam.status !== 'Published';
                                    return (
                                        <tr
                                            key={exam.id}
                                            className="hover:bg-primary/10 transition-colors group"
                                        >
                                            {/* Title */}
                                            <td className="px-5 py-4">
                                                <button
                                                    className="text-left w-full"
                                                    onClick={() => handleEdit(exam)}
                                                >
                                                    <p className="font-semibold text-gray-800 group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                        {exam.title}
                                                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary/80" />
                                                    </p>
                                                    {exam.description && (
                                                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{exam.description}</p>
                                                    )}
                                                    {exam.status === 'NeedsRevision' && exam.rejectionReason && (
                                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3 shrink-0" />
                                                            {exam.rejectionReason}
                                                        </p>
                                                    )}
                                                </button>
                                            </td>

                                            {/* Type/Skill */}
                                            <td className="px-4 py-4 hidden md:table-cell">
                                                <div className="space-y-0.5">
                                                    <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                                        {exam.testType?.toUpperCase()}
                                                    </span>
                                                    <p className="text-xs text-gray-400">
                                                        {SKILL_LABELS[exam.skill ?? ''] ?? exam.skill}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Duration */}
                                            <td className="px-4 py-4 hidden lg:table-cell">
                                                <span className="text-gray-600 flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                    {exam.duration ?? '—'} phút
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-4 align-middle">
                                                <span className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border w-[110px] ${statusCfg.color}`}>
                                                    {statusCfg.icon}
                                                    {statusCfg.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 align-middle">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(exam)}
                                                            className="w-[100px] justify-center text-primary border-primary/30 hover:bg-primary/10 h-8 px-3"
                                                        >
                                                            <FileEdit className="h-3.5 w-3.5 mr-1.5" />
                                                            Chỉnh sửa
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(exam)}
                                                            className="w-[100px] justify-center text-gray-600 border-gray-200 hover:bg-gray-50 h-8 px-3"
                                                        >
                                                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                            Xem
                                                        </Button>
                                                    )}
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 px-2"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-white">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Xóa đề thi?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Đề thi "<strong>{exam.title}</strong>" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(exam.id)}
                                                                    className="bg-red-500 hover:bg-red-600 text-white"
                                                                >
                                                                    Xóa
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExamManagementPage;
