import { useState } from 'react';
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
} from 'lucide-react';
import type { TestType, Skill } from '../App';
import { useSelector } from 'react-redux';
import { RootState } from './store/main/store';
import { TestOption } from './store/examSlice';

interface TestSelectionProps {
	onStartTest: (testType: TestType, skill: Skill, testId?: string) => void;
	userProgress?: {
		ieltsScore: number;
		toeicScore: number;
		completedTests: number;
	};
	preselectedTestType?: TestType | null;
}

export function TestSelection() {
	const [selectedTab, setSelectedTab] = useState<'ielts' | 'toeic' | 'practice'>('ielts');

	const skillIcons = {
		reading: BookOpen,
		listening: Headphones,
		speaking: Mic,
		writing: PenTool,
	};

	const mockTests = useSelector((state: RootState) => state.tests.tests);

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

	const filterTests = (testType: TestType) => {
		return mockTests.filter((test) => test.testType === testType);
	};

	const getRecommendedTests = () => {
		// Return top 3 most popular tests across all types
		return [...mockTests].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 3);
	};

	const TestCard = ({ test }: { test: TestOption }) => {
		const Icon = skillIcons[test.skill];

		return (
			<Card className='hover:shadow-md transition-shadow'>
				<CardHeader>
					<div className='flex items-start justify-between'>
						<div className='space-y-2'>
							<div className='flex items-center gap-2'>
								<Icon className='h-5 w-5 text-primary' />
								<CardTitle className='text-lg'>{test.title}</CardTitle>
							</div>
							<CardDescription>{test.description}</CardDescription>
						</div>
						<Badge className={getDifficultyColor(test.difficulty)}>{getDifficultyText(test.difficulty)}</Badge>
					</div>
				</CardHeader>

				<CardContent className='space-y-4'>
					<div className='grid grid-cols-3 gap-4 text-sm'>
						<div className='text-center'>
							<div className='flex items-center justify-center gap-1 text-muted-foreground'>
								<Clock className='h-4 w-4' />
								<span>{test.duration} phút</span>
							</div>
						</div>
						<div className='text-center'>
							<div className='flex items-center justify-center gap-1 text-muted-foreground'>
								<Target className='h-4 w-4' />
								<span>{test.questions} câu</span>
							</div>
						</div>
						<div className='text-center'>
							<div className='flex items-center justify-center gap-1 text-muted-foreground'>
								<Users className='h-4 w-4' />
								<span>{test.popularity}%</span>
							</div>
						</div>
					</div>

					{test.averageScore && (
						<div className='bg-muted/50 p-3 rounded-lg'>
							<div className='flex items-center justify-between text-sm'>
								<span>Điểm trung bình:</span>
								<div className='flex items-center gap-1'>
									<Star className='h-4 w-4 text-yellow-500' />
									<span className='font-medium'>
										{test.testType === 'ielts' ? `${test.averageScore}/9.0` : `${test.averageScore}/990`}
									</span>
								</div>
							</div>
						</div>
					)}

					<Button className='w-full' onClick={() => {}}>
						<Play className='h-4 w-4 mr-2' />
						Bắt đầu làm bài
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

			{/* Test Selection */}
			<Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='ielts'>IELTS</TabsTrigger>
					<TabsTrigger value='toeic'>TOEIC</TabsTrigger>
					<TabsTrigger value='practice'>Đề xuất</TabsTrigger>
				</TabsList>

				<TabsContent value='ielts' className='space-y-6'>
					<div className='text-center space-y-2'>
						<h3 className='text-xl font-semibold'>IELTS - International English Language Testing System</h3>
						<p className='text-muted-foreground'>Kiểm tra năng lực tiếng Anh quốc tế cho du học và định cư</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{filterTests('ielts').map((test) => (
							<TestCard key={test.id} test={test} />
						))}
					</div>
				</TabsContent>

				<TabsContent value='toeic' className='space-y-6'>
					<div className='text-center space-y-2'>
						<h3 className='text-xl font-semibold'>TOEIC - Test of English for International Communication</h3>
						<p className='text-muted-foreground'>Đánh giá khả năng sử dụng tiếng Anh trong môi trường công việc</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{filterTests('toeic').map((test) => (
							<TestCard key={test.id} test={test} />
						))}
					</div>
				</TabsContent>

				<TabsContent value='practice' className='space-y-6'>
					<div className='text-center space-y-2'>
						<h3 className='text-xl font-semibold'>Đề thi được đề xuất</h3>
						<p className='text-muted-foreground'>Những bài kiểm tra phổ biến và phù hợp với trình độ của bạn</p>
					</div>

					<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
						{getRecommendedTests().map((test) => (
							<TestCard key={test.id} test={test} />
						))}
					</div>

					<Separator />

					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Trophy className='h-5 w-5 text-yellow-500' />
								Luyện tập theo kỹ năng
							</CardTitle>
							<CardDescription>Tập trung vào từng kỹ năng cụ thể để cải thiện điểm số</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
								{(['reading', 'listening', 'writing', 'speaking'] as Skill[]).map((skill) => {
									const Icon = skillIcons[skill];
									const skillNames = {
										reading: 'Đọc hiểu',
										listening: 'Nghe hiểu',
										writing: 'Viết',
										speaking: 'Nói',
									};

									return (
										<Button
											key={skill}
											variant='outline'
											className='h-auto p-4 flex flex-col items-center gap-3'
											onClick={() => {}}
										>
											<Icon className='h-8 w-8' />
											<span>{skillNames[skill]}</span>
											<ChevronRight className='h-4 w-4' />
										</Button>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
