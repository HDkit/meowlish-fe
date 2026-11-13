'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ClipboardCheck, Clock, Eye, FileText, Loader2, RefreshCw, X, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ExamManagementService } from '@/lib/api-client';
import { normalizeApiError } from '@/lib/api-errors';
import { extractEntityData } from '@/lib/api-response';
import { EXAM_STATUSES, examStatusMeta, formatDate, matchesSearch, paginate } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormErrorSummary } from '@/components/ui/form-feedback';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from './ui/use-toast';
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

type ExamDetails = {
	id: string;
	title: string;
	status: string;
	description?: string;
	/** Seconds. */
	duration?: number;
	sectionIds?: string[];
	tags?: string[];
	createdAt?: string;
	updatedAt?: string;
	createdBy?: string;
};

const formatMinutes = (seconds?: number) => (seconds ? `${Math.round(seconds / 60)} phút` : '—');

export default function ExamApprovalPage() {
	const router = useRouter();
	const { currUser, canApproveExams } = useAuth();
	const { toast } = useToast();
	// PATCH /exams/management/:id/review needs exam:approve (admins).
	const allowed = Boolean(currUser) && canApproveExams;

	const [exams, setExams] = useState<ManagedExam[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string[]>([]);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('PENDING');
	const [page, setPage] = useState(1);
	const [preview, setPreview] = useState<ManagedExam | null>(null);
	const [toReject, setToReject] = useState<ManagedExam | null>(null);
	const [approvingId, setApprovingId] = useState<string | null>(null);

	const fetchExams = useCallback(async () => {
		if (!allowed) return;
		setLoading(true);
		setLoadError([]);
		try {
			setExams((await loadManagedExams()).items);
		} catch (err) {
			setLoadError(normalizeApiError(err, { fallback: 'Không thể tải danh sách đề thi' }).messages);
		} finally {
			setLoading(false);
		}
	}, [allowed]);

	useEffect(() => {
		void fetchExams();
	}, [fetchExams]);
	useEffect(() => setPage(1), [search, status]);

	const names = useIdentityNames(exams.map((e) => e.createdBy));

	const counts = useMemo(() => {
		const by = (s: string) => exams.filter((e) => e.status === s).length;
		return { total: exams.length, PENDING: by('PENDING'), APPROVED: by('APPROVED'), REJECTED: by('REJECTED') };
	}, [exams]);

	const filtered = useMemo(
		() =>
			exams
				.filter(
					(e) =>
						(status === 'all' || e.status === status) &&
						matchesSearch(search, e.title, e.id, e.createdBy && names[e.createdBy]?.name),
				)
				// Oldest pending first: it has waited longest.
				.sort((a, b) =>
					status === 'PENDING'
						? new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime()
						: new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
				),
		[exams, status, search, names],
	);
	const paged = paginate(filtered, page, PAGE_SIZE);

	if (!allowed) return <AccessDenied description="Chỉ quản trị viên có quyền duyệt đề thi." />;

	const review = async (exam: ManagedExam, next: 'APPROVED' | 'REJECTED') => {
		await ExamManagementService.examManagementGatewayControllerReviewExamV1(exam.id, { status: next });
		setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, status: next, updatedAt: new Date().toISOString() } : e)));
		setPreview((p) => (p?.id === exam.id ? { ...p, status: next } : p));
		toast(
			next === 'APPROVED'
				? { title: 'Đã duyệt đề thi', description: exam.title }
				: { title: 'Đã trả đề về cho tác giả', description: exam.title },
		);
	};

	const approve = async (exam: ManagedExam) => {
		setApprovingId(exam.id);
		try {
			await review(exam, 'APPROVED');
		} catch (err) {
			toast({ title: 'Duyệt thất bại', description: normalizeApiError(err).messages.join('\n'), variant: 'destructive' });
		} finally {
			setApprovingId(null);
		}
	};

	const toggleStatus = (s: string) => setStatus((cur) => (cur === s ? 'all' : s));
	const creatorName = (e: ManagedExam) => (e.createdBy && names[e.createdBy]?.name) || '—';

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
		{ id: 'creator', header: 'Người tạo', cell: (e) => <span className="text-muted-foreground">{creatorName(e)}</span> },
		{ id: 'status', header: 'Trạng thái', cell: (e) => <StatusBadge meta={examStatusMeta(e.status)} /> },
		{
			id: 'updated',
			header: 'Cập nhật',
			className: 'hidden lg:table-cell whitespace-nowrap',
			cell: (e) => <span className="tabular-nums text-muted-foreground">{formatDate(e.updatedAt, true)}</span>,
		},
		{
			id: 'quick',
			header: <span className="sr-only">Duyệt nhanh</span>,
			className: 'w-0 whitespace-nowrap text-right',
			hideOnCard: true,
			cell: (e) =>
				e.status === 'PENDING' ? (
					<div className="flex justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
						<Button size="sm" variant="outline" className="h-8" onClick={() => setToReject(e)}>
							Từ chối
						</Button>
						<Button size="sm" className="h-8" onClick={() => void approve(e)} disabled={approvingId === e.id}>
							{approvingId === e.id && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
							Duyệt
						</Button>
					</div>
				) : null,
		},
	];

	return (
		<div className="space-y-5">
			<AdminPageHeader
				icon={ClipboardCheck}
				title="Duyệt đề thi"
				description="Xem nội dung đề được gửi duyệt, xuất bản đề đạt yêu cầu hoặc trả về để tác giả sửa."
				actions={
					<Button variant="outline" size="sm" onClick={() => void fetchExams()} disabled={loading}>
						<RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
						Làm mới
					</Button>
				}
			>
				<AdminStatGrid>
					<AdminStatCard label="Chờ duyệt" value={counts.PENDING} icon={Clock} tone="warning" loading={loading} active={status === 'PENDING'} onClick={() => toggleStatus('PENDING')} />
					<AdminStatCard label="Đã xuất bản" value={counts.APPROVED} icon={CheckCircle2} tone="success" loading={loading} active={status === 'APPROVED'} onClick={() => toggleStatus('APPROVED')} />
					<AdminStatCard label="Cần sửa" value={counts.REJECTED} icon={XCircle} tone="danger" loading={loading} active={status === 'REJECTED'} onClick={() => toggleStatus('REJECTED')} />
					<AdminStatCard label="Tất cả" value={counts.total} icon={FileText} loading={loading} active={status === 'all'} onClick={() => setStatus('all')} />
				</AdminStatGrid>
			</AdminPageHeader>

			<AdminToolbar summary={!loading && `${filtered.length} đề thi`}>
				<AdminSearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên đề, mã đề, người tạo…" />
				<AdminFilterSelect label="Trạng thái" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
				{search && (
					<Button variant="ghost" size="sm" onClick={() => setSearch('')}>
						<X className="mr-1 h-4 w-4" />
						Xóa tìm kiếm
					</Button>
				)}
			</AdminToolbar>

			<DataTable
				caption="Đề thi cần duyệt"
				columns={columns}
				rows={paged.items}
				rowKey={(e) => e.id}
				loading={loading}
				error={loadError}
				onRetry={() => void fetchExams()}
				onRowClick={setPreview}
				empty={
					status === 'PENDING' && !search
						? { icon: CheckCircle2, title: 'Không còn đề nào chờ duyệt', description: 'Đề mới gửi duyệt sẽ xuất hiện ở đây.' }
						: { icon: FileText, title: 'Không có đề thi phù hợp', description: 'Thử từ khóa khác hoặc đổi trạng thái.' }
				}
				rowActions={(e) => (
					<RowActions
						label={e.title}
						actions={[
							{ label: 'Xem chi tiết', icon: Eye, onSelect: () => setPreview(e) },
							{ label: 'Mở trong trình soạn', icon: FileText, onSelect: () => router.push(`/exam-creation?id=${e.id}`) },
							{ label: 'Duyệt và xuất bản', icon: CheckCircle2, hidden: e.status !== 'PENDING', onSelect: () => void approve(e) },
							{ label: 'Từ chối', icon: XCircle, destructive: true, hidden: e.status !== 'PENDING', onSelect: () => setToReject(e) },
						]}
					/>
				)}
			/>

			<AdminPagination page={paged.page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} itemLabel="đề thi" />

			<ExamPreviewDialog
				exam={preview}
				creator={preview ? creatorName(preview) : ''}
				approving={approvingId === preview?.id}
				onClose={() => setPreview(null)}
				onApprove={(e) => void approve(e)}
				onReject={setToReject}
				onOpenEditor={(e) => router.push(`/exam-creation?id=${e.id}`)}
			/>

			<ConfirmDialog
				open={Boolean(toReject)}
				onOpenChange={(o) => !o && setToReject(null)}
				destructive
				title="Từ chối đề thi?"
				description={toReject ? `"${toReject.title}" sẽ chuyển sang "Cần sửa" và tác giả cần gửi duyệt lại.` : undefined}
				confirmLabel="Từ chối"
				onConfirm={() => (toReject ? review(toReject, 'REJECTED') : undefined)}
			/>
		</div>
	);
}

