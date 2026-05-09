'use client';

import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { updateReport, removeReport } from '@/components/store/reportSlice';
import { useAuth } from '@/lib/hooks/useAuth';
import { Report, ReportCategory, ReportStatus } from '@/types/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
	Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from './ui/dialog';
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
	AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';
import {
	Flag, Search, Eye, Clock, CheckCircle, XCircle,
	AlertTriangle, Bug, FileText, UserX, MessageSquare,
	Filter, Trash2,
} from 'lucide-react';

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; icon: React.ElementType }> = {
	[ReportStatus.Pending]: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
	[ReportStatus.Reviewing]: { label: 'Đang xem xét', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Eye },
	[ReportStatus.Resolved]: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
	[ReportStatus.Rejected]: { label: 'Đã từ chối', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

const CATEGORY_CONFIG: Record<ReportCategory, { label: string; icon: React.ElementType }> = {
	[ReportCategory.Bug]: { label: 'Lỗi hệ thống', icon: Bug },
	[ReportCategory.Content]: { label: 'Nội dung', icon: FileText },
	[ReportCategory.Behavior]: { label: 'Hành vi', icon: UserX },
};

export default function ReportManagementPage() {
	const dispatch = useAppDispatch();
	const { currUser, isHeadStaff } = useAuth();
	const reports = useAppSelector((state) => state.reports.list);
	const users = useAppSelector((state) => state.users.list);

	const [searchQuery, setSearchQuery] = useState('');
	const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
	const [filterCategory, setFilterCategory] = useState<ReportCategory | 'all'>('all');
	const [selectedReport, setSelectedReport] = useState<Report | null>(null);
	const [responseText, setResponseText] = useState('');
	const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

	const getUserName = (userId: string) => users.find((u) => u.id === userId)?.fullName || 'Không rõ';

	const filteredReports = useMemo(() => {
		let filtered = [...reports];
		if (filterStatus !== 'all') filtered = filtered.filter((r) => r.status === filterStatus);
		if (filterCategory !== 'all') filtered = filtered.filter((r) => r.category === filterCategory);
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			filtered = filtered.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
		}
		return filtered.sort((a, b) => b.createdAt - a.createdAt);
	}, [reports, filterStatus, filterCategory, searchQuery]);

	const statusCounts = useMemo(() => ({
		all: reports.length,
		[ReportStatus.Pending]: reports.filter((r) => r.status === ReportStatus.Pending).length,
		[ReportStatus.Reviewing]: reports.filter((r) => r.status === ReportStatus.Reviewing).length,
		[ReportStatus.Resolved]: reports.filter((r) => r.status === ReportStatus.Resolved).length,
		[ReportStatus.Rejected]: reports.filter((r) => r.status === ReportStatus.Rejected).length,
	}), [reports]);

	const handleStatusChange = (report: Report, newStatus: ReportStatus) => {
		dispatch(updateReport({
			...report,
			status: newStatus,
			reviewedBy: currUser?.id,
			updatedAt: Date.now(),
		}));
	};

	const handleRespond = () => {
		if (!selectedReport || !responseText.trim()) return;
		dispatch(updateReport({
			...selectedReport,
			status: ReportStatus.Resolved,
			adminResponse: responseText.trim(),
			reviewedBy: currUser?.id,
			updatedAt: Date.now(),
		}));
		setSelectedReport(null);
		setResponseText('');
	};

	const handleDelete = () => {
		if (deleteReportId) {
			dispatch(removeReport(deleteReportId));
			setDeleteReportId(null);
		}
	};

	const formatDate = (ts: number) => new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

	if (!currUser || !isHeadStaff) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-96"><CardHeader><CardTitle className="text-red-600">Không có quyền truy cập</CardTitle></CardHeader></Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background pb-20">
			{/* Hero Header */}
			<div className="relative overflow-hidden bg-primary text-white">
				<div className="absolute inset-0 bg-black/10" />
				<div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
				<div className="relative container mx-auto px-6 py-10">
					<div className="flex items-center gap-3 mb-2">
						<Flag className="h-7 w-7" />
						<h1 className="text-3xl font-bold">Quản lý Báo cáo</h1>
					</div>
					<p className="text-white/80">Xem xét và xử lý các báo cáo từ người dùng</p>

					{/* Stats */}
					<div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
						{([['all', 'Tất cả', AlertTriangle] as const, ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label, v.icon] as const)]).map(([key, label, Icon]) => (
							<button
								key={key}
								onClick={() => setFilterStatus(key as any)}
								className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${filterStatus === key ? 'bg-white text-primary shadow-lg' : 'bg-white/15 text-white hover:bg-white/25'}`}
							>
								<Icon className="h-4 w-4" />
								<span className="font-semibold text-sm">{label}</span>
								<span className="ml-auto font-bold">{statusCounts[key as keyof typeof statusCounts]}</span>
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="container mx-auto px-6 mt-8">
				{/* Filters */}
				<div className="flex flex-col sm:flex-row gap-3 mb-6">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Tìm kiếm báo cáo..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 rounded-xl"
						/>
					</div>
					<Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as any)}>
						<SelectTrigger className="w-[200px] rounded-xl">
							<Filter className="h-4 w-4 mr-2" />
							<SelectValue placeholder="Danh mục" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tất cả danh mục</SelectItem>
							{Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
								<SelectItem key={k} value={k}>{v.label}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Report List */}
				{filteredReports.length === 0 ? (
					<div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
						<Flag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
						<h3 className="text-lg font-bold text-gray-800">Không có báo cáo nào</h3>
						<p className="text-gray-500 mt-1">Chưa có báo cáo nào phù hợp với bộ lọc</p>
					</div>
				) : (
					<div className="space-y-4">
						{filteredReports.map((report) => {
							const statusConf = STATUS_CONFIG[report.status];
							const catConf = CATEGORY_CONFIG[report.category];
							const StatusIcon = statusConf.icon;
							const CatIcon = catConf.icon;
							return (
								<Card key={report.id} className="hover:shadow-lg transition-shadow border-0 shadow-sm">
									<CardContent className="p-5">
										<div className="flex flex-col lg:flex-row lg:items-start gap-4">
											<div className="flex-1 min-w-0">
												<div className="flex flex-wrap items-center gap-2 mb-2">
													<Badge className={`${statusConf.color} border text-xs`}>
														<StatusIcon className="h-3 w-3 mr-1" />{statusConf.label}
													</Badge>
													<Badge variant="outline" className="text-xs">
														<CatIcon className="h-3 w-3 mr-1" />{catConf.label}
													</Badge>
													{report.targetType && (
														<Badge variant="outline" className="text-xs text-gray-500">
															{report.targetType === 'exam' ? 'Đề thi' : report.targetType === 'blog' ? 'Blog' : report.targetType === 'user' ? 'Người dùng' : 'Khác'}
														</Badge>
													)}
												</div>
												<h3 className="font-bold text-gray-900 text-lg mb-1">{report.title}</h3>
												<p className="text-gray-600 text-sm line-clamp-2 mb-3">{report.description}</p>
												<div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
													<span>Người gửi: <strong className="text-gray-700">{getUserName(report.userId)}</strong></span>
													<span>{formatDate(report.createdAt)}</span>
													{report.reviewedBy && <span>Xử lý bởi: <strong className="text-gray-700">{getUserName(report.reviewedBy)}</strong></span>}
												</div>
												{report.adminResponse && (
													<div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
														<p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
															<MessageSquare className="h-3 w-3" /> Phản hồi Admin
														</p>
														<p className="text-sm text-green-800">{report.adminResponse}</p>
													</div>
												)}
											</div>
											<div className="flex lg:flex-col gap-2 shrink-0">
												{report.status === ReportStatus.Pending && (
													<Button size="sm" className="rounded-xl" onClick={() => handleStatusChange(report, ReportStatus.Reviewing)}>
														<Eye className="h-4 w-4 mr-1" /> Xem xét
													</Button>
												)}
												{(report.status === ReportStatus.Pending || report.status === ReportStatus.Reviewing) && (
													<Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setSelectedReport(report); setResponseText(report.adminResponse || ''); }}>
														<MessageSquare className="h-4 w-4 mr-1" /> Phản hồi
													</Button>
												)}
												{report.status === ReportStatus.Reviewing && (
													<Button size="sm" variant="outline" className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleStatusChange(report, ReportStatus.Rejected)}>
														<XCircle className="h-4 w-4 mr-1" /> Từ chối
													</Button>
												)}
												<Button size="sm" variant="ghost" className="rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteReportId(report.id)}>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>

			{/* Respond Dialog */}
			<Dialog open={!!selectedReport} onOpenChange={(open) => { if (!open) setSelectedReport(null); }}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Phản hồi báo cáo</DialogTitle>
					</DialogHeader>
					{selectedReport && (
						<div className="space-y-4">
							<div className="bg-gray-50 rounded-lg p-3">
								<p className="font-semibold text-sm">{selectedReport.title}</p>
								<p className="text-sm text-gray-600 mt-1">{selectedReport.description}</p>
							</div>
							<Textarea
								placeholder="Nhập phản hồi cho người báo cáo..."
								value={responseText}
								onChange={(e) => setResponseText(e.target.value)}
								rows={4}
							/>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setSelectedReport(null)}>Hủy</Button>
						<Button onClick={handleRespond} disabled={!responseText.trim()}>Gửi phản hồi & Đánh dấu đã giải quyết</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<AlertDialog open={!!deleteReportId} onOpenChange={(open) => { if (!open) setDeleteReportId(null); }}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xóa báo cáo?</AlertDialogTitle>
						<AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Hủy</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
