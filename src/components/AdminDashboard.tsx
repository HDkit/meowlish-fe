'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Star, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { ExamManagementService, SortOptionsDto } from '@/lib/api-client';

interface ExamItem {
  id: string;
  title: string;
  status: string;
  createdAt?: string;
  createdBy?: string;
}

interface ExamCounts {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export default function AdminDashboard() {
  const { currUser, userRole, isMod, isStaff, isHeadStaff } = useAuth();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [counts, setCounts] = useState<ExamCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currUser) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [examsRes, countsRes] = await Promise.all([
          ExamManagementService.examManagementGatewayControllerFindExamsV1(
            undefined,
            undefined,
            20,
            { key: SortOptionsDto.key.CREATED_AT, direction: SortOptionsDto.direction.DESC },
          ),
          ExamManagementService.examManagementGatewayControllerGetExamCountsV1(),
        ]);
        setExams(examsRes.data?.exams ?? []);
        if (countsRes.data) {
          setCounts(countsRes.data as ExamCounts);
        }
      } catch (err) {
        console.warn('AdminDashboard: failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currUser]);

  if (!currUser || (!isMod && !isStaff && !isHeadStaff)) {
    return null;
  }

  const myExams = isStaff ? exams.filter(exam => exam.createdBy === currUser.id) : exams;
  const pendingExamsInList = exams.filter(exam => exam.status === 'PENDING');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Đã xuất bản', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="h-3 w-3" /> };
      case 'REJECTED':
        return { label: 'Cần sửa', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="h-3 w-3" /> };
      case 'PENDING':
        return { label: 'Chờ duyệt', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock className="h-3 w-3" /> };
      default:
        return { label: status || 'Không rõ', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <FileText className="h-3 w-3" /> };
    }
  };

  return (
    <div className="bg-background">
      {/* Hero Header */}
      <div className={`relative overflow-hidden bg-primary text-white`}>
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
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1.5 bg-secondary" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-gray-600">Chờ duyệt</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{counts?.pending ?? '—'}</div>
              <p className="text-xs text-gray-500 mt-1">Đề thi đang chờ xét duyệt</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1.5 bg-primary" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-gray-600">Đã xuất bản</CardTitle>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{counts?.approved ?? '—'}</div>
              <p className="text-xs text-gray-500 mt-1">Đề thi đang hoạt động</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1.5 bg-destructive" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-gray-600">Cần chỉnh sửa</CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{counts?.rejected ?? '—'}</div>
              <p className="text-xs text-gray-500 mt-1">Đề thi bị trả về</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1.5 bg-primary" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-gray-600">Tổng đề thi</CardTitle>
              <div className="p-2 bg-primary/15 rounded-lg">
                <FileText className="h-4 w-4 text-primary/80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{counts?.total ?? '—'}</div>
              <p className="text-xs text-gray-500 mt-1">Toàn hệ thống</p>
            </CardContent>
          </Card>
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
              <CardDescription>Các đề thi đã tạo gần đây nhất</CardDescription>
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
                        Xem tất cả đề thi →
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals (Head Staff only) */}
        {isHeadStaff && pendingExamsInList.length > 0 && (
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-secondary" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800">Đề thi chờ duyệt</CardTitle>
              <CardDescription>Các đề thi đang chờ bạn xét duyệt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingExamsInList.slice(0, 5).map((exam) => (
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
              {pendingExamsInList.length > 5 && (
                <div className="mt-4 text-center">
                  <Link href="/exam-approval">
                    <Button variant="link" className="text-orange-600 hover:text-orange-700">
                      Xem tất cả đề thi chờ duyệt →
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
