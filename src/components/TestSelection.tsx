'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent } from './ui/tabs';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
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
import { tagPath, useTagList } from '@/lib/tag-list';
import { TagPicker } from './TagPicker';
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
	const { toast } = useToast();

	// Tab, search and tags live in the URL (?type=toeic&q=…&tag=…), so the back button from an
	// exam page returns to exactly this list.
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const selectedTab: 'ielts' | 'toeic' = searchParams.get('type') === 'toeic' ? 'toeic' : 'ielts';
	const submittedSearchName = searchParams.get('q') ?? '';
	const selectedTags = useMemo(() => searchParams.getAll('tag'), [searchParams]);
	const [searchName, setSearchName] = useState(submittedSearchName);

	const updateQuery = useCallback(
		(patch: { type?: 'ielts' | 'toeic'; q?: string; tags?: string[] }) => {
			const next = new URLSearchParams(searchParams.toString());
			if (patch.type !== undefined) next.set('type', patch.type);
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
	const setSelectedTab = (type: 'ielts' | 'toeic') => updateQuery({ type: type });
	const setSubmittedSearchName = (q: string) => updateQuery({ q: q });
	const setSelectedTags = (tags: string[]) => updateQuery({ tags: tags });

	const { tags: allTags, loading: loadingTags } = useTagList();
	/** Name of the tab's exam-type tag as stored (e.g. "TOEIC"), sent as a required tag. */
	const tabTagName = useMemo(
		() => allTags.find((t) => t.name.toLowerCase() === selectedTab)?.name ?? selectedTab.toUpperCase(),
		[allTags, selectedTab],
	);
	const otherTabTags = useMemo(() => [selectedTab === 'ielts' ? 'toeic' : 'ielts'], [selectedTab]);

	const [exams, setExams] = useState<FormattedExam[]>([]);
	const [loadingExams, setLoadingExams] = useState(true);

	const [cursor, setCursor] = useState<string | undefined>(undefined);
	const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
	const [prevCursor, setPrevCursor] = useState<string | undefined>(undefined);

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

	// Reset cursor when filters change
	useEffect(() => {
		setCursor(undefined);
	}, [selectedTab, submittedSearchName, selectedTags]);

	// A link with tags but no exam type (e.g. "Luyện ngay" for a question type): open the tab whose
	// exams carry those tags, from the tag tree if it says, else by asking which type has matches.
	useEffect(() => {
		if (searchParams.get('type') || selectedTags.length === 0 || allTags.length === 0) return;
		let cancelled = false;
		const byId = new Map(allTags.map((t) => [t.id, t]));
		const typesInTree = new Set(
			selectedTags.flatMap((name) => {
				const tag = allTags.find((t) => t.name === name);
				if (!tag) return [];
				return [tag, ...tagPath(tag, byId)]
					.map((t) => t.name.toLowerCase())
					.filter((n): n is 'ielts' | 'toeic' => n === 'ielts' || n === 'toeic');
			}),
		);
		if (typesInTree.size === 1) {
			updateQuery({ type: [...typesInTree][0] });
			return;
		}
		const hasExams = async (type: 'ielts' | 'toeic') => {
			const typeTag = allTags.find((t) => t.name.toLowerCase() === type)?.name ?? type.toUpperCase();
			const res = await ExamPracticeService.examPracticeGatewayControllerFindExamsV1(
				{ requiredTags: [typeTag], tags: selectedTags },
				undefined,
				undefined,
				1,
			);
			return ((res as any).data?.exams?.length ?? 0) > 0;
		};
		void (async () => {
			try {
				const [ielts, toeic] = await Promise.all([hasExams('ielts'), hasExams('toeic')]);
				if (!cancelled && toeic && !ielts) updateQuery({ type: 'toeic' });
			} catch {
				// keep the default tab
			}
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [allTags, selectedTags]);

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

				// the tab is a required tag: IELTS exams on the IELTS tab only
				const filter: find_exams_req_dto_FilterOptionsDto = { requiredTags: [tabTagName] };
				if (submittedSearchName.trim()) filter.name = submittedSearchName.trim();
				if (filterTags.length > 0) filter.tags = filterTags;

				const res = await ExamPracticeService.examPracticeGatewayControllerFindExamsV1(
					filter,
					undefined,
					cursor,
					6,
				);

				if (cancelled) return;

				const data = (res as any).data;
				const examsList = data?.exams || [];

				if (examsList.length === 0 && cursor) {
					toast({ title: 'Không còn kết quả' });
					if (!cancelled) setLoadingExams(false);
					return;
				}

				setNextCursor(data?.nextCursor || undefined);
				setPrevCursor(data?.prevCursor || undefined);

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
	}, [currentUser, selectedTab, submittedSearchName, selectedTags, deduceTestType, cursor, tabTagName]);

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

	const EmptyState = ({ type }: { type: 'ielts' | 'toeic' }) => {
		const EmptyIcon = type === 'ielts' ? BookOpen : Headphones;
		const label = type === 'ielts' ? 'IELTS' : 'TOEIC';
		return (
			<div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300">
				<EmptyIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
				{hasActiveFilters ? (
					<>
						<p className="text-slate-500 font-semibold text-lg">
							Không tìm thấy đề thi {label} phù hợp
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
							Hệ thống đang cập nhật đề thi {label}
						</p>
						<p className="text-slate-400 mt-2 text-sm">Vui lòng quay lại sau nhé!</p>
					</>
				)}
			</div>
		);
	};

	const PaginationControls = () => {
		if (!prevCursor && !nextCursor) return null;
		return (
			<div className="flex items-center justify-center gap-4 mt-8">
				<Button
					variant="outline"
					onClick={() => setCursor(prevCursor)}
					disabled={!prevCursor || loadingExams}
					className="rounded-xl gap-1.5"
				>
					<ChevronLeft className="h-4 w-4" />
					Trang trước
				</Button>
				<Button
					variant="outline"
					onClick={() => setCursor(nextCursor)}
					disabled={!nextCursor || loadingExams}
					className="rounded-xl gap-1.5"
				>
					Trang sau
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
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
				<Tabs
					defaultValue="ielts"
					value={selectedTab}
					onValueChange={(value: any) => {
						setSelectedTab(value);
					}}
					className="w-full"
				>


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
				<TagPicker
					tags={allTags}
					value={selectedTags}
					onChange={setSelectedTags}
					exclude={[...META_TAGS].filter((t) => t !== selectedTab).concat(otherTabTags)}
					label={getTagDisplayName}
					loading={loadingTags}
				/>
				{hasActiveFilters && (
					<button
						onClick={clearFilters}
						className="rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-500 transition-all hover:bg-red-50"
					>
						Xóa bộ lọc
					</button>
				)}
			</div>
		</div>

					<TabsContent
						value="ielts"
						className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
					>
						<div className="text-center space-y-3 mb-10">
							<h3 className="text-2xl font-bold text-primary">
								IELTS - International English Language Testing System
							</h3>
							<p className="text-slate-600 font-medium max-w-3xl mx-auto text-[15px]">
								Bài kiểm tra năng lực tiếng Anh quốc tế toàn diện bốn kỹ năng Nghe, Nói, Đọc, Viết
								phục vụ cho du học và định cư.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
							{loadingExams ? (
								<div className="col-span-full py-12 text-center text-slate-500">
									Đang tải danh sách đề thi...
								</div>
							) : exams.length > 0 ? (
								exams.map((exam) => <ExamCard key={exam.id} exam={exam} />)
							) : (
								<EmptyState type="ielts" />
							)}
						</div>
						<PaginationControls />
					</TabsContent>

					<TabsContent
						value="toeic"
						className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
					>
						<div className="text-center space-y-3 mb-10">
							<h3 className="text-2xl font-bold text-secondary">
								TOEIC - Test of English for International Communication
							</h3>
							<p className="text-slate-600 font-medium max-w-3xl mx-auto text-[15px]">
								Đo lường năng lực giao tiếp tiếng Anh trong môi trường đa quốc gia và kinh doanh chuyên
								nghiệp.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
							{loadingExams ? (
								<div className="col-span-full py-12 text-center text-slate-500">
									Đang tải danh sách đề thi...
								</div>
							) : exams.length > 0 ? (
								exams.map((exam) => <ExamCard key={exam.id} exam={exam} />)
							) : (
								<EmptyState type="toeic" />
							)}
						</div>
						<PaginationControls />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
