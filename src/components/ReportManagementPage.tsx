'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	CheckCircle2,
	Clock,
	ExternalLink,
	Eye,
	Flag,
	Loader2,
	MessageSquare,
	Paperclip,
	RefreshCw,
	Search,
	Trash2,
	X,
	XCircle,
} from 'lucide-react';
import { ReportService, type ReportResponse } from '@/lib/api/services/ReportService';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { normalizeApiError } from '@/lib/api-errors';
import {
	REPORT_STATUSES,
	REPORT_TARGETS,
	REPORT_TYPES,
	formatDate,
	matchesSearch,
	reportStatusMeta,
	reportTargetUrl,
} from '@/lib/admin';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { FieldError, FormErrorSummary, fieldA11y } from './ui/form-feedback';
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
	IdentityNameText,
} from './admin';

const PAGE_SIZE = 20;
const STATUS_KEYS = Object.keys(REPORT_STATUSES); // pending, reviewing, resolved, rejected

type Confirm = { kind: 'reject' | 'delete'; report: ReportResponse } | null;

export default function ReportManagementPage() {
	const router = useRouter();
	const { currUser, isHeadStaff, isMod } = useAuth();
	const { toast } = useToast();
	// Updating/deleting reports is open to moderators and admins (REPORT_STAFF_ROLES).
	const allowed = Boolean(currUser) && (isHeadStaff || isMod);

	const [reports, setReports] = useState<ReportResponse[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [statusCounts, setStatusCounts] = useState<Record<string, number> | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string[]>([]);
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState('all');
	const [type, setType] = useState('all');
	const [search, setSearch] = useState('');
	const [detail, setDetail] = useState<ReportResponse | null>(null);
	const [confirm, setConfirm] = useState<Confirm>(null);

	useEffect(() => setPage(1), [status, type]);

	const fetchReports = useCallback(async () => {
		if (!allowed) return;
		setLoading(true);
		setLoadError([]);
		try {
			const res = (await ReportService.listReports(
				undefined,
				type === 'all' ? undefined : type,
				status === 'all' ? undefined : status,
				undefined,
				undefined,
				page,
				PAGE_SIZE,
			)) as unknown as { data?: { reports?: ReportResponse[]; totalCount?: number } };
			// ResponseEntity envelope; older gateways answered the bare list.
			const data = res.data ?? (res as { reports?: ReportResponse[]; totalCount?: number });
			const list = data.reports ?? [];
			setReports(list);
			setTotalCount(data.totalCount ?? list.length);
		} catch (err) {
			setReports([]);
			setLoadError(normalizeApiError(err, { fallback: 'Không thể tải danh sách báo cáo' }).messages);
		} finally {
			setLoading(false);
		}
	}, [allowed, page, status, type]);

	// Per-status totals for the stat cards (the list itself is paginated on the server).
	const fetchCounts = useCallback(async () => {
		if (!allowed) return;
		try {
			const totals = await Promise.all(
				STATUS_KEYS.map(async (s) => {
					const res = (await ReportService.listReports(undefined, undefined, s, undefined, undefined, 1, 1)) as unknown as {
						data?: { totalCount?: number };
					};
					return [s, (res.data ?? (res as { totalCount?: number })).totalCount ?? 0] as const;
				}),
			);
			setStatusCounts(Object.fromEntries(totals));
		} catch (err) {
			console.warn('ReportManagement: counts failed', err);
		}
	}, [allowed]);

	useEffect(() => {
		void fetchReports();
	}, [fetchReports]);
	useEffect(() => {
		void fetchCounts();
	}, [fetchCounts]);

	const names = useIdentityNames(reports.flatMap((r) => [r.reportedBy, r.resolvedBy]));
	const nameOf = (id?: string) => (id ? names[id]?.name ?? 'Người dùng' : '—');

	const visible = useMemo(
		() => reports.filter((r) => matchesSearch(search, r.title, r.description, r.reportedBy && names[r.reportedBy]?.name)),
		[reports, search, names],
	);

	if (!allowed) return <AccessDenied description="Chỉ điều hành viên và quản trị viên xử lý được báo cáo." />;

	const refresh = () => {
		void fetchReports();
		void fetchCounts();
	};

	const update = async (report: ReportResponse, patch: { status: string; adminResponse?: string }) => {
		await ReportService.updateReport(report.id, patch);
		const next = { ...report, ...patch, resolvedBy: currUser?.id, updatedAt: new Date().toISOString() };
		setReports((prev) => prev.map((r) => (r.id === report.id ? next : r)));
		setDetail((d) => (d?.id === report.id ? next : d));
		void fetchCounts();
	};

	const quickStatus = async (report: ReportResponse, next: string) => {
		try {
			await update(report, { status: next });
			toast({ title: `Đã chuyển sang "${reportStatusMeta(next).label}"` });
		} catch (err) {
			toast({ title: 'Cập nhật thất bại', description: normalizeApiError(err).messages.join('\n'), variant: 'destructive' });
		}
	};

	const remove = async (report: ReportResponse) => {
		await ReportService.deleteReport(report.id);
		setDetail((d) => (d?.id === report.id ? null : d));
		toast({ title: 'Đã xóa báo cáo' });
		refresh();
	};

	const toggleStatus = (s: string) => setStatus((cur) => (cur === s ? 'all' : s));
	const hasFilters = status !== 'all' || type !== 'all' || Boolean(search);
	const countsLoading = statusCounts === null;
	const totalAll = statusCounts ? Object.values(statusCounts).reduce((a, b) => a + b, 0) : 0;

	const columns: DataColumn<ReportResponse>[] = [
		{
			id: 'report',
			header: 'Báo cáo',
			cell: (r) => (
				<div className="min-w-0 max-w-lg">
					<p className="line-clamp-1 font-medium text-foreground [overflow-wrap:anywhere]">{r.title}</p>
					<p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">{r.description}</p>
				</div>
			),
		},
		{
			id: 'type',
			header: 'Loại',
			className: 'hidden lg:table-cell whitespace-nowrap',
			cell: (r) => (
				<span className="text-muted-foreground">
					{REPORT_TYPES[r.type] ?? r.type}
					{r.targetType && <span className="block text-xs">{REPORT_TARGETS[r.targetType] ?? r.targetType}</span>}
				</span>
			),
		},
		{ id: 'reporter', header: 'Người gửi', className: 'whitespace-nowrap', cell: (r) => <span className="text-muted-foreground"><IdentityNameText id={r.reportedBy} names={names} fallback={r.reportedBy ? 'Người dùng' : '—'} /></span> },
		{ id: 'status', header: 'Trạng thái', cell: (r) => <StatusBadge meta={reportStatusMeta(r.status)} /> },
		{
			id: 'created',
			header: 'Gửi lúc',
			className: 'hidden md:table-cell whitespace-nowrap',
			cell: (r) => <span className="tabular-nums text-muted-foreground">{formatDate(r.createdAt, true)}</span>,
		},
	];

	const open = (r: ReportResponse) => r.status === 'pending' || r.status === 'reviewing';

	return (
		<div className="space-y-5">
			<AdminPageHeader
				icon={Flag}
				title="Quản lý báo cáo"
				description="Báo cáo lỗi và vi phạm từ người dùng: xem xét, phản hồi, giải quyết hoặc từ chối."
				actions={
					<Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
						<RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
						Làm mới
					</Button>
				}
			>
				<AdminStatGrid className="lg:grid-cols-5">
					<AdminStatCard label="Tất cả" value={totalAll} icon={Flag} loading={countsLoading} active={status === 'all'} onClick={() => setStatus('all')} />
					<AdminStatCard label="Chờ xử lý" value={statusCounts?.pending ?? 0} icon={Clock} tone="warning" loading={countsLoading} active={status === 'pending'} onClick={() => toggleStatus('pending')} />
					<AdminStatCard label="Đang xem xét" value={statusCounts?.reviewing ?? 0} icon={Eye} tone="info" loading={countsLoading} active={status === 'reviewing'} onClick={() => toggleStatus('reviewing')} />
					<AdminStatCard label="Đã giải quyết" value={statusCounts?.resolved ?? 0} icon={CheckCircle2} tone="success" loading={countsLoading} active={status === 'resolved'} onClick={() => toggleStatus('resolved')} />
					<AdminStatCard label="Đã từ chối" value={statusCounts?.rejected ?? 0} icon={XCircle} tone="danger" loading={countsLoading} active={status === 'rejected'} onClick={() => toggleStatus('rejected')} />
				</AdminStatGrid>
			</AdminPageHeader>

			<AdminToolbar summary={!(loading && reports.length === 0) && `${totalCount} báo cáo`}>
				<AdminSearchInput value={search} onChange={setSearch} placeholder="Lọc trang này theo tiêu đề, nội dung…" />
				<AdminFilterSelect
					label="Trạng thái"
					value={status}
					onChange={setStatus}
					options={[{ value: 'all', label: 'Mọi trạng thái' }, ...STATUS_KEYS.map((s) => ({ value: s, label: REPORT_STATUSES[s].label }))]}
				/>
				<AdminFilterSelect
					label="Loại báo cáo"
					value={type}
					onChange={setType}
					options={[{ value: 'all', label: 'Mọi loại' }, ...Object.entries(REPORT_TYPES).map(([value, label]) => ({ value: value, label: label }))]}
				/>
				{hasFilters && (
					<Button variant="ghost" size="sm" onClick={() => { setStatus('all'); setType('all'); setSearch(''); }}>
						<X className="mr-1 h-4 w-4" />
						Xóa lọc
					</Button>
				)}
			</AdminToolbar>

			<DataTable
				caption="Danh sách báo cáo"
				columns={columns}
				rows={visible}
				rowKey={(r) => r.id}
				loading={loading}
				error={loadError}
				onRetry={() => void fetchReports()}
				onRowClick={setDetail}
				empty={
					search && reports.length > 0
						? { icon: Search, title: 'Không có báo cáo phù hợp trong trang này', description: 'Thử từ khóa khác hoặc sang trang khác.' }
						: hasFilters
							? { icon: Flag, title: 'Không có báo cáo phù hợp', description: 'Thử đổi trạng thái hoặc loại báo cáo.' }
							: { icon: CheckCircle2, title: 'Chưa có báo cáo nào', description: 'Báo cáo người dùng gửi sẽ xuất hiện ở đây.' }
				}
				rowActions={(r) => (
					<RowActions
						label={r.title}
						actions={[
							{ label: 'Xem và phản hồi', icon: MessageSquare, onSelect: () => setDetail(r) },
							{ label: 'Bắt đầu xem xét', icon: Eye, hidden: r.status !== 'pending', onSelect: () => void quickStatus(r, 'reviewing') },
							{
								label: 'Mở nội dung bị báo cáo',
								icon: ExternalLink,
								hidden: !reportTargetUrl(r.targetType, r.targetId),
								onSelect: () => router.push(reportTargetUrl(r.targetType, r.targetId)!),
							},
							{ label: 'Từ chối báo cáo', icon: XCircle, destructive: true, hidden: !open(r), onSelect: () => setConfirm({ kind: 'reject', report: r }) },
							{ label: 'Xóa báo cáo', icon: Trash2, destructive: true, onSelect: () => setConfirm({ kind: 'delete', report: r }) },
						]}
					/>
				)}
			/>

			<AdminPagination page={page} pageSize={PAGE_SIZE} total={totalCount} onPageChange={setPage} itemLabel="báo cáo" />

			<ReportDetailDialog
				report={detail}
				reporter={nameOf(detail?.reportedBy)}
				resolver={detail?.resolvedBy ? nameOf(detail.resolvedBy) : undefined}
				onClose={() => setDetail(null)}
				onUpdate={update}
				onReject={(r) => setConfirm({ kind: 'reject', report: r })}
				onOpenTarget={(url) => router.push(url)}
			/>

			<ConfirmDialog
				open={confirm?.kind === 'reject'}
				onOpenChange={(o) => !o && setConfirm(null)}
				destructive
				title="Từ chối báo cáo?"
				description={confirm ? `"${confirm.report.title}" sẽ được đánh dấu là không vi phạm / không phải lỗi.` : undefined}
				confirmLabel="Từ chối"
				onConfirm={async () => {
					if (!confirm) return;
					await update(confirm.report, { status: 'rejected' });
					toast({ title: 'Đã từ chối báo cáo' });
				}}
			/>
			<ConfirmDialog
				open={confirm?.kind === 'delete'}
				onOpenChange={(o) => !o && setConfirm(null)}
				destructive
				title="Xóa báo cáo?"
				description={confirm ? `"${confirm.report.title}" sẽ bị xóa vĩnh viễn. Không thể hoàn tác.` : undefined}
				confirmLabel="Xóa báo cáo"
				onConfirm={() => (confirm ? remove(confirm.report) : undefined)}
			/>
		</div>
	);
}

function ReportDetailDialog({
	report,
	reporter,
	resolver,
	onClose,
	onUpdate,
	onReject,
	onOpenTarget,
}: {
	report: ReportResponse | null;
	reporter: string;
	resolver?: string;
	onClose: () => void;
	onUpdate: (report: ReportResponse, patch: { status: string; adminResponse?: string }) => Promise<void>;
	onReject: (report: ReportResponse) => void;
	onOpenTarget: (url: string) => void;
}) {
	const [response, setResponse] = useState('');
	const [responseError, setResponseError] = useState('');
	const [errors, setErrors] = useState<string[]>([]);
	const [saving, setSaving] = useState<string | null>(null);

	useEffect(() => {
		setResponse(report?.adminResponse ?? '');
		setResponseError('');
		setErrors([]);
	}, [report?.id]); // eslint-disable-line react-hooks/exhaustive-deps

	if (!report) return <Dialog open={false} />;
	const isOpen = report.status === 'pending' || report.status === 'reviewing';
	const targetUrl = reportTargetUrl(report.targetType, report.targetId);

	const run = async (key: string, patch: { status: string; adminResponse?: string }) => {
		setSaving(key);
		setErrors([]);
		try {
			await onUpdate(report, patch);
			if (key === 'resolve') onClose();
		} catch (err) {
			const res = normalizeApiError(err, { fields: { adminResponse: 'response' } });
			setResponseError(res.fieldErrors.response ?? '');
			setErrors(res.messages);
		} finally {
			setSaving(null);
		}
	};

	const resolve = () => {
		if (!response.trim()) {
			setResponseError('Nhập phản hồi cho người báo cáo trước khi đánh dấu đã giải quyết');
			return;
		}
		void run('resolve', { status: 'resolved', adminResponse: response.trim() });
	};

	return (
		<Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
			<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="pr-6 [overflow-wrap:anywhere]">{report.title}</DialogTitle>
					<DialogDescription>
						{reporter} · {formatDate(report.createdAt, true)}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge meta={reportStatusMeta(report.status)} />
						<StatusBadge dot={false}>{REPORT_TYPES[report.type] ?? report.type}</StatusBadge>
						{report.targetType && (
							<StatusBadge tone="info" dot={false}>
								{REPORT_TARGETS[report.targetType] ?? report.targetType}
							</StatusBadge>
						)}
						{report.fileIds?.length > 0 && (
							<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
								<Paperclip className="h-3.5 w-3.5" />
								{report.fileIds.length} tệp đính kèm
							</span>
						)}
					</div>

					<p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm [overflow-wrap:anywhere]">{report.description}</p>

					{targetUrl && (
						<Button variant="outline" size="sm" onClick={() => onOpenTarget(targetUrl)}>
							<ExternalLink className="mr-1.5 h-4 w-4" />
							Mở nội dung bị báo cáo
						</Button>
					)}

					{isOpen ? (
						<div className="space-y-2">
							<Label htmlFor="report-response">Phản hồi cho người báo cáo</Label>
							<Textarea
								{...fieldA11y('report-response', responseError)}
								rows={4}
								value={response}
								onChange={(e) => {
									setResponse(e.target.value);
									if (responseError) setResponseError('');
								}}
								placeholder="Ví dụ: Cảm ơn bạn, chúng tôi đã sửa câu hỏi bị lỗi."
							/>
							<FieldError id="report-response" message={responseError} className="-mt-2" />
						</div>
					) : (
						report.adminResponse && (
							<section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950">
								<p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
									<MessageSquare className="h-3.5 w-3.5" />
									Phản hồi{resolver ? ` của ${resolver}` : ''}
								</p>
								<p className="whitespace-pre-line text-emerald-900 [overflow-wrap:anywhere] dark:text-emerald-100">{report.adminResponse}</p>
							</section>
						)
					)}

					<FormErrorSummary messages={errors} />
				</div>

				{isOpen && (
					<DialogFooter className="gap-2">
						<Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => onReject(report)} disabled={!!saving}>
							<XCircle className="mr-1.5 h-4 w-4" />
							Từ chối
						</Button>
						{report.status === 'pending' && (
							<Button variant="outline" onClick={() => void run('review', { status: 'reviewing' })} disabled={!!saving}>
								{saving === 'review' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Eye className="mr-1.5 h-4 w-4" />}
								Bắt đầu xem xét
							</Button>
						)}
						<Button onClick={resolve} disabled={!!saving}>
							{saving === 'resolve' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
							Gửi phản hồi và giải quyết
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
