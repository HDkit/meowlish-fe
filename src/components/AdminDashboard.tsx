'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Star, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { ExamManagementService } from '@/lib/api-client';

interface ExamItem {
  id: string;
  title: string;
  status: string;
  createdAt?: string;
  createdBy?: string;
}

export default function AdminDashboard() {
  const { currUser, userRole, isStaff, isHeadStaff } = useAuth();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currUser) return;
    const fetchExams = async () => {
      setLoading(true);
      try {
        const res = await ExamManagementService.examManagementGatewayControllerFindExamsV1({ limit: 50 });
        setExams(res.data?.exams ?? []);
      } catch (err) {
        console.warn('AdminDashboard: failed to load exams', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [currUser]);

  if (!currUser || (!isStaff && !isHeadStaff)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary/10">
        <Card className="w-96 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-red-600">Không có quyền truy cập</CardTitle>
            <CardDescription>Bạn không có quyền truy cập trang này.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const myExams = isStaff ? exams.filter(exam => exam.createdBy === currUser.id) : exams;
  const pendingApprovalExams = exams.filter(exam => exam.status === 'InDraft');
  const publishedExams = exams.filter(exam => exam.status === 'Published');
  const needsRevisionExams = exams.filter(exam => exam.status === 'NeedsRevision');
  const myDraftExams = myExams.filter(exam => exam.status === 'Empty' || exam.status === 'InDraft');
  const myPublishedExams = myExams.filter(exam => exam.status === 'Published');
  const myNeedsRevisionExams = myExams.filter(exam => exam.status === 'NeedsRevision');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Published':
        return { label: 'Đã xuất bản', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="h-3 w-3" /> };
      case 'NeedsRevision':
        return { label: 'Cần sửa', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="h-3 w-3" /> };
      case 'InDraft':
        return { label: 'Chờ duyệt', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock className="h-3 w-3" /> };
      default:
        return { label: 'Bản nháp', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <FileText className="h-3 w-3" /> };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-primary/10">
      {/* Hero Header */}
      <div className={`relative overflow-hidden ${isHeadStaff
        ? 'bg-gradient-to-r from-primary to-primary/80'
        : 'bg-gradient-to-r from-primary/80 via-cyan-500 to-teal-500'
        } text-white`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-16 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative container mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-1">
            {isHeadStaff
              ? <Star className="h-7 w-7 text-yellow-300 fill-yellow-300" />
              : <TrendingUp className="h-7 w-7 text-cyan-200" />
            }
            <h1 className="text-3xl font-bold">
              {isHeadStaff ? 'Bảng quản trị' : 'Bảng điều khiển Staff'}
            </h1>
          </div>
          <p className="text-white/80 text-sm">
            Xin chào, <span className="font-semibold text-white">{currUser.fullName}</span>
            {' '}({userRole?.name ?? currUser.roleId.replace('role-', '')})
          </p>
          {loading && (
            <div className="flex items-center gap-2 mt-2 text-white/70 text-xs">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Đang tải dữ liệu...
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 -mt-4">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {isHeadStaff ? (
            <>
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-400" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-gray-600">Chờ duyệt</CardTitle>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800">{pendingApprovalExams.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Đề thi đang chờ xét duyệt</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-green-500" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-gray-600">Đã xuất bản</CardTitle>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800">{publishedExams.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Đề thi đang hoạt động</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-gray-600">Cần chỉnh sửa</CardTitle>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800">{needsRevisionExams.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Đề thi bị trả về</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-primary to-primary" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-gray-600">Tổng đề thi</CardTitle>
                  <div className="p-2 bg-primary/15 rounded-lg">
                    <Users className="h-4 w-4 text-primary/80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800">{exams.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Toàn hệ thống</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-slate-400 to-gray-500" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-gray-600">Bản nháp của tôi</CardTitle>
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <FileText className="h-4 w-4 text-slate-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800">{myDraftExams.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Đang soạn thảo</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-gray-600">Đã xuất bản</CardTitle>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800">{myPublishedExams.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Đã được duyệt</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-gray-600">Cần chỉnh sửa</CardTitle>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800">{myNeedsRevisionExams.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Yêu cầu chỉnh sửa</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-primary to-cyan-500" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-gray-600">Tổng đề thi</CardTitle>
                  <div className="p-2 bg-primary/15 rounded-lg">
                    <FileText className="h-4 w-4 text-primary/80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800">{myExams.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Do tôi tạo</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Bottom Content */}
        <div className="mb-8">
          {/* Recent Exams */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary/80" />
                <CardTitle className="text-base font-semibold text-gray-800">
                  {isStaff ? 'Đề thi của tôi' : 'Đề thi gần đây'}
                </CardTitle>
              </div>
              <CardDescription>Các đề thi dự thảo hoặc đã tạo gần đây nhất</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 animate-pulse">
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 w-48 bg-gray-200 rounded" />
                          <div className="h-2 w-24 bg-gray-100 rounded" />
                        </div>
                      </div>
                      <div className="h-6 w-24 bg-gray-100 rounded-full" />
                    </div>
                  ))
                ) : myExams.slice(0, 5).map((exam) => (
                  <Link
                    href={`/exam-creation?id=${exam.id}`}
                    key={exam.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary/80 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold truncate text-gray-800">{exam.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Tạo lúc {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border w-[110px] ${getStatusConfig(exam.status).color}`}>
                      {getStatusConfig(exam.status).icon}
                      {getStatusConfig(exam.status).label}
                    </span>
                  </Link>
                ))}
                {!loading && myExams.length === 0 && (
                  <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-gray-200">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">Chưa có đề thi nào</p>
                    <p className="text-xs text-gray-400 mt-1">Các đề thi bạn tạo sẽ hiển thị tại đây</p>
                    <Link href="/exam-creation">
                      <Button className="mt-4 bg-primary hover:bg-primary/90 border-0" size="sm">
                        Tạo đề thi đầu tiên
                      </Button>
                    </Link>
                  </div>
                )}
                {!loading && myExams.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link href="/exam-management">
                      <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 text-sm">
                        Xem tất cả {myExams.length} đề thi →
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals (Head Staff only) */}
        {isHeadStaff && pendingApprovalExams.length > 0 && (
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800">🕐 Đề thi chờ duyệt</CardTitle>
              <CardDescription>Các đề thi đang chờ bạn xét duyệt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingApprovalExams.slice(0, 5).map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{exam.title}</p>
                      <p className="text-xs text-gray-500">
                        Tạo lúc <span className="text-orange-600 font-medium">{exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
                      </p>
                    </div>
                    <Link href="/exam-approval">
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm">
                        Xem xét
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
              {pendingApprovalExams.length > 5 && (
                <div className="mt-4 text-center">
                  <Link href="/exam-approval">
                    <Button variant="link" className="text-orange-600 hover:text-orange-700">
                      Xem tất cả {pendingApprovalExams.length} đề thi chờ duyệt →
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
