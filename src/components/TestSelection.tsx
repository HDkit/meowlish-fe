'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import {
	BookOpen,
	Headphones,
	Mic,
	PenTool,
	Clock,
	Target,
	ChevronRight,
	FileText,
	Star,
	Search,
	X,
	Filter,
} from 'lucide-react';

import { useAppSelector, useIsStoreHydrated } from '@/lib/store/hooks';
import { useRouter } from 'next/navigation';
import { ExamPracticeService, TagsService } from '@/lib/api-client';
import type { find_exams_req_dto_FilterOptionsDto } from '@/lib/api/models/find_exams_req_dto_FilterOptionsDto';
import { TestType, ExamStatus } from '../types/client';

type ExamStats = {
	duration?: number;
	sectionsCount?: number;
	questionsCount?: number;
	attemptsCount?: number;
};

type TagNode = { id: string; name: string; parentId?: string };

type FormattedExam = {
	id: string;
	title: string;
	description?: string;
	duration?: number;
	difficulty: string;
	testType: TestType;
	skill: string;
	tagIds: string[];
	status: ExamStatus;
};

const TAB_TAG_MAP: Record<string, string> = {
	ielts: 'ielts',
	toeic: 'toeic',
};

const META_TAGS = new Set(['ielts', 'toeic']);

