'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	ArrowRight,
	CheckCircle2,
	ClipboardCheck,
	ClipboardList,
	Clock,
	FilePlus,
	FileText,
	Flag,
	LayoutDashboard,
	Newspaper,
	RefreshCw,
	Users,
	XCircle,
	type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ReportService } from '@/lib/api/services/ReportService';
import { normalizeApiError } from '@/lib/api-errors';
import { examStatusMeta, formatDate } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { AdminPageHeader, AdminStatCard, AdminStatGrid, DataTable, IdentityNameText, StatusBadge, useIdentityNames, type DataColumn } from './admin';
import { loadExamCounts, loadManagedExams, type ExamCounts, type ManagedExam } from './admin/exams';

type QuickLink = { href: string; label: string; description: string; icon: LucideIcon; badge?: number };

export default function AdminDashboard() {
	const router = useRouter();
	const { currUser, isMod, isStaff, isHeadStaff, canApproveExams } = useAuth();
	const allowed = Boolean(currUser) && (isMod || isStaff || isHeadStaff);

	const [exams, setExams] = useState<ManagedExam[]>([]);
	const [counts, setCounts] = useState<ExamCounts | null>(null);
	const [pendingReports, setPendingReports] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string[]>([]);

	const load = useCallback(async () => {
		if (!allowed || !currUser) return;
		setLoading(true);
		setError([]);
		try {
			const [list, globalCounts] = await Promise.all([
				// Admins look at every exam, others at their own.
				loadManagedExams(isHeadStaff ? {} : { createdBy: currUser.id }),
				isHeadStaff ? loadExamCounts() : Promise.resolve(null),
			]);
			setExams(list.items);
			setCounts(globalCounts);
		} catch (err) {
			setError(normalizeApiError(err, { fallback: 'Không thể tải dữ liệu đề thi' }).messages);
		} finally {
			setLoading(false);
		}
		if (isHeadStaff || isMod) {
			ReportService.listReports(undefined, undefined, 'pending', undefined, undefined, 1, 1)
				.then((res) => {
					const data = ((res as { data?: unknown }).data ?? res) as { totalCount?: number };
					setPendingReports(data.totalCount ?? 0);
				})
				.catch(() => setPendingReports(null));
		}
	}, [allowed, currUser, isHeadStaff, isMod]);

	useEffect(() => {
		void load();
	}, [load]);

	const stats = useMemo(() => {
		if (counts) return { ...counts, draft: Math.max(0, counts.total - counts.approved - counts.pending - counts.rejected) };
		const by = (s: string) => exams.filter((e) => e.status === s).length;
		return { total: exams.length, approved: by('APPROVED'), pending: by('PENDING'), rejected: by('REJECTED'), draft: by('EMPTY') };
	}, [counts, exams]);

	const pendingExams = useMemo(
		() =>
			exams
				.filter((e) => e.status === 'PENDING')
				.sort((a, b) => new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime()),
		[exams],
	);
	const recent = exams.slice(0, 6);
	const names = useIdentityNames(isHeadStaff ? recent.map((e) => e.createdBy) : []);

	if (!allowed || !currUser) return null;
	// Only the first load shows placeholders; "Làm mới" keeps the current numbers on screen.
	const firstLoad = loading && exams.length === 0 && !counts;

	const links: QuickLink[] = [
		{ href: '/exam-creation', label: 'Tạo đề thi', description: 'Soạn đề mới với phần thi và câu hỏi', icon: FilePlus },
		{ href: '/exam-management', label: 'Quản lý đề thi', description: 'Theo dõi trạng thái và chỉnh sửa đề', icon: ClipboardList },
		...(canApproveExams
			? [{ href: '/exam-approval', label: 'Duyệt đề thi', description: 'Xuất bản hoặc trả đề về cho tác giả', icon: ClipboardCheck, badge: stats.pending }]
			: []),
		{ href: '/blog-management', label: 'Quản lý bài viết', description: 'Viết và sửa bài trên blog', icon: Newspaper },
		...(isHeadStaff ? [{ href: '/user-management', label: 'Quản lý người dùng', description: 'Vai trò và khóa tài khoản', icon: Users }] : []),
		...(isHeadStaff || isMod
			? [{ href: '/report-management', label: 'Quản lý báo cáo', description: 'Xử lý báo cáo từ người dùng', icon: Flag, badge: pendingReports ?? undefined }]
			: []),
	];

	const columns: DataColumn<ManagedExam>[] = [
		{
			id: 'title',
			header: 'Đề thi',
			cell: (e) => <p className="line-clamp-1 max-w-md font-medium [overflow-wrap:anywhere]">{e.title || 'Chưa đặt tên'}</p>,
		},
		...(isHeadStaff
			? [
					{
						id: 'creator',
						header: 'Người tạo',
						className: 'hidden lg:table-cell whitespace-nowrap',
						cell: (e: ManagedExam) => (
							<span className="text-muted-foreground">
								{e.createdBy === currUser.id ? 'Bạn' : <IdentityNameText id={e.createdBy} names={names} />}
							</span>
						),
					},
				]
			: []),
		{ id: 'status', header: 'Trạng thái', cell: (e) => <StatusBadge meta={examStatusMeta(e.status)} /> },
		{
			id: 'created',
			header: 'Ngày tạo',
			className: 'hidden sm:table-cell whitespace-nowrap',
			cell: (e) => <span className="tabular-nums text-muted-foreground">{formatDate(e.createdAt)}</span>,
		},
	];

	return (
		<div className="space-y-6">
			<AdminPageHeader
				icon={LayoutDashboard}
				title="Tổng quan quản trị"
				description={`Xin chào ${currUser.fullName || 'bạn'}. ${isHeadStaff ? 'Số liệu đề thi toàn hệ thống.' : 'Số liệu các đề thi bạn đã tạo.'}`}
				actions={
					<Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
						<RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
						Làm mới
					</Button>
				}
			>
				<AdminStatGrid>
					<AdminStatCard label="Tổng đề thi" value={stats.total} icon={FileText} loading={firstLoad} hint={firstLoad ? '\u00a0' : `${stats.draft} bản nháp`} />
					<AdminStatCard label="Chờ duyệt" value={stats.pending} icon={Clock} tone="warning" loading={firstLoad} />
					<AdminStatCard label="Cần sửa" value={stats.rejected} icon={XCircle} tone="danger" loading={firstLoad} />
					<AdminStatCard label="Đã xuất bản" value={stats.approved} icon={CheckCircle2} tone="success" loading={firstLoad} />
				</AdminStatGrid>
			</AdminPageHeader>

			<section aria-labelledby="admin-shortcuts" className="space-y-3">
				<h2 id="admin-shortcuts" className="text-sm font-semibold text-muted-foreground">
					Lối tắt
				</h2>
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{links.map((l) => (
						<Link
							key={l.href}
							href={l.href}
							className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<l.icon className="h-5 w-5" aria-hidden />
							</span>
							<span className="min-w-0 flex-1">
								<span className="flex items-center gap-2 font-medium text-foreground">
									{l.label}
									{!!l.badge && (
										<StatusBadge tone="warning" dot={false}>
											{l.badge}
										</StatusBadge>
									)}
								</span>
								<span className="block truncate text-xs text-muted-foreground">{l.description}</span>
							</span>
							<ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
						</Link>
					))}
				</div>
			</section>

			{canApproveExams && pendingExams.length > 0 && (
				<section aria-labelledby="admin-pending" className="space-y-3">
					<div className="flex items-center justify-between gap-2">
						<h2 id="admin-pending" className="text-sm font-semibold text-muted-foreground">
							Đề chờ duyệt lâu nhất
						</h2>
						<Button variant="link" size="sm" className="h-auto p-0" asChild>
							<Link href="/exam-approval">Mở trang duyệt</Link>
						</Button>
					</div>
					<DataTable
						caption="Đề thi chờ duyệt"
						columns={columns}
						rows={pendingExams.slice(0, 5)}
						rowKey={(e) => e.id}
						onRowClick={() => router.push('/exam-approval')}
						empty={{ title: 'Không có đề chờ duyệt' }}
					/>
				</section>
			)}

			<section aria-labelledby="admin-recent" className="space-y-3">
				<div className="flex items-center justify-between gap-2">
					<h2 id="admin-recent" className="text-sm font-semibold text-muted-foreground">
						{isHeadStaff ? 'Đề thi mới tạo' : 'Đề thi của tôi'}
					</h2>
					<Button variant="link" size="sm" className="h-auto p-0" asChild>
						<Link href="/exam-management">Xem tất cả</Link>
					</Button>
				</div>
				<DataTable
					caption="Đề thi gần đây"
					columns={columns}
					rows={recent}
					rowKey={(e) => e.id}
					loading={loading}
					error={error}
					onRetry={() => void load()}
					skeletonRows={4}
					onRowClick={(e) => router.push(`/exam-creation?id=${e.id}`)}
					empty={{
						icon: FileText,
						title: 'Chưa có đề thi nào',
						description: 'Đề bạn tạo sẽ hiển thị ở đây.',
						action: (
							<Button size="sm" asChild>
								<Link href="/exam-creation">
									<FilePlus className="mr-1.5 h-4 w-4" />
									Tạo đề thi
								</Link>
							</Button>
						),
					}}
				/>
			</section>
		</div>
	);
}
