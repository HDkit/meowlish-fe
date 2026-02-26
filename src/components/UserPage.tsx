import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
	Mail,
	Calendar,
	Trophy,
	Target,
	TrendingUp,
	BookOpen,
	GraduationCap,
	Edit,
	Settings,
	Award,
	BarChart3,
	Flame,
	Headphones,
	PenTool,
	Mic,
	Filter,
} from 'lucide-react';
import { EditGoalButton } from './EditGoalBtn';
import { AddGoalButton } from './AddGoalBtn';
import { useAppSelector } from './store/main/hook';
import { Attempt, Exam, Skill, TestType } from '../types/client';
import { useRouter } from 'next/navigation';

interface UserType {
	fullName: string;
	email: string;
	createdAt: Date;
	progress: {
		totalTests: number;
		ieltsScore: number;
		toeicScore: number;
		studyStreak: number;
		totalStudyTime: number;
		skillScores: Record<Skill, number>;
	};
}

interface Achievement {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	earned: boolean;
	earnedDate?: Date;
	progress?: number;
	maxProgress?: number;
}

export function UserPage() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'history'>('history');
	const [filterTestType, setFilterTestType] = useState<TestType | 'all'>('all');
	const [filterSkill, setFilterSkill] = useState<Skill | 'all'>('all');
	const [sortBy, setSortBy] = useState<'date' | 'score' | 'accuracy'>('date');

	// Get data from Redux store
	const currUser = useAppSelector((state) => state.currUser.current);
	const attempts = useAppSelector((state) => state.attempts.list);
	const exams = useAppSelector((state) => state.exams.list);
	const questions = useAppSelector((state) => state.questions.list);
	const sections = useAppSelector((state) => state.sections.list);

	// Filter attempts by current user
	const userAttempts = attempts.filter((attempt) => attempt.userId === currUser?.id);

	// Helper function to get all child sections recursively
	const getAllChildSections = (parentId: string): typeof sections => {
		const directChildren = sections.filter((s) => s.parentId === parentId);
		const all = [...directChildren];
		for (const child of directChildren) {
			all.push(...getAllChildSections(child.id));
		}
		return all;
	};

	// Enrich attempts with exam data
	const attemptsWithExam = userAttempts
		.map((attempt) => {
			const exam = exams.find((e) => e.id === attempt.examId);
			if (!exam) return null;

			// Calculate time spent (in minutes)
			const duration = exam.duration; // in minutes
			const timeSpent = Math.max(0, duration - Math.floor(attempt.timeLeft / 60));

			// Calculate total questions for this exam
			const examSections = sections.filter((s) => s.parentId === exam.id);
			const allSectionIds = [
				...examSections.map((s) => s.id),
				...examSections.flatMap((s) => getAllChildSections(s.id).map((cs) => cs.id)),
			];
			const totalQuestions = questions.filter((q) => allSectionIds.includes(q.sectionId)).length;

			// Calculate accuracy from score (score is out of 100, convert to percentage)
			const accuracy = attempt.score !== undefined ? Math.round(attempt.score) : 0;

			// Calculate completed time
			const completedAt = new Date(attempt.startTime + duration * 60 * 1000 - attempt.timeLeft * 1000);

			return {
				attempt,
				exam,
				timeSpent,
				accuracy,
				completedAt,
				totalQuestions,
			};
		})
		.filter(Boolean) as Array<{
		attempt: Attempt;
		exam: Exam;
		timeSpent: number;
		accuracy: number;
		completedAt: Date;
		totalQuestions: number;
	}>;

	const formatDate = (date: Date | number) => {
		const dateObj = typeof date === 'number' ? new Date(date) : date;
		return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
	};

	const skillIcons: Record<Skill, React.ElementType> = {
		reading: BookOpen,
		listening: Headphones,
		writing: PenTool,
		speaking: Mic,
	};

	const getSkillIcon = (skill: Skill) => {
		const Icon = skillIcons[skill];
		return <Icon className='h-4 w-4' />;
	};

	const filteredHistory = attemptsWithExam.filter(
		(item) =>
			(filterTestType === 'all' || item.exam.testType === filterTestType) &&
			(filterSkill === 'all' || item.exam.skill === filterSkill)
	);

	const sortedHistory = [...filteredHistory].sort((a, b) => {
		if (sortBy === 'date') return b.completedAt.getTime() - a.completedAt.getTime();
		if (sortBy === 'score') return (b.attempt.score || 0) - (a.attempt.score || 0);
		if (sortBy === 'accuracy') return b.accuracy - a.accuracy;
		return 0;
	});

	const goals = useAppSelector((state) => state.goals.list);
	const userGoals = goals.filter((goal) => goal.userId === currUser?.id);

	// Calculate statistics from attempts
	const calculateSkillStats = () => {
		const skillStats: Record<Skill, { averageScore: number; totalAttempts: number; scores: number[] }> = {
			[Skill.Reading]: { averageScore: 0, totalAttempts: 0, scores: [] },
			[Skill.Listening]: { averageScore: 0, totalAttempts: 0, scores: [] },
			[Skill.Writing]: { averageScore: 0, totalAttempts: 0, scores: [] },
			[Skill.Speaking]: { averageScore: 0, totalAttempts: 0, scores: [] },
		};

		attemptsWithExam.forEach((item) => {
			if (item.attempt.score !== undefined) {
				const skill = item.exam.skill;
				skillStats[skill].scores.push(item.attempt.score);
				skillStats[skill].totalAttempts++;
			}
		});

		// Calculate averages
		Object.keys(skillStats).forEach((skill) => {
			const stats = skillStats[skill as Skill];
			if (stats.scores.length > 0) {
				stats.averageScore = Math.round((stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length) * 10) / 10;
			}
		});

		return skillStats;
	};

	const calculateTestTypeStats = () => {
		const testTypeStats: Record<TestType, { averageScore: number; totalAttempts: number; scores: number[] }> = {
			[TestType.IELTS]: { averageScore: 0, totalAttempts: 0, scores: [] },
			[TestType.TOEIC]: { averageScore: 0, totalAttempts: 0, scores: [] },
		};

		attemptsWithExam.forEach((item) => {
			if (item.attempt.score !== undefined) {
				const testType = item.exam.testType;
				testTypeStats[testType].scores.push(item.attempt.score);
				testTypeStats[testType].totalAttempts++;
			}
		});

		// Calculate averages
		Object.keys(testTypeStats).forEach((testType) => {
			const stats = testTypeStats[testType as TestType];
			if (stats.scores.length > 0) {
				stats.averageScore = Math.round((stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length) * 10) / 10;
			}
		});

		return testTypeStats;
	};

	const skillStats = calculateSkillStats();
	const testTypeStats = calculateTestTypeStats();

	// Get goal for comparison
	const getGoalForTestType = (testType: TestType) => {
		return userGoals.find((goal) => goal.testType === testType);
	};

	// Calculate progress percentage for goals
	const getGoalProgress = (testType: TestType) => {
		const goal = getGoalForTestType(testType);
		if (!goal) return null;
		const currentAvg = testTypeStats[testType].averageScore;
		if (currentAvg === 0) return 0;
		// For IELTS: goal is typically 0-9, score is 0-100, so convert
		// For TOEIC: goal is typically 0-990, score is 0-100, so convert
		if (testType === TestType.IELTS) {
			// Convert score (0-100) to IELTS band (0-9)
			const ieltsBand = (currentAvg / 100) * 9;
			return Math.min(100, Math.round((ieltsBand / goal.target) * 100));
		} else {
			// Convert score (0-100) to TOEIC score (0-990)
			const toeicScore = (currentAvg / 100) * 990;
			return Math.min(100, Math.round((toeicScore / goal.target) * 100));
		}
	};

	return (
		<div className='space-y-6 bg-gray-50 min-h-screen p-6'>
			{/* Header */}
			<div className='bg-white rounded-lg shadow-sm p-6'>
				<div className='flex items-center space-x-4'>
					<Avatar className='h-20 w-20'>
						<AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currUser?.fullName || 'User'}`} />
						<AvatarFallback className='bg-red-500 text-white text-2xl'>
							{(currUser?.fullName || 'User')
								.split(' ')
								.map((n) => n[0])
								.join('')
								.slice(0, 2)
								.toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className='flex-1'>
						<h1 className='text-2xl font-bold'>{currUser?.fullName || 'Người dùng'}</h1>
						<p className='text-gray-600 flex items-center gap-2 text-sm'>
							<Mail className='h-4 w-4' />
							{currUser?.email || 'Chưa có email'}
						</p>
						{currUser?.createdAt && (
							<p className='text-sm text-gray-500 flex items-center gap-2 mt-1'>
								<Calendar className='h-4 w-4' />
								Tham gia từ {formatDate(currUser.createdAt)}
							</p>
						)}
					</div>
					<div className='flex space-x-2'>
						<Button variant='outline' size='sm'>
							<Edit className='h-4 w-4 mr-2' />
							Chỉnh sửa hồ sơ
						</Button>
						<Button variant='outline' size='sm'>
							<Settings className='h-4 w-4 mr-2' />
							Cài đặt
						</Button>
						<Button variant='outline' size='sm'>
							<BarChart3 className='h-4 w-4 mr-2' />
							Phân tích điểm yếu
						</Button>
					</div>
				</div>
			</div>

			{/* Goals Section */}
			<div className='bg-white rounded-lg shadow-sm p-6'>
				<div className='flex items-center justify-between mb-4'>
					<h2 className='text-xl font-semibold'>Mục tiêu bản thân</h2>
					<AddGoalButton />
				</div>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
					{userGoals.map((goal) => (
						<Card key={goal.id} className='border-gray-200'>
							<CardHeader className='pb-3'>
								<div className='flex items-center justify-between'>
									<div className='space-y-1'>
										<p className='text-sm text-gray-500 flex items-center gap-1'>
											<Target className='h-4 w-4' />
											Ngày dự thi {formatDate(goal.dueDate)}
										</p>
										<p className='text-base font-medium'>Mục tiêu điểm {goal.testType?.toUpperCase()}</p>
									</div>
									<EditGoalButton goal={goal} />
								</div>
							</CardHeader>
							<CardContent>
								<p className='text-3xl font-bold'>{goal.target}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'achievements' | 'history')}>
				<TabsList className='grid w-full grid-cols-2 bg-white'>
					<TabsTrigger value='overview' className='data-[state=active]:bg-black data-[state=active]:text-white'>
						Tổng quan
					</TabsTrigger>
					<TabsTrigger value='history' className='data-[state=active]:bg-black data-[state=active]:text-white'>
						Lịch sử
					</TabsTrigger>
				</TabsList>

				{/* Overview */}
				<TabsContent value='overview'>
					<div className='space-y-6'>
						{/* Test Type Statistics with Goals */}
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							{Object.values(TestType).map((testType) => {
								const stats = testTypeStats[testType];
								const goal = getGoalForTestType(testType);
								const progress = getGoalProgress(testType);
								const hasAttempts = stats.totalAttempts > 0;

								// Convert score to appropriate scale
								const displayScore =
									testType === TestType.IELTS
										? hasAttempts
											? Math.round((stats.averageScore / 100) * 9 * 10) / 10
											: 0
										: hasAttempts
										? Math.round((stats.averageScore / 100) * 990)
										: 0;

								const maxScore = testType === TestType.IELTS ? 9 : 990;

								return (
									<Card key={testType}>
										<CardHeader>
											<CardTitle className='flex items-center justify-between'>
												<span>{testType.toUpperCase()} - Tổng quan</span>
												{goal && (
													<Badge variant={progress && progress >= 100 ? 'default' : 'secondary'}>
														Mục tiêu: {goal.target}
													</Badge>
												)}
											</CardTitle>
										</CardHeader>
										<CardContent className='space-y-4'>
											<div className='space-y-2'>
												<div className='flex justify-between items-center'>
													<span className='text-sm text-muted-foreground'>Điểm trung bình</span>
													<span className='text-2xl font-bold'>
														{hasAttempts ? displayScore : '--'} / {maxScore}
													</span>
												</div>
												{hasAttempts && (
													<Progress value={(displayScore / maxScore) * 100} className='h-3 [&>div]:bg-black' />
												)}
											</div>

											{goal && (
												<div className='space-y-2 pt-2 border-t'>
													<div className='flex justify-between items-center'>
														<span className='text-sm text-muted-foreground'>Tiến độ mục tiêu</span>
														<span className='text-lg font-semibold'>{progress !== null ? `${progress}%` : '0%'}</span>
													</div>
													<Progress
														value={progress !== null ? progress : 0}
														className='h-3 [&>div]:bg-black'
													/>
													{progress !== null && progress < 100 && (
														<p className='text-xs text-muted-foreground'>
															Còn {goal.target - displayScore} điểm để đạt mục tiêu
														</p>
													)}
													{progress !== null && progress >= 100 && (
														<p className='text-xs text-green-600 font-medium'>🎉 Đã đạt mục tiêu!</p>
													)}
												</div>
											)}

											<div className='flex items-center justify-between text-sm pt-2 border-t'>
												<span className='text-muted-foreground'>Số bài đã làm</span>
												<span className='font-semibold'>{stats.totalAttempts} bài</span>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>

						{/* Skill Statistics */}
						<Card>
							<CardHeader>
								<CardTitle>Điểm trung bình theo kỹ năng</CardTitle>
								<CardDescription>Thống kê điểm số của bạn theo từng kỹ năng</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									{Object.entries(skillStats).map(([skill, stats]) => {
										const skillKey = skill as Skill;
										const Icon = skillIcons[skillKey];
										const hasAttempts = stats.totalAttempts > 0;
										const averageScore = hasAttempts ? Math.round(stats.averageScore) : 0;

										// Get average score in IELTS band scale (0-9) for display
										const displayScore = hasAttempts ? Math.round((averageScore / 100) * 9 * 10) / 10 : 0;

										return (
											<div key={skill} className='space-y-2'>
												<div className='flex items-center justify-between'>
													<div className='flex items-center space-x-2'>
														<Icon className='h-5 w-5 text-primary' />
														<span className='font-medium capitalize'>{skill}</span>
														{hasAttempts && (
															<Badge variant='outline' className='text-xs'>
																{stats.totalAttempts} bài
															</Badge>
														)}
													</div>
													<div className='flex items-center space-x-4'>
														{hasAttempts ? (
															<>
																<span className='text-lg font-semibold'>{displayScore} / 9.0</span>
																<span className='text-sm text-muted-foreground'>({averageScore}%)</span>
															</>
														) : (
															<span className='text-sm text-muted-foreground'>Chưa có dữ liệu</span>
														)}
													</div>
												</div>
												{hasAttempts && <Progress value={(displayScore / 9) * 100} className='h-2 [&>div]:bg-black' />}
												{!hasAttempts && (
													<div className='h-2 bg-muted rounded-full'>
														<div className='h-full w-0 bg-primary rounded-full' />
													</div>
												)}
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>

						{/* Overall Statistics */}
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<Card>
								<CardContent className='p-6'>
									<div className='flex items-center space-x-2'>
										<BookOpen className='h-5 w-5 text-primary' />
										<div>
											<p className='text-sm text-muted-foreground'>Tổng số bài đã làm</p>
											<p className='text-2xl font-semibold'>{attemptsWithExam.length}</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className='p-6'>
									<div className='flex items-center space-x-2'>
										<TrendingUp className='h-5 w-5 text-green-600' />
										<div>
											<p className='text-sm text-muted-foreground'>Điểm trung bình tổng</p>
											<p className='text-2xl font-semibold'>
												{attemptsWithExam.length > 0
													? Math.round(
															(attemptsWithExam
																.filter((item) => item.attempt.score !== undefined)
																.reduce((sum, item) => sum + (item.attempt.score || 0), 0) /
																attemptsWithExam.filter((item) => item.attempt.score !== undefined).length) *
																10
													  ) / 10
													: '--'}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className='p-6'>
									<div className='flex items-center space-x-2'>
										<Target className='h-5 w-5 text-blue-600' />
										<div>
											<p className='text-sm text-muted-foreground'>Số mục tiêu</p>
											<p className='text-2xl font-semibold'>{userGoals.length}</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>

				{/* History */}
				<TabsContent value='history' className='space-y-4 mt-6'>
					{/* Filters */}
					<Card className='border-gray-200'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2 text-lg'>
								<Filter className='h-5 w-5' />
								Bộ lọc và sắp xếp
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
								<div className='space-y-2'>
									<label className='text-sm font-medium'>Loại thi</label>
									<Select
										value={filterTestType}
										onValueChange={(value) => setFilterTestType(value as TestType | 'all')}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>Tất cả</SelectItem>
											<SelectItem value={TestType.IELTS}>IELTS</SelectItem>
											<SelectItem value={TestType.TOEIC}>TOEIC</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<label className='text-sm font-medium'>Kỹ năng</label>
									<Select value={filterSkill} onValueChange={(value) => setFilterSkill(value as Skill | 'all')}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>Tất cả</SelectItem>
											<SelectItem value={Skill.Reading}>Reading</SelectItem>
											<SelectItem value={Skill.Listening}>Listening</SelectItem>
											<SelectItem value={Skill.Writing}>Writing</SelectItem>
											<SelectItem value={Skill.Speaking}>Speaking</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<label className='text-sm font-medium'>Sắp xếp theo</label>
									<Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'score' | 'accuracy')}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='date'>Ngày làm bài</SelectItem>
											<SelectItem value='score'>Điểm số</SelectItem>
											<SelectItem value='accuracy'>Độ chính xác</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* History List */}
					<div className='bg-white rounded-lg shadow-sm'>
						<div className='p-6 border-b'>
							<h3 className='font-semibold'>Lịch sử làm đề ({sortedHistory.length} bài)</h3>
						</div>
						<div className='divide-y'>
							{sortedHistory.map((item) => (
								<div key={item.attempt.id} className='p-6 hover:bg-gray-50 transition-colors'>
									<div className='flex items-center justify-between gap-4'>
										<div className='flex items-center gap-4 flex-1'>
											<Badge
												variant='outline'
												className={`${
													item.exam.testType === TestType.IELTS
														? 'border-blue-500 text-blue-700 bg-blue-50'
														: 'border-orange-500 text-orange-700 bg-orange-50'
												} font-semibold`}
											>
												{item.exam.testType.toUpperCase()}
											</Badge>
											<div className='flex items-center gap-2'>
												{getSkillIcon(item.exam.skill)}
												<span className='font-medium capitalize'>{item.exam.skill}</span>
											</div>
											<div className='flex-1'>
												<p className='font-medium text-gray-900'>{item.exam.title}</p>
												<p className='text-sm text-gray-500'>{item.exam.description}</p>
											</div>
										</div>

										<div className='flex items-center gap-8'>
											<div className='text-center'>
												<p className='text-sm text-gray-500'>Điểm số</p>
												<p
													className={`text-lg font-bold ${
														item.attempt.score !== undefined && item.attempt.score >= 70
															? 'text-green-600'
															: item.attempt.score !== undefined && item.attempt.score >= 50
															? 'text-yellow-600'
															: 'text-red-600'
													}`}
												>
													{item.attempt.score !== undefined ? Math.round(item.attempt.score) : '--'}
												</p>
											</div>

											<div className='text-center'>
												<p className='text-sm text-gray-500'>Độ chính xác</p>
												<p className='text-lg font-bold'>{item.accuracy}%</p>
											</div>

											<div className='text-center'>
												<p className='text-sm text-gray-500'>Thời gian</p>
												<p className='text-lg font-bold'>{item.timeSpent} phút</p>
											</div>

											<div className='text-center'>
												<p className='text-sm text-gray-500'>Ngày làm</p>
												<p className='text-lg font-bold'>{formatDate(item.completedAt)}</p>
											</div>

											<Button
												variant='outline'
												size='sm'
												onClick={() => router.push(`/results/${item.attempt.id}`)}
											>
												Xem chi tiết
											</Button>
										</div>
									</div>
								</div>
							))}

							{sortedHistory.length === 0 && (
								<div className='text-center py-12'>
									<p className='text-gray-500'>Không tìm thấy bài kiểm tra nào phù hợp với bộ lọc.</p>
								</div>
							)}
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