export function TestSelection() {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const isHydrated = useIsStoreHydrated();
	const router = useRouter();

	const [selectedTab, setSelectedTab] = useState<'ielts' | 'toeic'>('ielts');
	const [searchName, setSearchName] = useState('');
	const [debouncedName, setDebouncedName] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);

	const [allTags, setAllTags] = useState<TagNode[]>([]);

	const [exams, setExams] = useState<FormattedExam[]>([]);
	const [loadingExams, setLoadingExams] = useState(true);
	const [examStatsById, setExamStatsById] = useState<Record<string, ExamStats>>({});

	useEffect(() => {
		if (!isHydrated) return;
		if (!currentUser) {
			router.push('/auth');
		}
	}, [isHydrated, currentUser, router]);

	// Debounce search name
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedName(searchName), 350);
		return () => clearTimeout(timer);
	}, [searchName]);

	// Fetch tags on mount
	useEffect(() => {
		const fetchTags = async () => {
			try {
				const res = await TagsService.tagGatewayControllerGetTagListV1();
				setAllTags((res as any).data?.list || []);
			} catch (err) {
				console.error('Failed to load tags:', err);
			}
		};
		fetchTags();
	}, []);

	const deduceTestType = useCallback((raw: any): TestType => {
		const lowerTags: string[] = raw?.tags?.map((t: string) => String(t).toLowerCase()) || [];
		if (lowerTags.includes('ielts')) return TestType.IELTS;
		if (lowerTags.includes('toeic')) return TestType.TOEIC;
		const name = String(raw?.name ?? raw?.title ?? '').trim().toLowerCase();
		if (name.startsWith('ielts')) return TestType.IELTS;
		if (name.startsWith('toeic')) return TestType.TOEIC;
		return TestType.IELTS;
	}, []);

	// Fetch exams when filters change
	useEffect(() => {
		if (!currentUser) return;
		let cancelled = false;

		const fetchExams = async () => {
			setLoadingExams(true);
			try {
				const tabTag = TAB_TAG_MAP[selectedTab];
				const filterTags = [...selectedTags];
				if (tabTag) filterTags.push(tabTag);

				const filter: find_exams_req_dto_FilterOptionsDto = {};
				if (debouncedName.trim()) filter.name = debouncedName.trim();
				if (filterTags.length > 0) filter.tags = filterTags;

				const hasFilter = Object.keys(filter).length > 0;
				const res = await ExamPracticeService.examPracticeGatewayControllerFindExamsV1(
					hasFilter ? filter : undefined,
					undefined,
					undefined,
					100,
				);

				if (cancelled) return;

				const examsList = (res as any).data?.exams || [];
				const formattedExams: FormattedExam[] = examsList.map((e: any) => {
					const lowerTags = e.tags?.map((t: string) => t.toLowerCase()) || [];
					return {
						id: e.id,
						title: e.name,
						description: e.description,
						duration: e.duration,
						difficulty: lowerTags.includes('beginner')
							? 'beginner'
							: lowerTags.includes('advanced')
								? 'advanced'
								: 'intermediate',
						testType: deduceTestType(e),
						skill: lowerTags.includes('listening')
							? 'listening'
							: lowerTags.includes('speaking')
								? 'speaking'
								: lowerTags.includes('writing')
									? 'writing'
									: 'reading',
						tagIds: e.tags || [],
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
	}, [currentUser, selectedTab, debouncedName, selectedTags, deduceTestType]);

	// Fetch per-exam stats
	useEffect(() => {
		if (!currentUser || !exams.length) return;
		let cancelled = false;

		const fetchExamStats = async (examId: string) => {
			try {
				const response = await ExamPracticeService.examPracticeGatewayControllerGetExamDetailsV1(examId);
				const payload: any = (response as any)?.data;
				const sections = Array.isArray(payload?.sections) ? payload.sections : [];
				const questionsCount = sections.reduce(
					(acc: number, cur: any) => acc + (Number(cur?.questionsCount) || 0),
					0,
				);
				if (cancelled) return;
				setExamStatsById((prev) => ({
					...prev,
					[examId]: {
						duration: payload?.duration,
						sectionsCount: sections.length,
						questionsCount,
						attemptsCount: payload?.attemptsCount,
					},
				}));
			} catch {
				// ignore per-exam failures
			}
		};

		const missingIds = exams
			.map((e) => e?.id)
			.filter((id) => typeof id === 'string' && id.length > 0)
			.filter((id) => !examStatsById[id]);

		if (!missingIds.length) return;

		const runWithConcurrency = async (ids: string[], concurrency: number) => {
			let index = 0;
			const workers = new Array(Math.min(concurrency, ids.length)).fill(0).map(async () => {
				while (!cancelled) {
					const current = ids[index++];
					if (!current) return;
					await fetchExamStats(current);
				}
			});
			await Promise.allSettled(workers);
		};

		runWithConcurrency(missingIds, 6);

		return () => {
			cancelled = true;
		};
	}, [currentUser, exams, examStatsById]);

	// Filterable tags: exclude meta tags (ielts/toeic) since those are handled by tabs
	const filterableTags = useMemo(() => {
		return allTags.filter((t) => !META_TAGS.has(t.name.toLowerCase()));
	}, [allTags]);

	const toggleTag = useCallback((tagName: string) => {
		setSelectedTags((prev) =>
			prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName],
		);
	}, []);

	const clearFilters = useCallback(() => {
		setSearchName('');
		setSelectedTags([]);
	}, []);

	const hasActiveFilters = searchName.trim().length > 0 || selectedTags.length > 0;

	const skillIcons: Record<string, typeof BookOpen> = {
		reading: BookOpen,
		listening: Headphones,
		speaking: Mic,
		writing: PenTool,
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'beginner':
				return 'bg-green-100 text-green-700 border-green-200/60';
			case 'intermediate':
				return 'bg-yellow-100 text-yellow-700 border-yellow-200/60';
			case 'advanced':
				return 'bg-red-100 text-red-700 border-red-200/60';
			default:
				return 'bg-slate-100 text-slate-700 border-slate-200/60';
		}
	};

	const getDifficultyText = (difficulty: string) => {
		switch (difficulty) {
			case 'beginner':
				return 'Cơ bản';
			case 'intermediate':
				return 'Trung bình';
			case 'advanced':
				return 'Nâng cao';
			default:
				return difficulty;
		}
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
		const stats = examStatsById[String(exam.id)] ?? {};
		const durationSeconds =
			typeof stats.duration === 'number'
				? stats.duration
				: typeof exam.duration === 'number'
					? exam.duration
					: undefined;
		const sectionsCount = stats.sectionsCount;
		const questionsCount = stats.questionsCount;

		return (
			<Card className="group bg-white rounded-2xl border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1 relative">
				<div
					className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none ${exam.difficulty === 'beginner' ? 'bg-green-400' : exam.difficulty === 'intermediate' ? 'bg-yellow-400' : 'bg-red-400'}`}
				/>

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
						<span
							className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold shadow-sm whitespace-nowrap border ${getDifficultyColor(exam.difficulty)}`}
						>
							{getDifficultyText(exam.difficulty)}
						</span>
					</div>
				</CardHeader>

				<CardContent className="space-y-6 pt-5 flex-1 flex flex-col justify-end z-10">
					<div className="grid grid-cols-3 gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
						<div className="text-center border-r border-slate-200 last:border-0 p-1">
							<div className="flex flex-col items-center justify-center">
								<Clock className="h-4 w-4 mb-1.5 text-primary/80" />
								<span className="text-[13px] font-bold text-slate-700">
									{typeof durationSeconds === 'number' ? durationSeconds : '—'}
								</span>
								<span className="text-[10px] text-slate-500 font-semibold uppercase">Giây</span>
							</div>
						</div>
						<div className="text-center border-r border-slate-200 last:border-0 p-1">
							<div className="flex flex-col items-center justify-center">
								<FileText className="h-4 w-4 mb-1.5 text-emerald-600" />
								<span className="text-[13px] font-bold text-slate-700">
									{typeof sectionsCount === 'number' ? sectionsCount : '—'}
								</span>
								<span className="text-[10px] text-slate-500 font-semibold uppercase">Phần Thi</span>
							</div>
						</div>
						<div className="text-center p-1">
							<div className="flex flex-col items-center justify-center">
								<Target className="h-4 w-4 mb-1.5 text-rose-500" />
								<span className="text-[13px] font-bold text-slate-700">
									{typeof questionsCount === 'number' ? questionsCount : '—'}
								</span>
								<span className="text-[10px] text-slate-500 font-semibold uppercase">Câu Hỏi</span>
							</div>
						</div>
					</div>

					<Button
						className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl h-11 transition-all group-hover:shadow-[0_4px_14px_0_rgb(15,23,42,0.39)]"
						onClick={() => {
							router.push('/test/' + exam.id);
						}}
					>
						Vào thi ngay
						<ChevronRight className="h-4 w-4 ml-1.5" />
					</Button>
				</CardContent>
			</Card>
		);
	};

	const FilterBar = () => (
		<div className="space-y-4 mb-8">
			{/* Search input */}
			<div className="relative max-w-md mx-auto">
				<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
				<Input
					placeholder="Tìm kiếm đề thi theo tên..."
					value={searchName}
					onChange={(e) => setSearchName(e.target.value)}
					className="pl-10 pr-10 h-12 rounded-xl border-slate-200 bg-white shadow-sm text-[15px] placeholder:text-slate-400 focus-visible:ring-primary/30"
				/>
				{searchName && (
					<button
						onClick={() => setSearchName('')}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			{/* Tag filter chips */}
			{filterableTags.length > 0 && (
				<div className="flex items-center gap-2 max-w-3xl mx-auto">
					<Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
					<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" style={{ scrollbarWidth: 'thin' }}>
						{filterableTags.map((tag) => {
							const isSelected = selectedTags.includes(tag.name);
							return (
								<button
									key={tag.id}
									onClick={() => toggleTag(tag.name)}
									className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap flex-shrink-0 ${
										isSelected
											? 'bg-primary text-white border-primary shadow-sm'
											: 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'
									}`}
								>
									{getTagDisplayName(tag.name)}
								</button>
							);
						})}
						{hasActiveFilters && (
							<button
								onClick={clearFilters}
								className="px-3 py-1.5 rounded-full text-sm font-medium text-red-500 hover:bg-red-50 border border-red-200 transition-all whitespace-nowrap flex-shrink-0"
							>
								Xóa bộ lọc
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);

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

	return (
		<div className="w-full pb-20">
			{/* Header */}
			<div className="relative overflow-hidden bg-primary text-white shadow-xl mb-10 pt-16 pb-20 px-4 md:px-6 lg:px-8 xl:px-10 text-center">
				<div className="absolute inset-0 bg-black/10 pointer-events-none" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

				<div className="relative z-10 max-w-3xl mx-auto space-y-4">
					<div className="flex justify-center">
						<Badge
							variant="outline"
							className="mb-2 bg-white/20 backdrop-blur-md border-white/30 text-white px-5 py-1.5 text-sm font-bold tracking-wide rounded-full shadow-lg flex items-center gap-2"
						>
							<Star className="w-4 h-4 text-yellow-300 fill-yellow-300" /> Hệ Sinh Thái Đề Thi
						</Badge>
					</div>
					<h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight mb-5">
						Lựa Chọn Thử Thách Của Bạn
					</h2>
					<p className="text-primary-foreground/80 text-lg md:text-xl font-medium">
						Danh sách các bài thi được tuyển chọn, mô phỏng đúng cấu trúc và độ khó thực tế. Hãy bắt đầu
						hành trình nâng cao trình độ ngay hôm nay.
					</p>
				</div>
			</div>

			<div className="w-full">
				<Tabs
					defaultValue="ielts"
					value={selectedTab}
					onValueChange={(value: any) => {
						setSelectedTab(value);
						setExamStatsById({});
					}}
					className="w-full"
				>
					<div className="flex justify-center mb-8">
						<TabsList className="bg-slate-100/80 p-1.5 rounded-2xl shadow-inner border border-slate-200/60 inline-flex">
							<TabsTrigger
								value="ielts"
								className="rounded-xl px-10 py-3 text-[15px] font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
							>
								IELTS Exam
							</TabsTrigger>
							<TabsTrigger
								value="toeic"
								className="rounded-xl px-10 py-3 text-[15px] font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-secondary data-[state=active]:shadow-sm transition-all"
							>
								TOEIC Exam
							</TabsTrigger>
						</TabsList>
					</div>

					<FilterBar />

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
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
