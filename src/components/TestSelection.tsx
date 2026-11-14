'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
	BookOpen,
	Headphones,
	Mic,
	PenTool,
	Clock,
	ChevronRight,
	ChevronLeft,
	Search,
	X,
	Users,
} from 'lucide-react';

import { useAppSelector, useIsStoreHydrated } from '@/lib/store/hooks';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ExamPracticeService } from '@/lib/api-client';
import { useTagList } from '@/lib/tag-list';
import { pageWindow } from '@/lib/pagination';
import { TagChips, TagPicker } from './TagPicker';
import type { find_exams_req_dto_FilterOptionsDto } from '@/lib/api/models/find_exams_req_dto_FilterOptionsDto';
import { TestType, ExamStatus } from '../types/client';

type FormattedExam = {
	id: string;
	title: string;
	description?: string;
	duration?: number;
	attemptsCount?: number;
	testType: TestType;
	skill: string;
	tags: string[];
	status: ExamStatus;
};

const META_TAGS = new Set(['ielts', 'toeic']);

type ExamTypeFilter = 'all' | 'ielts' | 'toeic';

const PAGE_SIZE = 6;


function formatDurationShort(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	if (h > 0) return `${h}h ${m}m`;
	return `${m} phút`;
}

export function TestSelection() {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const isHydrated = useIsStoreHydrated();
	const router = useRouter();

	// Tab, search and tags live in the URL (?type=toeic&q=…&tag=…), so the back button from an
	// exam page returns to exactly this list.
	const pathname = usePathname();
	const searchParams = useSearchParams();
	// Exam type filter (?type=ielts|toeic); every exam by default.
	const typeParam = searchParams.get('type');
	const selectedTab: ExamTypeFilter = typeParam === 'ielts' || typeParam === 'toeic' ? typeParam : 'all';
	const submittedSearchName = searchParams.get('q') ?? '';
	const selectedTags = useMemo(() => searchParams.getAll('tag'), [searchParams]);
	// page number in the URL too, so coming back from an exam lands on the same page
	const pageParam = Number(searchParams.get('page'));
	const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
	const [searchName, setSearchName] = useState(submittedSearchName);

	const updateQuery = useCallback(
		(patch: { type?: ExamTypeFilter; q?: string; tags?: string[]; page?: number }) => {
			const next = new URLSearchParams(searchParams.toString());
			// any filter change starts again at page 1; only an explicit page keeps one
			if (patch.page !== undefined && patch.page > 1) next.set('page', String(patch.page));
			else next.delete('page');
			if (patch.type !== undefined) {
				if (patch.type === 'all') next.delete('type');
				else next.set('type', patch.type);
			}
			if (patch.q !== undefined) {
				if (patch.q.trim()) next.set('q', patch.q.trim());
				else next.delete('q');
			}
			if (patch.tags !== undefined) {
				next.delete('tag');
				for (const t of patch.tags) next.append('tag', t);
			}
			const qs = next.toString();
			router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
		},
		[pathname, router, searchParams],
	);
	const setSelectedTab = (type: ExamTypeFilter) => updateQuery({ type: type });
	const setSubmittedSearchName = (q: string) => updateQuery({ q: q });
	const setSelectedTags = (tags: string[]) => updateQuery({ tags: tags });

	const { tags: allTags, loading: loadingTags } = useTagList();
	/** The chosen exam type's tag as stored (e.g. "TOEIC"), sent as a required tag; none for "all". */
	const tabTagName = useMemo(
		() =>
			selectedTab === 'all' ? null : (
				(allTags.find((t) => t.name.toLowerCase() === selectedTab)?.name ?? selectedTab.toUpperCase())
			),
		[allTags, selectedTab],
	);
	/** Tags of the other exam type are hidden from the tag picker once a type is chosen. */
	const otherTabTags = useMemo(
		() => (selectedTab === 'all' ? [] : [selectedTab === 'ielts' ? 'toeic' : 'ielts']),
		[selectedTab],
	);

	const [exams, setExams] = useState<FormattedExam[]>([]);
	const [loadingExams, setLoadingExams] = useState(true);

	const [totalCount, setTotalCount] = useState(0);
	const setPage = (p: number) => {
		updateQuery({ page: p });
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	useEffect(() => {
		if (!isHydrated) return;
		if (!currentUser) {
			router.push('/auth');
		}
	}, [isHydrated, currentUser, router]);

	const deduceTestType = useCallback((raw: any): TestType => {
		const lowerTags: string[] = raw?.tags?.map((t: string) => String(t).toLowerCase()) || [];
		if (lowerTags.includes('ielts')) return TestType.IELTS;
		if (lowerTags.includes('toeic')) return TestType.TOEIC;
		const name = String(raw?.name ?? raw?.title ?? '').trim().toLowerCase();
		if (name.startsWith('ielts')) return TestType.IELTS;
		if (name.startsWith('toeic')) return TestType.TOEIC;
		return TestType.IELTS;
	}, []);

	// keep the search box in step with the URL (back/forward)
	useEffect(() => {
		setSearchName(submittedSearchName);
	}, [submittedSearchName]);

	// Fetch exams when filters or cursor change
	useEffect(() => {
		if (!currentUser) return;
		let cancelled = false;

		const fetchExams = async () => {
			setLoadingExams(true);
			try {
				const filterTags = selectedTags;

				// a chosen exam type is a required tag: only IELTS exams when IELTS is chosen
				const filter: find_exams_req_dto_FilterOptionsDto = tabTagName ? { requiredTags: [tabTagName] } : {};
				if (submittedSearchName.trim()) filter.name = submittedSearchName.trim();
				if (filterTags.length > 0) filter.tags = filterTags;

				const res = await ExamPracticeService.examPracticeGatewayControllerFindExamsV1(
					filter,
					undefined,
					undefined,
					PAGE_SIZE,
					page,
				);

				if (cancelled) return;

				const data = (res as any).data;
				const examsList = data?.exams || [];

				const total = Number(data?.totalCount ?? examsList.length);
				// a stale ?page= past the end (e.g. exams were removed): go to the last page
				if (examsList.length === 0 && page > 1 && total > 0) {
					updateQuery({ page: Math.ceil(total / PAGE_SIZE) });
					return;
				}
				setTotalCount(total);

				const formattedExams: FormattedExam[] = examsList.map((e: any) => {
					const rawTags: string[] = e.tags || [];
					const lowerTags = rawTags.map((t: string) => t.toLowerCase());
					return {
						id: e.id,
						title: e.name,
						description: e.description,
						duration: e.duration,
						attemptsCount: e.attemptsCount,
						testType: deduceTestType(e),
						skill: lowerTags.includes('listening')
							? 'listening'
							: lowerTags.includes('speaking')
								? 'speaking'
								: lowerTags.includes('writing')
									? 'writing'
									: 'reading',
						tags: rawTags,
						status: ExamStatus.Published,
					};
				});
				setExams(formattedExams);
			} catch (err) {
				console.error('Failed to load exams:', err);
			} finally {
				if (!cancelled) setLoadingExams(false);
			}
		};

		fetchExams();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser, selectedTab, submittedSearchName, selectedTags, deduceTestType, page, tabTagName]);

	const clearFilters = () => {
		setSearchName('');
		updateQuery({ q: '', tags: [] });
	};

	const hasActiveFilters = searchName.trim().length > 0 || selectedTags.length > 0;

	const skillIcons: Record<string, typeof BookOpen> = {
		reading: BookOpen,
		listening: Headphones,
		speaking: Mic,
		writing: PenTool,
	};

	const getTagDisplayName = (tagName: string) => {
		const lower = tagName.toLowerCase();
		if (lower === 'listening') return 'Nghe';
		if (lower === 'reading') return 'Đọc';
		if (lower === 'speaking') return 'Nói';
		if (lower === 'writing') return 'Viết';
		if (lower === 'beginner') return 'Cơ bản';
		if (lower === 'intermediate') return 'Trung bình';
		if (lower === 'advanced') return 'Nâng cao';
		return tagName;
	};

	const ExamCard = ({ exam }: { exam: FormattedExam }) => {
		const Icon = skillIcons[exam.skill] || BookOpen;
		const displayTags = exam.tags.filter(
			(t) => !META_TAGS.has(t.toLowerCase()) && !['listening', 'reading', 'speaking', 'writing'].includes(t.toLowerCase()),
		);

		return (
			<Card className="group bg-white rounded-2xl border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1 relative">
				<CardHeader className="pb-4 border-b border-gray-50/80 z-10">
					<div className="flex items-start justify-between">
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<div className="bg-primary/10 text-primary p-2.5 rounded-xl border border-primary/20 shadow-sm">
									<Icon className="h-5 w-5" strokeWidth={2.5} />
								</div>
								<CardTitle className="text-xl font-bold text-slate-800 line-clamp-1">
									{exam.title}
								</CardTitle>
							</div>
							<CardDescription className="line-clamp-2 text-sm text-slate-600 font-medium">
								{exam.description || 'Chưa có mô tả chi tiết cho bài thi này.'}
							</CardDescription>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4 pt-5 flex-1 flex flex-col justify-end z-10">
					<div className="flex items-center gap-4">
						{typeof exam.duration === 'number' && (
							<div className="flex items-center gap-1.5 text-slate-600">
								<Clock className="h-4 w-4 text-primary/80" />
								<span className="text-[13px] font-bold">{formatDurationShort(exam.duration)}</span>
							</div>
						)}
						{typeof exam.attemptsCount === 'number' && (
							<div className="flex items-center gap-1.5 text-slate-600">
								<Users className="h-4 w-4 text-slate-400" />
								<span className="text-[13px] font-bold">{exam.attemptsCount}</span>
							</div>
						)}
					</div>
					{displayTags.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{displayTags.map((tag) => (
								<span
									key={tag}
									className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600"
								>
									{getTagDisplayName(tag)}
								</span>
							))}
						</div>
					)}

					<Button
						className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl h-11 transition-all group-hover:shadow-[0_4px_14px_0_rgb(15,23,42,0.39)]"
						onClick={() => {
							// remember this list (tab, search, tags) for the exam page's back button
							const here = `${pathname}${searchParams.toString() ? `?${searchParams}` : ''}`;
							router.push(`/test/${exam.id}?from=${encodeURIComponent(here)}`);
						}}
					>
						Vào thi ngay
						<ChevronRight className="h-4 w-4 ml-1.5" />
					</Button>
				</CardContent>
			</Card>
		);
	};

	const EmptyState = ({ type }: { type: ExamTypeFilter }) => {
		const EmptyIcon = type === 'toeic' ? Headphones : BookOpen;
		const label = type === 'all' ? '' : type.toUpperCase();
		return (
			<div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300">
				<EmptyIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
				{hasActiveFilters ? (
					<>
						<p className="text-slate-500 font-semibold text-lg">
							Không tìm thấy đề thi{label ? ` ${label}` : ''} phù hợp
						</p>
						<p className="text-slate-400 mt-2 text-sm">
							Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
						</p>
						<Button variant="outline" onClick={clearFilters} className="mt-4 rounded-xl">
							Xóa bộ lọc
						</Button>
					</>
				) : (
					<>
						<p className="text-slate-500 font-semibold text-lg">
							Hệ thống đang cập nhật đề thi{label ? ` ${label}` : ''}
						</p>
						<p className="text-slate-400 mt-2 text-sm">Vui lòng quay lại sau nhé!</p>
					</>
				)}
			</div>
		);
	};

	const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
	const PaginationControls = () => {
		if (pageCount <= 1) return null;
		return (
			<nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang đề thi">
				<Button
					variant="outline"
					onClick={() => setPage(page - 1)}
					disabled={page <= 1 || loadingExams}
					className="rounded-xl gap-1.5"
				>
					<ChevronLeft className="h-4 w-4" />
					Trước
				</Button>
				{pageWindow(page, pageCount).map((p, i) =>
					p === null ?
						<span key={`gap-${i}`} className="px-1 text-slate-400">…</span>
					:	<Button
							key={p}
							variant={p === page ? 'default' : 'outline'}
							onClick={() => setPage(p)}
							disabled={loadingExams}
							aria-current={p === page ? 'page' : undefined}
							className="h-10 w-10 rounded-xl p-0 tabular-nums"
						>
							{p}
						</Button>,
				)}
				<Button
					variant="outline"
					onClick={() => setPage(page + 1)}
					disabled={page >= pageCount || loadingExams}
					className="rounded-xl gap-1.5"
				>
					Sau
					<ChevronRight className="h-4 w-4" />
				</Button>
			</nav>
		);
	};

	return (
		<div className="w-full pb-20">
			{/* Header */}
			<div className="relative overflow-hidden bg-primary text-white shadow-xl mb-10 pt-16 pb-20 px-4 md:px-6 lg:px-8 xl:px-10 text-center">
				<div className="absolute inset-0 bg-black/10 pointer-events-none" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

				<div className="relative z-10 max-w-3xl mx-auto space-y-4">
					<h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight mb-5">
						Chọn Đề Thi
					</h2>
					<p className="text-primary-foreground/80 text-lg md:text-xl font-medium">
						Luyện tập với các đề thi IELTS và TOEIC theo đúng cấu trúc và độ khó thực tế.
					</p>
				</div>
			</div>

			<div className="w-full">
					<div className="space-y-4 mb-8">
			{/* Search input */}
			<div className="relative max-w-md mx-auto">
				<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
				<Input
					placeholder="Tìm kiếm đề thi theo tên..."
					value={searchName}
					onChange={(e) => setSearchName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							setSubmittedSearchName(searchName);
						}
					}}
					className="pl-10 pr-10 h-12 rounded-xl border-slate-200 bg-white shadow-sm text-[15px] placeholder:text-slate-400 focus-visible:ring-primary/30"
				/>
				{searchName && (
					<button
						onClick={() => {
							setSearchName('');
							setSubmittedSearchName('');
						}}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			{/* Tag filter: compact searchable picker over the cached tag tree */}
			<div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
				<div role="radiogroup" aria-label="Loại đề" className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
					{(['all', 'ielts', 'toeic'] as const).map((t) => (
						<button
							key={t}
							type="button"
							role="radio"
							aria-checked={selectedTab === t}
							onClick={() => setSelectedTab(t)}
							className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
								selectedTab === t ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
							}`}
						>
							{t === 'all' ? 'Tất cả' : t.toUpperCase()}
						</button>
					))}
				</div>
				<TagPicker
					tags={allTags}
					value={selectedTags}
					onChange={setSelectedTags}
					exclude={[...META_TAGS].concat(otherTabTags)}
					label={getTagDisplayName}
					loading={loadingTags}
				/>
				{/* keeps its space when hidden, so the controls never shift */}
				<button
					onClick={clearFilters}
					disabled={!hasActiveFilters}
					aria-hidden={!hasActiveFilters}
					tabIndex={hasActiveFilters ? 0 : -1}
					className={`rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-500 transition-all hover:bg-red-50 ${
						hasActiveFilters ? '' : 'invisible'
					}`}
				>
					Xóa bộ lọc
				</button>
			</div>
			<TagChips value={selectedTags} onChange={setSelectedTags} label={getTagDisplayName} />
		</div>

					<section className="space-y-8">
						{selectedTab !== 'all' && (
							<div className="text-center space-y-3 mb-10">
								<h3 className={`text-2xl font-bold ${selectedTab === 'ielts' ? 'text-primary' : 'text-secondary'}`}>
									{selectedTab === 'ielts' ?
										'IELTS - International English Language Testing System'
									:	'TOEIC - Test of English for International Communication'}
								</h3>
								<p className="text-slate-600 font-medium max-w-3xl mx-auto text-[15px]">
									{selectedTab === 'ielts' ?
										'Bài kiểm tra năng lực tiếng Anh quốc tế toàn diện bốn kỹ năng Nghe, Nói, Đọc, Viết phục vụ cho du học và định cư.'
									:	'Đo lường năng lực giao tiếp tiếng Anh trong môi trường đa quốc gia và kinh doanh chuyên nghiệp.'}
								</p>
							</div>
						)}

						{/* Keep the current cards while a new filter loads (dimmed): swapping them for a
						    loading text made the page flash on every tag click. */}
						<div
							className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 transition-opacity duration-200 ${
								loadingExams && exams.length > 0 ? 'pointer-events-none opacity-60' : ''
							}`}
							aria-busy={loadingExams}
						>
							{loadingExams && exams.length === 0 ? (
								<div className="col-span-full py-12 text-center text-slate-500">
									Đang tải danh sách đề thi...
								</div>
							) : exams.length > 0 ? (
								exams.map((exam) => <React.Fragment key={exam.id}>{ExamCard({ exam: exam })}</React.Fragment>)
							) : (
								EmptyState({ type: selectedTab })
							)}
						</div>
						{PaginationControls()}
					</section>
			</div>
		</div>
	);
}
