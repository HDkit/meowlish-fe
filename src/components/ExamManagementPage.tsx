'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	CheckCircle2,
	ClipboardList,
	Clock,
	Eye,
	FileEdit,
	FilePlus,
	FileText,
	Play,
	RefreshCw,
	Trash2,
	X,
	XCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { ExamManagementService } from '@/lib/api-client';
import { normalizeApiError } from '@/lib/api-errors';
import { EXAM_STATUSES, examStatusMeta, formatDate, matchesSearch, paginate } from '@/lib/admin';
import {
	AccessDenied,
	AdminFilterSelect,
	AdminPageHeader,
	AdminPagination,
	AdminSearchInput,
	AdminStatCard,
	AdminStatGrid,
	AdminToolbar,
	ConfirmDialog,
	DataTable,
	RowActions,
	StatusBadge,
	useIdentityNames,
	type DataColumn,
} from './admin';
import { loadManagedExams, type ManagedExam } from './admin/exams';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
	{ value: 'all', label: 'Mọi trạng thái' },
	...Object.entries(EXAM_STATUSES).map(([value, m]) => ({ value: value, label: m.label })),
];

export function ExamManagementPage() {
	const router = useRouter();
	const { toast } = useToast();
	const { currUser, isMod, isStaff, isHeadStaff } = useAuth();
	const allowed = Boolean(currUser) && (isMod || isStaff || isHeadStaff);

	const [exams, setExams] = useState<ManagedExam[]>([]);
	const [complete, setComplete] = useState(true);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string[]>([]);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('all');
	// Admins see every exam; mods/staff only theirs (an admin can narrow to theirs too).
	const [scope, setScope] = useState<'all' | 'mine'>('all');
	const [page, setPage] = useState(1);
	const [toDelete, setToDelete] = useState<ManagedExam | null>(null);

	const onlyMine = !isHeadStaff || scope === 'mine';

	const fetchExams = useCallback(async () => {
		if (!allowed || !currUser) return;
		setLoading(true);
		setLoadError([]);
		try {
			const res = await loadManagedExams(onlyMine ? { createdBy: currUser.id } : {});
			setExams(res.items);
			setComplete(res.complete);
		} catch (err) {
			setLoadError(normalizeApiError(err, { fallback: 'Không thể tải danh sách đề thi' }).messages);
		} finally {
			setLoading(false);
		}
	}, [allowed, currUser, onlyMine]);

	useEffect(() => {
		void fetchExams();
	}, [fetchExams]);

	useEffect(() => setPage(1), [search, status, scope]);

	const names = useIdentityNames(isHeadStaff ? exams.map((e) => e.createdBy) : []);

	const counts = useMemo(() => {
		const by = (s: string) => exams.filter((e) => e.status === s).length;
		return { total: exams.length, PENDING: by('PENDING'), REJECTED: by('REJECTED'), APPROVED: by('APPROVED') };
	}, [exams]);

	const filtered = useMemo(
		() =>
			exams.filter(
				(e) =>
					(status === 'all' || e.status === status) &&
					matchesSearch(search, e.title, e.id, e.createdBy && names[e.createdBy]?.name),
			),
		[exams, status, search, names],
	);
	const paged = paginate(filtered, page, PAGE_SIZE);

	if (!allowed) return <AccessDenied description="Trang này dành cho người soạn đề và quản trị viên." />;

	const edit = (e: ManagedExam) => router.push(`/exam-creation?id=${e.id}`);
	const remove = async (e: ManagedExam) => {
		await ExamManagementService.examManagementGatewayControllerDeleteExamV1(e.id);
		setExams((prev) => prev.filter((x) => x.id !== e.id));
		toast({ title: 'Đã xóa đề thi', description: e.title });
	};

	const toggleStatus = (s: string) => setStatus((cur) => (cur === s ? 'all' : s));
	const hasFilters = Boolean(search) || status !== 'all';

	const columns: DataColumn<ManagedExam>[] = [
		{
			id: 'title',
			header: 'Đề thi',
			cell: (e) => (
				<div className="min-w-0 max-w-md">
					<p className="line-clamp-2 font-medium text-foreground [overflow-wrap:anywhere]">{e.title || 'Chưa đặt tên'}</p>
					<p className="mt-0.5 font-mono text-xs text-muted-foreground">#{e.id.slice(0, 8)}</p>
				</div>
			),
		},
		...(isHeadStaff
			? [
					{
						id: 'creator',
						header: 'Người tạo',
						className: 'hidden lg:table-cell',
						cell: (e: ManagedExam) =>
							e.createdBy === currUser?.id ? (
								<span className="text-muted-foreground">Bạn</span>
							) : (
								<span className="text-muted-foreground">{(e.createdBy && names[e.createdBy]?.name) || '—'}</span>
							),
					},
				]
			: []),
		{ id: 'status', header: 'Trạng thái', cell: (e) => <StatusBadge meta={examStatusMeta(e.status)} /> },
		{
			id: 'created',
			header: 'Ngày tạo',
			className: 'hidden md:table-cell whitespace-nowrap',
			cell: (e) => <span className="tabular-nums text-muted-foreground">{formatDate(e.createdAt)}</span>,
		},
		{
			id: 'updated',
			header: 'Cập nhật',
			className: 'hidden xl:table-cell whitespace-nowrap',
			cell: (e) => <span className="tabular-nums text-muted-foreground">{formatDate(e.updatedAt, true)}</span>,
		},
	];

	return (
		<div className="space-y-5">
			<AdminPageHeader
				icon={ClipboardList}
				title="Quản lý đề thi"
				description={
					isHeadStaff
						? 'Mọi đề thi trên hệ thống: soạn, theo dõi trạng thái duyệt và xóa đề.'
						: 'Đề thi bạn đã tạo: soạn tiếp, gửi duyệt và theo dõi trạng thái.'
				}
				actions={
					<>
						<Button variant="outline" size="sm" onClick={() => void fetchExams()} disabled={loading}>
							<RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
							Làm mới
						</Button>
						<Button size="sm" onClick={() => router.push('/exam-creation')}>
							<FilePlus className="mr-1.5 h-4 w-4" />
							Tạo đề mới
						</Button>
					</>
				}
			>
				<AdminStatGrid>
					<AdminStatCard label="Tất cả" value={counts.total} icon={FileText} loading={loading} active={status === 'all'} onClick={() => setStatus('all')} />
					<AdminStatCard label="Chờ duyệt" value={counts.PENDING} icon={Clock} tone="warning" loading={loading} active={status === 'PENDING'} onClick={() => toggleStatus('PENDING')} />
					<AdminStatCard label="Cần sửa" value={counts.REJECTED} icon={XCircle} tone="danger" loading={loading} active={status === 'REJECTED'} onClick={() => toggleStatus('REJECTED')} />
					<AdminStatCard label="Đã xuất bản" value={counts.APPROVED} icon={CheckCircle2} tone="success" loading={loading} active={status === 'APPROVED'} onClick={() => toggleStatus('APPROVED')} />
				</AdminStatGrid>
			</AdminPageHeader>

			<AdminToolbar summary={!loading && `${filtered.length} đề thi`}>
				<AdminSearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên đề, mã đề…" />
				<AdminFilterSelect label="Trạng thái" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
				{isHeadStaff && (
					<AdminFilterSelect
						label="Người tạo"
						value={scope}
						onChange={(v) => setScope(v as 'all' | 'mine')}
						options={[
							{ value: 'all', label: 'Mọi người tạo' },
							{ value: 'mine', label: 'Đề của tôi' },
						]}
					/>
				)}
				{hasFilters && (
					<Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatus('all'); }}>
						<X className="mr-1 h-4 w-4" />
						Xóa lọc
					</Button>
				)}
			</AdminToolbar>

			{!complete && (
				<p className="text-sm text-muted-foreground">Danh sách quá dài nên chỉ hiển thị một phần; dùng bộ lọc để thu hẹp.</p>
			)}

			<DataTable
				caption="Danh sách đề thi"
				columns={columns}
				rows={paged.items}
				rowKey={(e) => e.id}
				loading={loading}
				error={loadError}
				onRetry={() => void fetchExams()}
				onRowClick={edit}
				empty={
					hasFilters
						? { icon: FileText, title: 'Không có đề thi phù hợp', description: 'Thử từ khóa khác hoặc bỏ bộ lọc.' }
						: {
								icon: FileText,
								title: 'Chưa có đề thi nào',
								description: 'Tạo đề đầu tiên rồi thêm phần thi và câu hỏi.',
								action: (
									<Button size="sm" onClick={() => router.push('/exam-creation')}>
										<FilePlus className="mr-1.5 h-4 w-4" />
										Tạo đề mới
									</Button>
								),
							}
				}
				rowActions={(e) => (
					<RowActions
						label={e.title}
						actions={[
							e.status === 'APPROVED'
								? { label: 'Xem trong trình soạn', icon: Eye, onSelect: () => edit(e) }
								: { label: 'Chỉnh sửa', icon: FileEdit, onSelect: () => edit(e) },
							{ label: 'Làm thử', icon: Play, hidden: e.status !== 'APPROVED', onSelect: () => router.push(`/test/${e.id}`) },
							{ label: 'Xóa đề thi', icon: Trash2, destructive: true, onSelect: () => setToDelete(e) },
						]}
					/>
				)}
			/>

			<AdminPagination page={paged.page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} itemLabel="đề thi" />

			<ConfirmDialog
				open={Boolean(toDelete)}
				onOpenChange={(o) => !o && setToDelete(null)}
				destructive
				title="Xóa đề thi?"
				description={toDelete ? `"${toDelete.title}" cùng mọi phần thi và câu hỏi sẽ bị xóa vĩnh viễn.` : undefined}
				confirmLabel="Xóa đề thi"
				onConfirm={() => (toDelete ? remove(toDelete) : undefined)}
			/>
		</div>
	);
}

export default ExamManagementPage;
