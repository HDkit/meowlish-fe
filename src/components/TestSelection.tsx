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

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store/main/store';
import { Exam, Question, Section, TestType } from '../types/client';
import { useAppSelector } from './store/main/hook';
import { useNavigate } from 'react-router-dom';

export function TestSelection() {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	useEffect(() => {
		if (!currentUser) {
			navigate('/auth'); // redirect if not logged in
		}
	}, [currentUser, navigate]);
	const [selectedTab, setSelectedTab] = useState<'ielts' | 'toeic' | 'practice'>('ielts');

	const exams = useSelector((state: RootState) => state.exams.list);
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
				return 'bg-green-100 text-green-800';
			case 'intermediate':
				return 'bg-yellow-100 text-yellow-800';
			case 'advanced':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
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
		return exams.filter((exam) => exam.testType === testType && exam.status === 'approved');
	};

	const ExamCard = ({ exam }: { exam: Exam }) => {
		const Icon = skillIcons[exam.skill];

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
			<Card className='hover:shadow-md transition-shadow'>
				<CardHeader>
					<div className='flex items-start justify-between'>
						<div className='space-y-2'>
							<div className='flex items-center gap-2'>
								<Icon className='h-5 w-5 text-primary' />
								<CardTitle className='text-lg'>{exam.title}</CardTitle>
							</div>
							<CardDescription>{exam.description}</CardDescription>
						</div>
						<Badge className={getDifficultyColor(exam.difficulty)}>{getDifficultyText(exam.difficulty)}</Badge>
					</div>
				</CardHeader>

				<CardContent className='space-y-4'>
					<div className='grid grid-cols-3 gap-4 text-sm'>
						<div className='text-center'>
							<div className='flex items-center justify-center gap-1 text-muted-foreground'>
								<Clock className='h-4 w-4' />
								<span>{exam.duration} phút</span>
							</div>
						</div>
						<div className='text-center'>
							<div className='flex items-center justify-center gap-1 text-muted-foreground'>
								<Target className='h-4 w-4' />
								<span>{countQuestionsInExam(exam.id, sections, questions)} câu</span>
							</div>
						</div>
						<div className='text-center'>
							<div className='flex items-center justify-center gap-1 text-muted-foreground'>
								<Tag className='h-4 w-4' />
								<span>{exam.tagIds.map((tagId) => tags.find((tag) => tag.id === tagId)?.name).join(', ')}</span>
							</div>
						</div>
					</div>

					<Button
						className='w-full'
						onClick={() => {
							navigate('/test/' + exam.id);
						}}
					>
						<Play className='h-4 w-4 mr-2' />
						Chi tiết
					</Button>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='text-center space-y-4'>
				<h2 className='text-3xl font-semibold'>Chọn đề thi luyện tập</h2>
				<p className='text-muted-foreground max-w-2xl mx-auto'>
					Lựa chọn bài kiểm tra phù hợp với trình độ và mục tiêu của bạn. Hệ thống AI sẽ điều chỉnh độ khó và đưa ra
					phản hồi cá nhân hóa.
				</p>
			</div>

			{/* Exam Selection */}
			<Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
				<TabsList className='grid w-full grid-cols-2'>
					<TabsTrigger value='ielts'>IELTS</TabsTrigger>
					<TabsTrigger value='toeic'>TOEIC</TabsTrigger>
					{/* <TabsTrigger value='practice'>Đề xuất</TabsTrigger> */}
				</TabsList>

				<TabsContent value='ielts' className='space-y-6'>
					<div className='text-center space-y-2'>
						<h3 className='text-xl font-semibold'>IELTS - International English Language Examing System</h3>
						<p className='text-muted-foreground'>Kiểm tra năng lực tiếng Anh quốc tế cho du học và định cư</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{filterExams(TestType.IELTS).map((exam) => (
							<ExamCard key={exam.id} exam={exam} />
						))}
					</div>
				</TabsContent>

				<TabsContent value='toeic' className='space-y-6'>
					<div className='text-center space-y-2'>
						<h3 className='text-xl font-semibold'>TOEIC - Exam of English for International Communication</h3>
						<p className='text-muted-foreground'>Đánh giá khả năng sử dụng tiếng Anh trong môi trường công việc</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{filterExams(TestType.TOEIC).map((exam) => (
							<ExamCard key={exam.id} exam={exam} />
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
