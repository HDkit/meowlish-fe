'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import {
	BookOpen,
	Headphones,
	Mic,
	PenTool,
	Clock,
	Users,
	Trophy,
	Play,
	Star,
	TrendingUp,
	Target,
	ChevronRight,
	Tag,
} from 'lucide-react';

import { useSelector } from 'react-redux';
import { RootState } from './store/main/store';
import { Exam, Question, Section, TestType, ExamStatus } from '../types/client';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { useRouter } from 'next/navigation';
import { ExamPracticeService } from '@/lib/api-client';

export function TestSelection() {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const router = useRouter();
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (!currentUser) {
			router.push('/auth'); // redirect if not logged in
		}
	}, [currentUser, router]);
	const [selectedTab, setSelectedTab] = useState<'ielts' | 'toeic' | 'practice'>('ielts');

	const [exams, setExams] = useState<any[]>([]);
	const [loadingExams, setLoadingExams] = useState(true);

	useEffect(() => {
		const fetchExams = async () => {
			try {
				setLoadingExams(true);
				const res = await ExamPracticeService.examPracticeGatewayControllerFindExamsV1(undefined, undefined, undefined, 100);
				const examsList = res.data?.exams || [];
				const formattedExams = examsList.map((e: any) => {
					const lowerTags = e.tags?.map((t: string) => t.toLowerCase()) || [];
					return {
						id: e.id,
						title: e.name,
						description: e.description,
						duration: e.duration,
						// Parse tags to deduce the testType, difficulty, and skill
						difficulty: lowerTags.includes('beginner') ? 'beginner' : lowerTags.includes('advanced') ? 'advanced' : 'intermediate',
						testType: lowerTags.includes('ielts') ? TestType.IELTS : TestType.TOEIC,
						skill: lowerTags.includes('listening') ? 'listening' : lowerTags.includes('speaking') ? 'speaking' : lowerTags.includes('writing') ? 'writing' : 'reading',
						tagIds: e.tags || [],
						status: ExamStatus.Published,
					};
				});
				setExams(formattedExams);
			} catch (err) {
				console.error("Failed to load exams:", err);
			} finally {
				setLoadingExams(false);
			}
		};

		if (currentUser) {
			fetchExams();
		}
	}, [currentUser]);

	// Keep these to satisfy ExamCard typing for now if not fully replaced
	const sections = useSelector((state: RootState) => state.sections.list);
	const questions = useSelector((state: RootState) => state.questions.list);
	const tags = useSelector((state: RootState) => state.tags.list);

	const skillIcons = {
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

	const filterExams = (testType: TestType) => {
		return exams.filter((exam) => exam.testType === testType && (exam.status === ExamStatus.Published || exam.status === ExamStatus.Approved));
	};

	const ExamCard = ({ exam }: { exam: Exam }) => {
		const Icon = skillIcons[exam.skill];

		const difficulty = exam.difficulty;

		function countQuestionsInExam(examId: string, sections: Section[], questions: Question[]): number {
			// Collect all section IDs under this exam (including nested sections)
			const sectionIds: Set<string> = new Set();

			// Helper: recursively add section IDs
			function addSections(parentId: string) {
				for (const sec of sections) {
					if (sec.parentId === parentId) {
						sectionIds.add(sec.id);
						addSections(sec.id); // recurse into nested sections
					}
				}
			}

			addSections(examId);

			// Count questions whose sectionId is in our set
			const count = questions.filter((q) => sectionIds.has(q.sectionId)).length;

			return count;
		}

		return (
			<Card className='group bg-white rounded-2xl border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1 relative'>
				{/* Decorative background blur inside the card */}
				<div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none ${difficulty === 'beginner' ? 'bg-green-400' : difficulty === 'intermediate' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>

				<CardHeader className='pb-4 border-b border-gray-50/80 z-10'>
					<div className='flex items-start justify-between'>
						<div className='space-y-3'>
							<div className='flex items-center gap-3'>
								<div className="bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-100/50 shadow-sm">
									<Icon className='h-5 w-5' strokeWidth={2.5} />
								</div>
								<CardTitle className='text-xl font-bold text-slate-800 line-clamp-1'>{exam.title}</CardTitle>
							</div>
							<CardDescription className="line-clamp-2 text-sm text-slate-600 font-medium">
								{exam.description || 'Chưa có mô tả chi tiết cho bài thi này.'}
							</CardDescription>
						</div>
						<span className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold shadow-sm whitespace-nowrap border ${getDifficultyColor(exam.difficulty)}`}>
							{getDifficultyText(exam.difficulty)}
						</span>
					</div>
				</CardHeader>

				<CardContent className='space-y-6 pt-5 flex-1 flex flex-col justify-end z-10'>
					<div className='grid grid-cols-3 gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
						<div className='text-center border-r border-slate-200 last:border-0 p-1'>
							<div className='flex flex-col items-center justify-center'>
								<Clock className='h-4 w-4 mb-1.5 text-blue-500' />
								<span className="text-[13px] font-bold text-slate-700">{exam.duration}</span>
								<span className="text-[10px] text-slate-500 font-semibold uppercase">Phút</span>
							</div>
						</div>
						<div className='text-center border-r border-slate-200 last:border-0 p-1'>
							<div className='flex flex-col items-center justify-center'>
								<Target className='h-4 w-4 mb-1.5 text-rose-500' />
								<span className="text-[13px] font-bold text-slate-700">N/A</span>
								<span className="text-[10px] text-slate-500 font-semibold uppercase">Câu Hỏi</span>
							</div>
						</div>
						<div className='text-center p-1'>
							<div className='flex flex-col items-center justify-center'>
								<Tag className='h-4 w-4 mb-1.5 text-amber-500' />
								<span className="text-[13px] font-bold text-slate-700 line-clamp-1 px-1">
									{exam.tagIds.join(', ') || 'Chung'}
								</span>
								<span className="text-[10px] text-slate-500 font-semibold uppercase">Chủ Đề</span>
							</div>
						</div>
					</div>

					<Button
						className='w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl h-11 transition-all group-hover:shadow-[0_4px_14px_0_rgb(15,23,42,0.39)]'
						onClick={() => {
							router.push('/test/' + exam.id);
						}}
					>
						Vào thi ngay
						<ChevronRight className='h-4 w-4 ml-1.5' />
					</Button>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className='min-h-screen bg-slate-50/50 pb-20'>
			{/* Modern Premium Header */}
			<div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white shadow-xl mb-10 pt-16 pb-20 px-6 sm:px-10 text-center">
				<div className="absolute inset-0 bg-black/10 pointer-events-none" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

				<div className='relative z-10 max-w-3xl mx-auto space-y-4'>
					<div className="flex justify-center">
						<Badge variant="outline" className="mb-2 bg-white/20 backdrop-blur-md border-white/30 text-white px-5 py-1.5 text-sm font-bold tracking-wide rounded-full shadow-lg flex items-center gap-2">
							<Star className="w-4 h-4 text-yellow-300 fill-yellow-300" /> Hệ Sinh Thái Đề Thi
						</Badge>
					</div>
					<h2 className='text-4xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight mb-5'>
						Lựa Chọn Thử Thách Của Bạn
					</h2>
					<p className='text-blue-100 text-lg md:text-xl font-medium'>
						Danh sách các bài thi được tuyển chọn, mô phỏng đúng cấu trúc và độ khó thực tế. Hãy bắt đầu hành trình nâng cao trình độ ngay hôm nay.
					</p>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				{/* Exam Selection Tabs */}
				<Tabs defaultValue='ielts' value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)} className="w-full">
					<div className="flex justify-center mb-12">
						<TabsList className='bg-slate-100/80 p-1.5 rounded-2xl shadow-inner border border-slate-200/60 inline-flex'>
							<TabsTrigger value='ielts' className='rounded-xl px-10 py-3 text-[15px] font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all'>
								IELTS Exam
							</TabsTrigger>
							<TabsTrigger value='toeic' className='rounded-xl px-10 py-3 text-[15px] font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm transition-all'>
								TOEIC Exam
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value='ielts' className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
						<div className='text-center space-y-3 mb-10'>
							<h3 className='text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700'>IELTS - International English Language Testing System</h3>
							<p className='text-slate-600 font-medium max-w-3xl mx-auto text-[15px]'>Bài kiểm tra năng lực tiếng Anh quốc tế toàn diện bốn kỹ năng Nghe, Nói, Đọc, Viết phục vụ cho du học và định cư.</p>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'>
							{loadingExams ? (
								<div className="col-span-full py-12 text-center text-slate-500">Đang tải danh sách đề thi...</div>
							) : filterExams(TestType.IELTS).map((exam) => (
								<ExamCard key={exam.id} exam={exam as any} />
							))}
							{!loadingExams && filterExams(TestType.IELTS).length === 0 && (
								<div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300">
									<BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
									<p className="text-slate-500 font-semibold text-lg">Hệ thống đang cập nhật đề thi IELTS</p>
									<p className="text-slate-400 mt-2 text-sm">Vui lòng quay lại sau nhé!</p>
								</div>
							)}
						</div>
					</TabsContent>

					<TabsContent value='toeic' className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
						<div className='text-center space-y-3 mb-10'>
							<h3 className='text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-700'>TOEIC - Test of English for International Communication</h3>
							<p className='text-slate-600 font-medium max-w-3xl mx-auto text-[15px]'>Đo lường năng lực giao tiếp tiếng Anh trong môi trường đa quốc gia và kinh doanh chuyên nghiệp.</p>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'>
							{loadingExams ? (
								<div className="col-span-full py-12 text-center text-slate-500">Đang tải danh sách đề thi...</div>
							) : filterExams(TestType.TOEIC).map((exam) => (
								<ExamCard key={exam.id} exam={exam as any} />
							))}
							{!loadingExams && filterExams(TestType.TOEIC).length === 0 && (
								<div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300">
									<Headphones className="w-16 h-16 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
									<p className="text-slate-500 font-semibold text-lg">Hệ thống đang cập nhật đề thi TOEIC</p>
									<p className="text-slate-400 mt-2 text-sm">Vui lòng quay lại sau nhé!</p>
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