function ExamPreviewDialog({
	exam,
	creator,
	approving,
	onClose,
	onApprove,
	onReject,
	onOpenEditor,
}: {
	exam: ManagedExam | null;
	creator: string;
	approving: boolean;
	onClose: () => void;
	onApprove: (exam: ManagedExam) => void;
	onReject: (exam: ManagedExam) => void;
	onOpenEditor: (exam: ManagedExam) => void;
}) {
	const [details, setDetails] = useState<ExamDetails | null>(null);
	const [errors, setErrors] = useState<string[]>([]);

	useEffect(() => {
		setDetails(null);
		setErrors([]);
		if (!exam) return;
		let cancelled = false;
		ExamManagementService.examManagementGatewayControllerGetExamDetailsV1(exam.id)
			.then((res) => {
				if (!cancelled) setDetails(extractEntityData<ExamDetails>(res));
			})
			.catch((err) => {
				if (!cancelled) setErrors(normalizeApiError(err, { fallback: 'Không tải được chi tiết đề thi' }).messages);
			});
		return () => {
			cancelled = true;
		};
	}, [exam?.id]); // eslint-disable-line react-hooks/exhaustive-deps

	const loadingDetails = Boolean(exam) && !details && errors.length === 0;

	return (
		<Dialog open={Boolean(exam)} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="pr-6 [overflow-wrap:anywhere]">{exam?.title}</DialogTitle>
					<DialogDescription>
						{creator} · tạo {formatDate(exam?.createdAt)} · cập nhật {formatDate(exam?.updatedAt, true)}
					</DialogDescription>
				</DialogHeader>

				{exam && (
					<div className="space-y-4">
						<dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<Fact label="Trạng thái">
								<StatusBadge meta={examStatusMeta(exam.status)} />
							</Fact>
							<Fact label="Thời lượng">{loadingDetails ? <Skeleton className="h-4 w-16" /> : formatMinutes(details?.duration)}</Fact>
							<Fact label="Phần thi">{loadingDetails ? <Skeleton className="h-4 w-8" /> : (details?.sectionIds?.length ?? '—')}</Fact>
							<Fact label="Mã đề">
								<span className="font-mono text-xs">#{exam.id.slice(0, 8)}</span>
							</Fact>
						</dl>

						<section>
							<h3 className="mb-1.5 text-sm font-medium">Mô tả</h3>
							{loadingDetails ? (
								<div className="space-y-2">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-2/3" />
								</div>
							) : (
								<p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground [overflow-wrap:anywhere]">
									{details?.description || 'Không có mô tả.'}
								</p>
							)}
						</section>

						{details?.tags && details.tags.length > 0 && (
							<section>
								<h3 className="mb-1.5 text-sm font-medium">Nhãn</h3>
								<div className="flex flex-wrap gap-1">
									{details.tags.map((t) => (
										<StatusBadge key={t} dot={false}>
											{t}
										</StatusBadge>
									))}
								</div>
							</section>
						)}

						<FormErrorSummary messages={errors} />
					</div>
				)}

				<DialogFooter className="gap-2 sm:justify-between">
					<Button variant="outline" onClick={() => exam && onOpenEditor(exam)}>
						<Eye className="mr-1.5 h-4 w-4" />
						Xem toàn bộ câu hỏi
					</Button>
					{exam?.status === 'PENDING' && (
						<div className="flex flex-col-reverse gap-2 sm:flex-row">
							<Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => onReject(exam)}>
								<XCircle className="mr-1.5 h-4 w-4" />
								Từ chối
							</Button>
							<Button onClick={() => onApprove(exam)} disabled={approving}>
								{approving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
								Duyệt và xuất bản
							</Button>
						</div>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="rounded-lg border p-3">
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd className="mt-1 text-sm font-medium">{children}</dd>
		</div>
	);
}
