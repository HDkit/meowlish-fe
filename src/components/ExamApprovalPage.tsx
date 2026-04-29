'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ExamManagementService, getAccessToken, getRefreshToken } from '@/lib/api-client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, Eye, Search, Filter, FileText, ClipboardCheck, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useToast } from './ui/use-toast';

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

interface ExamItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  duration?: number;
  passScore?: number;
  createdAt?: string;
  createdBy?: string;
  rejectionReason?: string;
  reviewedBy?: string;
}

export default function ExamApprovalPage() {
  const router = useRouter();
  const { currUser, isHeadStaff, canApproveExams } = useAuth();
  const { toast } = useToast();

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const hasApiSession = () => Boolean(getAccessToken() || getRefreshToken());

  const fetchExams = useCallback(async () => {
    if (!hasApiSession()) {
      setExams([]);
      setLoading(false);
      toast({
        title: 'Thiếu phiên backend',
        description: 'Hãy đăng xuất rồi đăng nhập lại để lấy token backend trước khi duyệt đề thi.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await ExamManagementService.examManagementGatewayControllerFindExamsV1({ limit: 100 });
      setExams(res.data?.exams ?? []);
    } catch (err) {
      console.warn('ExamApproval: failed to load exams', err);
      toast({ title: 'Lỗi tải dữ liệu', description: 'Không thể tải danh sách đề thi.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currUser) fetchExams();
  }, [currUser, fetchExams]);

  // Access check
  if (!currUser || !isHeadStaff || !canApproveExams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-red-600">Không có quyền truy cập</CardTitle>
            <CardDescription>
              Bạn không có quyền duyệt đề thi.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedExams = [...filteredExams].sort((a, b) => {
    if (a.status === 'InDraft' && b.status !== 'InDraft') return -1;
    if (a.status !== 'InDraft' && b.status === 'InDraft') return 1;
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });

  const handleApprove = async (examId: string) => {
    if (!hasApiSession()) {
      toast({
        title: 'Thiếu phiên backend',
        description: 'Hãy đăng nhập lại trước khi phê duyệt đề thi.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await ExamManagementService.examManagementGatewayControllerReviewExamV1({
        id: examId,
        requestBody: { status: 'Published' },
      });
      toast({ title: 'Đã phê duyệt', description: 'Đề thi đã được phê duyệt thành công.' });
      setIsPreviewOpen(false);
      setSelectedExam(null);
      await fetchExams();
    } catch (err) {
      console.error('Failed to approve exam', err);
      toast({ title: 'Phê duyệt thất bại', description: 'Không thể phê duyệt đề thi này.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedExam || !rejectionReason.trim()) return;
    if (!hasApiSession()) {
      toast({
        title: 'Thiếu phiên backend',
        description: 'Hãy đăng nhập lại trước khi từ chối đề thi.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await ExamManagementService.examManagementGatewayControllerReviewExamV1({
        id: selectedExam.id,
        requestBody: { status: 'NeedsRevision', reason: rejectionReason } as any,
      });
      toast({ title: 'Đã từ chối', description: 'Đề thi đã được trả về cho tác giả chỉnh sửa.' });
      setIsRejectDialogOpen(false);
      setIsPreviewOpen(false);
      setSelectedExam(null);
      setRejectionReason('');
      await fetchExams();
    } catch (err) {
      console.error('Failed to reject exam', err);
      toast({ title: 'Từ chối thất bại', description: 'Không thể từ chối đề thi này.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG['Empty'];
  };

  const pendingCount = exams.filter((e) => e.status === 'InDraft').length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6" />
                Duyệt đề thi
              </h1>
              <p className="text-primary-foreground/80 mt-1">
                Xem xét và phê duyệt các đề thi do staff tạo ra
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchExams}
                disabled={loading}
                className="text-white hover:bg-white/20 border-0"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="bg-orange-400/30 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm">
                <Clock className="w-4 h-4" />
                {pendingCount} đề đang chờ duyệt
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
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
            <span className="text-sm text-gray-400">{sortedExams.length} đề thi</span>
          </div>

          {/* Table */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
              <RefreshCw className="h-8 w-8 text-primary/80 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500 font-medium">Đang tải danh sách đề thi...</p>
            </div>
          ) : sortedExams.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
              <ClipboardCheck className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Không tìm thấy đề thi nào</p>
              <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc tìm kiếm</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Tên đề thi</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Ngày tạo</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600 whitespace-nowrap w-[240px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedExams.map((exam) => (
                    <tr key={exam.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                          {exam.title}
                        </p>
                        {exam.rejectionReason && (
                          <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            {exam.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-500 hidden lg:table-cell">
                        {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('vi-VN') : '--'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border w-[110px] justify-center ${getStatusConfig(exam.status).color}`}>
                          {getStatusConfig(exam.status).icon}
                          {getStatusConfig(exam.status).label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 gap-1.5 px-3"
                            onClick={() => {
                              setSelectedExam(exam);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden xl:inline">Xem</span>
                          </Button>

                          {exam.status === 'InDraft' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white gap-1.5 px-3 border-0"
                                onClick={() => handleApprove(exam.id)}
                                disabled={submitting}
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="hidden xl:inline">Duyệt</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 hover:border-red-300 gap-1.5 px-3"
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setIsRejectDialogOpen(true);
                                }}
                                disabled={submitting}
                              >
                                <XCircle className="h-4 w-4" />
                                <span className="hidden xl:inline">Từ chối</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedExam?.title}</DialogTitle>
            <DialogDescription>
              Tạo lúc {selectedExam?.createdAt ? new Date(selectedExam.createdAt).toLocaleDateString('vi-VN') : '--'}
            </DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-6 mt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">Mô tả</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedExam.description || 'Không có mô tả nào được cung cấp.'}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Thời gian</h4>
                  <p className="font-medium text-gray-900">{selectedExam.duration ?? '—'} phút</p>
                </div>
                <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Điểm đỗ</h4>
                  <p className="font-medium text-gray-900">{selectedExam.passScore ?? 70}%</p>
                </div>
                <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trạng thái</h4>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusConfig(selectedExam.status).color}`}>
                    {getStatusConfig(selectedExam.status).icon}
                    {getStatusConfig(selectedExam.status).label}
                  </span>
                </div>
              </div>

              {selectedExam.rejectionReason && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Lý do từ chối trước đó
                  </h4>
                  <p className="text-sm text-red-700 bg-white/50 p-3 rounded-lg">{selectedExam.rejectionReason}</p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/exam-creation?id=${selectedExam.id}`)}
                  className="w-full gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Xem chi tiết đề thi trong trình soạn thảo
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 border-t pt-4">
            {selectedExam?.status === 'InDraft' && (
              <>
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setIsRejectDialogOpen(true);
                  }}
                  disabled={submitting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Từ chối
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600 text-white border-0"
                  onClick={() => handleApprove(selectedExam.id)}
                  disabled={submitting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Phê duyệt
                </Button>
              </>
            )}
            {selectedExam?.status !== 'InDraft' && (
              <Button onClick={() => setIsPreviewOpen(false)}>Đóng</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Từ chối đề thi
            </DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp lý do từ chối bài thi này. Tác giả của đề thi sẽ nhìn thấy thông báo này để chỉnh sửa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder="Nhập lý do từ chối chi tiết..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason('');
              }}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || submitting}
            >
              {submitting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Gửi từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
