import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
	BookOpen,
	GraduationCap,
	Clock,
	Users,
	Search,
	Filter,
	Star,
	TrendingUp,
	FileText,
	Play,
	Info,
} from 'lucide-react';
import { TestType, Skill, User } from '../App';

interface TestsPageProps {
	onStartTest: (testType: TestType, skill: Skill, testId?: string) => void;
	preselectedTestType?: TestType | null;
	currentUser?: User | null;
	onRequestLogin?: () => void;
}

interface TestSuite {
	id: string;
	title: string;
	testType: TestType;
	skills: Skill[];
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	duration: number; // minutes
	questionsCount: number;
	description: string;
	rating: number;
	completions: number;
	isPopular?: boolean;
	isNew?: boolean;
}

const mockTestSuites: TestSuite[] = [
	{
		id: 'ielts-academic-1',
		title: 'IELTS Academic Reading - Cambridge Practice Test 1',
		testType: 'ielts',
		skills: ['reading'],
		difficulty: 'intermediate',
		duration: 60,
		questionsCount: 40,
		description: 'Bài thi đọc hiểu IELTS Academic với 3 đoạn văn và 40 câu hỏi đa dạng',
		rating: 4.8,
		completions: 1234,
		isPopular: true,
	},
	{
		id: 'toeic-listening-1',
		title: 'TOEIC Listening & Reading - Business English',
		testType: 'toeic',
		skills: ['listening', 'reading'],
		difficulty: 'intermediate',
		duration: 120,
		questionsCount: 200,
		description: 'Bài thi TOEIC tập trung vào tiếng Anh trong môi trường kinh doanh',
		rating: 4.6,
		completions: 1456,
		isPopular: true,
	},
	// ...add other tests as needed
];

