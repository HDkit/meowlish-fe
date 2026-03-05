'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/lib/hooks/useAuth';
import { RootState } from '@/lib/store/store';
import { approveExam, rejectExam } from '@/components/store/examSlice';
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
import { CheckCircle, XCircle, Eye, Search, Filter, FileText, ClipboardCheck, AlertCircle, Clock } from 'lucide-react';
import { Exam, ExamStatus } from '@/types/client';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  [ExamStatus.Empty]: {
    label: 'Bản nháp',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: <FileText className="h-3 w-3" />,
  },
  [ExamStatus.InDraft]: {
    label: 'Chờ duyệt',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: <Clock className="h-3 w-3" />,
  },
  [ExamStatus.NeedsRevision]: {
    label: 'Cần sửa',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  [ExamStatus.Published]: {
    label: 'Đã xuất bản',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle className="h-3 w-3" />,
  },
};

export default function ExamApprovalPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { currUser, isHeadStaff, canApproveExams } = useAuth();
  const exams = useSelector((state: RootState) => state.exams.list);
  const users = useSelector((state: RootState) => state.users.list);

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Access check
  if (!currUser || !isHeadStaff || !canApproveExams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50">
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

  // Filter exams
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || exam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort: Pending first, then by submission date
  const sortedExams = [...filteredExams].sort((a, b) => {
    if (a.status === 'InDraft' && b.status !== 'InDraft') return -1;
    if (a.status !== 'InDraft' && b.status === 'InDraft') return 1;
    return (b.submittedAt || 0) - (a.submittedAt || 0);
  });

  const handleApprove = (examId: string) => {
    dispatch(approveExam({ examId, reviewerId: currUser.id }));
    setIsPreviewOpen(false);
    setSelectedExam(null);
  };

  const handleReject = () => {
    if (!selectedExam || !rejectionReason.trim()) return;
    dispatch(
      rejectExam({
        examId: selectedExam.id,
        reviewerId: currUser.id,
        reason: rejectionReason,
      })
    );
    setIsRejectDialogOpen(false);
    setIsPreviewOpen(false);
    setSelectedExam(null);
    setRejectionReason('');
  };



  const openRejectDialog = () => {
    setIsRejectDialogOpen(true);
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG[ExamStatus.Empty];
  };

  const pendingCount = exams.filter((e) => e.status === 'InDraft').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6" />
                Duyệt đề thi
              </h1>
              <p className="text-blue-100 mt-1">
                Xem xét và phê duyệt các đề thi do người dùng tạo ra
              </p>
            </div>
            <div className="flex items-center gap-3">
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
                  <SelectItem value={ExamStatus.Empty} className="text-gray-900 hover:bg-gray-100 cursor-pointer">Bản nháp</SelectItem>
                  <SelectItem value={ExamStatus.InDraft} className="text-gray-900 hover:bg-gray-100 cursor-pointer">Chờ duyệt</SelectItem>
                  <SelectItem value={ExamStatus.NeedsRevision} className="text-gray-900 hover:bg-gray-100 cursor-pointer">Cần sửa</SelectItem>
                  <SelectItem value={ExamStatus.Published} className="text-gray-900 hover:bg-gray-100 cursor-pointer">Đã xuất bản</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-gray-400">{sortedExams.length} đề thi</span>
          </div>

          {/* Table UI mapped to match ExamManagementPage.tsx style */}
          {sortedExams.length === 0 ? (
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
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Người tạo</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Ngày trình duyệt</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600 whitespace-nowrap w-[240px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedExams.map((exam) => {
                    const creator = users.find((u) => u.id === (exam.creatorId || exam.createdBy));
                    return (
                      <tr key={exam.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {exam.title}
                          </p>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded inline-flex items-center">
                            {creator?.fullName || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-500 hidden lg:table-cell">
                          {exam.submittedAt
                            ? new Date(exam.submittedAt).toLocaleDateString('vi-VN')
                            : '--'}
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
                              onClick={() => router.push(`/exam-creation?id=${exam.id}`)}
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
                                    openRejectDialog();
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span className="hidden xl:inline">Từ chối</span>
                                </Button>
                              </>
                            )}
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


      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedExam?.title}</DialogTitle>
            <DialogDescription>
              Tạo bởi{' '}
              <span className="font-medium text-gray-900">
                {users.find((u) => u.id === (selectedExam?.creatorId || selectedExam?.createdBy))?.fullName || 'Không có tên'}
              </span>
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Thời gian</h4>
                  <p className="font-medium text-gray-900">{selectedExam.duration} phút</p>
                </div>
                <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Điểm đỗ</h4>
                  <p className="font-medium text-gray-900">{selectedExam.passScore || 70}%</p>
                </div>
                <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ngày tạo</h4>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedExam.createdAt ? new Date(selectedExam.createdAt).toLocaleDateString('vi-VN') : '--'}
                  </p>
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
                  {selectedExam.reviewedBy && (
                    <p className="text-xs text-red-600/80 mt-3 font-medium">
                      Người duyệt:{' '}
                      {users.find((u) => u.id === selectedExam.reviewedBy)?.fullName || 'Không rõ'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-6 border-t pt-4">
            {selectedExam?.status === 'InDraft' && (
              <>
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Hủy
                </Button>
                <Button variant="destructive" onClick={openRejectDialog}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Từ chối
                </Button>
                <Button className="bg-green-500 hover:bg-green-600 text-white border-0" onClick={() => handleApprove(selectedExam.id)}>
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
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Gửi từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