export function TestsPage({ onStartTest, preselectedTestType, currentUser, onRequestLogin }: TestsPageProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTestType, setSelectedTestType] = useState<TestType | 'all'>(preselectedTestType || 'all');
	const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
	const [selectedSkill, setSelectedSkill] = useState<Skill | 'all'>('all');

	const filteredTests = mockTestSuites.filter((test) => {
		const matchesSearch =
			test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			test.description.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesType = selectedTestType === 'all' || test.testType === selectedTestType;
		const matchesDifficulty = selectedDifficulty === 'all' || test.difficulty === selectedDifficulty;
		const matchesSkill = selectedSkill === 'all' || test.skills.includes(selectedSkill);
		return matchesSearch && matchesType && matchesDifficulty && matchesSkill;
	});

	const difficultyColor = (difficulty: string) =>
		({
			beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
		}[difficulty] || 'bg-gray-100 text-gray-800');

	const testTypeIcon = (type: TestType) =>
		type === 'ielts' ? (
			<GraduationCap className='h-5 w-5 text-blue-600' />
		) : (
			<BookOpen className='h-5 w-5 text-green-600' />
		);

	const formatDuration = (minutes: number) =>
		minutes < 60 ? `${minutes} phút` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;

	return (
		<div className='space-y-6'>
			{/* Guest Banner */}
			{!currentUser && (
				<Alert className='border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'>
					<Info className='h-4 w-4 text-blue-600 dark:text-blue-400' />
					<AlertTitle className='text-blue-900 dark:text-blue-100'>Bạn chưa đăng nhập</AlertTitle>
					<AlertDescription className='text-blue-800 dark:text-blue-200'>
						Bạn cần đăng nhập để làm bài thi và theo dõi tiến độ học tập của mình.{' '}
						<button onClick={onRequestLogin} className='underline hover:text-blue-600 dark:hover:text-blue-300'>
							Đăng nhập ngay
						</button>
						.
					</AlertDescription>
				</Alert>
			)}

			{/* Header */}
			<div className='space-y-2'>
				<h1 className='text-3xl font-bold'>Ngân hàng đề thi</h1>
				<p className='text-muted-foreground'>
					Luyện tập với hàng trăm đề thi IELTS và TOEIC được thiết kế bởi chuyên gia
				</p>
			</div>

			{/* Search */}
			<div className='space-y-4'>
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<Input
						placeholder='Tìm kiếm đề thi...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='pl-10'
					/>
				</div>

				{/* Filters */}
				<div className='flex flex-wrap gap-4'>
					{/* Test Type */}
					<div className='flex items-center space-x-2'>
						<Filter className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>Loại thi:</span>
						<div className='flex space-x-2'>
							<Button
								variant={selectedTestType === 'all' ? 'default' : 'outline'}
								size='sm'
								onClick={() => setSelectedTestType('all')}
							>
								Tất cả
							</Button>
							<Button
								variant={selectedTestType === 'ielts' ? 'default' : 'outline'}
								size='sm'
								onClick={() => setSelectedTestType('ielts')}
							>
								<GraduationCap className='h-4 w-4 mr-1' />
								IELTS
							</Button>
							<Button
								variant={selectedTestType === 'toeic' ? 'default' : 'outline'}
								size='sm'
								onClick={() => setSelectedTestType('toeic')}
							>
								<BookOpen className='h-4 w-4 mr-1' />
								TOEIC
							</Button>
						</div>
					</div>

					{/* Difficulty */}
					<div className='flex items-center space-x-2'>
						<span className='text-sm font-medium'>Độ khó:</span>
						<div className='flex space-x-2'>
							{(['all', 'beginner', 'intermediate', 'advanced'] as const).map((d) => (
								<Button
									key={d}
									variant={selectedDifficulty === d ? 'default' : 'outline'}
									size='sm'
									onClick={() => setSelectedDifficulty(d)}
								>
									{d === 'all'
										? 'Tất cả'
										: d === 'beginner'
										? 'Cơ bản'
										: d === 'intermediate'
										? 'Trung bình'
										: 'Nâng cao'}
								</Button>
							))}
						</div>
					</div>

					{/* Skill */}
					<div className='flex items-center space-x-2'>
						<span className='text-sm font-medium'>Kỹ năng:</span>
						<div className='flex space-x-2'>
							{(['all', 'listening', 'reading', 'writing', 'speaking'] as const).map((skill) => (
								<Button
									key={skill}
									variant={selectedSkill === skill ? 'default' : 'outline'}
									size='sm'
									onClick={() => setSelectedSkill(skill)}
								>
									{skill === 'all'
										? 'Tất cả'
										: skill === 'listening'
										? 'Nghe'
										: skill === 'reading'
										? 'Đọc'
										: skill === 'writing'
										? 'Viết'
										: 'Nói'}
								</Button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Results count */}
			<p className='text-sm text-muted-foreground'>Tìm thấy {filteredTests.length} đề thi</p>

			{/* Test Cards */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{filteredTests.map((test) => (
					<Card key={test.id} className='hover:shadow-md transition-shadow'>
						<CardHeader className='space-y-2'>
							<div className='flex items-start justify-between'>
								<div className='flex items-center space-x-2'>
									{testTypeIcon(test.testType)}
									<Badge variant='secondary' className='text-xs'>
										{test.testType.toUpperCase()}
									</Badge>
								</div>
								<div className='flex items-center space-x-1'>
									{test.isPopular && (
										<Badge variant='destructive' className='text-xs'>
											<TrendingUp className='h-3 w-3 mr-1' />
											Phổ biến
										</Badge>
									)}
									{test.isNew && (
										<Badge variant='default' className='text-xs bg-green-600 hover:bg-green-700'>
											Mới
										</Badge>
									)}
								</div>
							</div>
							<CardTitle className='text-lg leading-tight'>{test.title}</CardTitle>
							<CardDescription className='text-sm'>{test.description}</CardDescription>
							<div className='flex flex-wrap gap-1'>
								{test.skills.map((skill) => (
									<Badge key={skill} variant='outline' className='text-xs'>
										{skill === 'listening'
											? 'Nghe'
											: skill === 'reading'
											? 'Đọc'
											: skill === 'writing'
											? 'Viết'
											: 'Nói'}
									</Badge>
								))}
							</div>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='grid grid-cols-2 gap-4 text-sm'>
								<div className='flex items-center space-x-2'>
									<Clock className='h-4 w-4 text-muted-foreground' />
									<span>{formatDuration(test.duration)}</span>
								</div>
								<div className='flex items-center space-x-2'>
									<FileText className='h-4 w-4 text-muted-foreground' />
									<span>{test.questionsCount} câu hỏi</span>
								</div>
								<div className='flex items-center space-x-2'>
									<Star className='h-4 w-4 text-yellow-500 fill-current' />
									<span>{test.rating}/5</span>
								</div>
								<div className='flex items-center space-x-2'>
									<Users className='h-4 w-4 text-muted-foreground' />
									<span>{test.completions.toLocaleString()}</span>
								</div>
							</div>
							<Badge className={difficultyColor(test.difficulty)}>
								{test.difficulty === 'beginner'
									? 'Cơ bản'
									: test.difficulty === 'intermediate'
									? 'Trung bình'
									: 'Nâng cao'}
							</Badge>
							<Button
								className='w-full'
								onClick={() => {
									if (!currentUser) return onRequestLogin?.();
									onStartTest(test.testType, test.skills[0], test.id);
								}}
							>
								<Play className='h-4 w-4 mr-2' />
								{currentUser ? 'Bắt đầu làm bài' : 'Đăng nhập để làm bài'}
							</Button>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Empty state */}
			{filteredTests.length === 0 && (
				<div className='text-center py-12'>
					<FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
					<h3 className='text-lg font-medium mb-2'>Không tìm thấy đề thi</h3>
					<p className='text-muted-foreground mb-4'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
					<Button
						variant='outline'
						onClick={() => {
							setSearchQuery('');
							setSelectedTestType('all');
							setSelectedDifficulty('all');
							setSelectedSkill('all');
						}}
					>
						Xóa bộ lọc
					</Button>
				</div>
			)}
		</div>
	);
}
