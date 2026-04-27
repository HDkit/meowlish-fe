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
	CheckSquare,
	Lock,
} from 'lucide-react';
import { EditGoalButton } from './EditGoalBtn';
import { AddGoalButton } from './AddGoalBtn';
import { useAppSelector } from './store/main/hook';
import { Attempt, Exam, Skill, TestType } from '../types/client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ExamPracticeService, AchievementsService } from '@/lib/api-client';

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
	const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'history'>('overview');
	const [filterTestType, setFilterTestType] = useState<TestType | 'all'>('all');
	const [filterSkill, setFilterSkill] = useState<Skill | 'all'>('all');
	const [sortBy, setSortBy] = useState<'date' | 'score' | 'accuracy'>('date');

	// State for badges and streak
	const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
	const [calendarHistory, setCalendarHistory] = useState<Record<string, number>>({});
	const [streak, setStreak] = useState(0);

	// Get data from Redux store
	const currUser = useAppSelector((state) => state.currUser.current);

	useEffect(() => {
		if (currUser) {
			const fetchProfileData = async () => {
				try {
					const badgesRes = await AchievementsService.achievementGatewayControllerGetMyBadgesV1(undefined, 100);
					if (badgesRes.data?.badges) {
						setEarnedBadges(badgesRes.data.badges);
					}

					const end = new Date();
					const start = new Date();
					start.setDate(end.getDate() - 365); // Get data for the Heatmap (1 year)

					const summaryRes = await ExamPracticeService.examPracticeGatewayControllerGetUsersAttemptSummaryV1({
						from: start.toISOString(),
						to: end.toISOString()
					});

					if (summaryRes.data?.history) {
						const historyObj = summaryRes.data.history;
						setCalendarHistory(historyObj);

						// Calculate streak
						let currentStreak = 0;
						let d = new Date();
						d.setHours(0, 0, 0, 0);

						while(true) {
							const tzoffset = d.getTimezoneOffset() * 60000;
							const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 10);
							
							if (historyObj[localISOTime] && historyObj[localISOTime] > 0) {
								currentStreak++;
								d.setDate(d.getDate() - 1);
							} else {
								const todayOffset = new Date().getTimezoneOffset() * 60000;
								const todayStr = (new Date(Date.now() - todayOffset)).toISOString().slice(0, 10);
								if (localISOTime === todayStr) {
									d.setDate(d.getDate() - 1);
									continue;
								}
								break;
							}
						}
						setStreak(currentStreak);
					}
				} catch (e) {
					console.error("Failed to load profile enhancements:", e);
				}
			};
			fetchProfileData();
		}
	}, [currUser]);
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

	// Radar Chart Data
	const radarData = [
		{ subject: 'Listening', score: skillStats[Skill.Listening].averageScore || 0, fullMark: 100 },
		{ subject: 'Reading', score: skillStats[Skill.Reading].averageScore || 0, fullMark: 100 },
		{ subject: 'Writing', score: skillStats[Skill.Writing].averageScore || 0, fullMark: 100 },
		{ subject: 'Speaking', score: skillStats[Skill.Speaking].averageScore || 0, fullMark: 100 },
	];

	// Login Streak Current Week Data
	const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
	const currentWeekChecks = [...Array(7)].map((_, i) => {
		const curr = new Date();
		const first = curr.getDate() - curr.getDay(); // Sunday
		const dayDate = new Date();
		dayDate.setDate(first + i);
		const tzoffset = dayDate.getTimezoneOffset() * 60000;
		const localISOTime = (new Date(dayDate.getTime() - tzoffset)).toISOString().slice(0, 10);
		
		// If the day is in the future, it should not be "missed", just unchecked visually differently
		const isFuture = dayDate.getTime() > new Date().setHours(23, 59, 59, 999);
		return { 
			label: daysOfWeek[i], 
			checked: !!(calendarHistory[localISOTime] && calendarHistory[localISOTime] > 0),
			isFuture
		};
	});

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 pb-20'>
			{/* ── Profile Hero Header ── */}
			<div className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary text-white shadow-xl mb-8">
				<div className="absolute inset-0 bg-black/10" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

				<div className="relative px-6 py-12 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
					<Avatar className='h-32 w-32 border-4 border-white/30 shadow-2xl'>
						<AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currUser?.fullName || 'User'}`} />
						<AvatarFallback className='bg-gradient-to-br from-red-500 to-pink-500 text-white text-4xl font-bold'>
							{(currUser?.fullName || 'User')
								.split(' ')
								.map((n) => n[0])
								.join('')
								.slice(0, 2)
								.toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className='flex-1 text-center md:text-left'>
						<h1 className='text-4xl font-extrabold mb-2 text-white drop-shadow-md'>{currUser?.fullName || 'Người dùng'}</h1>
						<div className='flex flex-col md:flex-row items-center gap-4 text-primary-foreground/80 font-medium'>
							<p className='flex items-center gap-2'>
								<Mail className='h-5 w-5' />
								{currUser?.email || 'Chưa có email'}
							</p>
							<span className="hidden md:block text-primary-foreground/60">•</span>
							{currUser?.createdAt && (
								<p className='flex items-center gap-2'>
									<Calendar className='h-5 w-5' />
									Thành viên từ {formatDate(currUser.createdAt)}
								</p>
							)}
						</div>
					</div>
					<div className='flex flex-wrap justify-center md:flex-col gap-3'>
						<Button className='bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md shadow-sm w-full md:w-auto justify-start'>
							<Edit className='h-4 w-4 mr-2' /> Cập nhật hồ sơ
						</Button>
						<Button className='bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md shadow-sm w-full md:w-auto justify-start'>
							<BarChart3 className='h-4 w-4 mr-2' /> Phân tích học tập
						</Button>
						<Button className='bg-white/10 hover:bg-white/20 text-blue-100 border-0 backdrop-blur-md w-full md:w-auto justify-start'>
							<Settings className='h-4 w-4 mr-2' /> Cài đặt tài khoản
						</Button>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 md:px-6 space-y-8'>

				{/* Goals Section */}
				<div className='bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-6'>
					<div className='flex items-center justify-between mb-6 border-b border-gray-100 pb-4'>
						<h2 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
							<Target className="h-6 w-6 text-primary" /> Mục tiêu của bạn
						</h2>
						<AddGoalButton />
					</div>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						{userGoals.map((goal) => (
							<Card key={goal.id} className='border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all rounded-xl bg-gradient-to-br from-white to-primary/5'>
								<CardHeader className='pb-3 bg-primary/5 rounded-t-xl'>
									<div className='flex items-center justify-between'>
										<div className='space-y-1'>
											<p className='text-sm text-primary font-semibold flex items-center gap-1.5'>
												<Calendar className='h-4 w-4' />
												{formatDate(goal.dueDate)}
											</p>
											<p className='text-base font-bold text-gray-800'>Điểm {goal.testType?.toUpperCase()} mục tiêu</p>
										</div>
										<EditGoalButton goal={goal} />
									</div>
								</CardHeader>
								<CardContent className="pt-4 pb-6">
									<p className='text-5xl font-extrabold text-primary drop-shadow-sm'>{goal.target}</p>
								</CardContent>
							</Card>
						))}
						{userGoals.length === 0 && (
							<div className="col-span-full py-8 text-center text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
								<p>Bạn chưa thiết lập mục tiêu nào. Hãy đặt ra mục tiêu để có động lực học tập nhé!</p>
							</div>
						)}
					</div>
				</div>

				{/* Tabs */}
				<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'achievements' | 'history')} className="mt-8">
					<div className="flex justify-center mb-6">
						<TabsList className='bg-white/90 backdrop-blur-xl p-2 rounded-full shadow-lg border border-gray-100/50 w-fit inline-flex'>
							<TabsTrigger value='overview' className='rounded-full px-8 py-2.5 text-base font-semibold text-gray-500 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all'>
								<TrendingUp className="h-4 w-4 mr-2 inline" /> Thống kê & Tổng quan
							</TabsTrigger>
							<TabsTrigger value='achievements' className='rounded-full px-8 py-2.5 text-base font-semibold text-gray-500 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all'>
								<Award className="h-4 w-4 mr-2 inline" /> Danh hiệu ({earnedBadges.length})
							</TabsTrigger>
							<TabsTrigger value='history' className='rounded-full px-8 py-2.5 text-base font-semibold text-gray-500 data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:shadow-md transition-all'>
								<Edit className="h-4 w-4 mr-2 inline" /> Lịch sử luyện tập
							</TabsTrigger>
						</TabsList>
					</div>

					{/* Overview */}
					<TabsContent value='overview'>
						<div className='space-y-6'>
							{/* Analytics Top Row (Radar & Streak) */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Activity Overview Radar */}
								<Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-lg transition-all">
									<CardHeader className="bg-slate-50 border-b border-gray-100 flex flex-row items-center justify-between">
										<CardTitle className="text-xl font-bold text-gray-800">Cân bằng kỹ năng</CardTitle>
									</CardHeader>
									<CardContent className="pt-6 h-[300px] flex items-center justify-center">
										<ResponsiveContainer width="100%" height="100%">
											<RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
												<PolarGrid strokeDasharray="3 3" />
												<PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} />
												<PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
												<Radar name="Kỹ năng" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
												<RechartsTooltip formatter={(value) => [`${value}%`, 'Tỷ lệ']} />
											</RadarChart>
										</ResponsiveContainer>
									</CardContent>
								</Card>

								{/* Login Streak */}
								<Card className="border-0 shadow-md bg-slate-900 text-white rounded-xl overflow-hidden hover:shadow-lg transition-all">
									<CardHeader className="border-b border-white/10">
										<CardTitle className="text-xl font-bold">Chuỗi học tập (Streak)</CardTitle>
									</CardHeader>
									<CardContent className="pt-10 pb-8 flex flex-col items-center justify-center">
										<div className="relative flex justify-center items-center w-24 h-24 bg-rose-500 rounded-[35%_65%_60%_40%_/_45%_55%_45%_55%] animate-[pulse_3s_ease-in-out_infinite] mb-6 shadow-[0_0_20px_rgba(244,63,94,0.5)]">
											<Flame className="w-12 h-12 text-white fill-current absolute drop-shadow-md" />
										</div>
										<h2 className="text-4xl font-extrabold mb-8">{streak} Day Streak</h2>
										
										{/* Week Checkboxes */}
										<div className="w-full max-w-sm flex justify-between items-center px-4">
											{currentWeekChecks.map((day, idx) => (
												<div key={idx} className="flex flex-col items-center gap-2">
													<div className="text-xs font-bold text-white/70 uppercase">{day.label}</div>
													{day.checked ? (
														<div className="w-8 h-8 rounded-md bg-[#81b64c] flex items-center justify-center border border-[#6f9e42] shadow-[0_2px_0_#6f9e42]">
															<CheckSquare className="w-5 h-5 text-white" />
														</div>
													) : day.isFuture ? (
														<div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center border border-white/5" />
													) : (
														<div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center border border-white/10" />
													)}
												</div>
											))}
										</div>

										<p className="text-sm text-white/50 mt-8 font-medium">Bạn đã học rất tốt! Trở lại vào ngày mai để tiếp tục chuỗi nhé.</p>
									</CardContent>
								</Card>
							</div>

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
										<Card key={testType} className='border-0 shadow-md bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-lg transition-all'>
											<CardHeader className='bg-slate-50 border-b border-gray-100'>
												<CardTitle className='flex items-center justify-between text-lg'>
													<span className='font-bold text-gray-800'>{testType.toUpperCase()} - Tổng quan</span>
													{goal && (
														<Badge variant={progress && progress >= 100 ? 'default' : 'secondary'} className='ml-2 shadow-sm'>
															Mục tiêu: {goal.target}
														</Badge>
													)}
												</CardTitle>
											</CardHeader>
											<CardContent className='space-y-5 pt-6'>
												<div className='space-y-3'>
													<div className='flex justify-between items-center'>
														<span className='font-medium text-slate-500'>Điểm trung bình</span>
														<span className='text-3xl font-extrabold text-primary'>
															{hasAttempts ? displayScore : '--'} <span className="text-xl text-gray-400 font-medium">/ {maxScore}</span>
														</span>
													</div>
													{hasAttempts && (
														<Progress value={(displayScore / maxScore) * 100} className='h-2.5 [&>div]:bg-primary' />
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
							<Card className='border-0 shadow-md bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden'>
								<CardHeader className='bg-slate-50 border-b border-gray-100'>
									<CardTitle className="text-xl font-bold text-gray-800">Điểm trung bình theo kỹ năng</CardTitle>
									<CardDescription>Tiến độ học tập và biểu đồ điểm số ở từng nhóm kỹ năng</CardDescription>
								</CardHeader>
								<CardContent className="pt-6">
									<div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
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
													{hasAttempts && <Progress value={(displayScore / 9) * 100} className='h-2.5 [&>div]:bg-primary' />}
													{!hasAttempts && (
														<div className='h-2.5 bg-gray-100 rounded-full w-full' />
													)}
												</div>
											);
										})}
									</div>
								</CardContent>
							</Card>

							{/* Overall Statistics */}
							<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
								<Card className='border-0 shadow-md hover:shadow-lg transition-all rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-white'>
									<CardContent className='p-6 relative'>
										<BookOpen className='absolute right-[-20px] bottom-[-20px] h-32 w-32 text-white/10' />
										<div className='flex items-center justify-between mb-4 relative z-10'>
											<BookOpen className='h-8 w-8 text-primary-foreground/80' />
											<span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Tổng quát</span>
										</div>
										<div className='relative z-10'>
											<p className='text-3xl font-extrabold mb-1'>{attemptsWithExam.length}</p>
											<p className='text-sm text-primary-foreground/80 font-medium'>Số bài kiểm tra đã làm</p>
										</div>
									</CardContent>
								</Card>

								<Card className='border-0 shadow-md hover:shadow-lg transition-all rounded-xl overflow-hidden bg-gradient-to-br from-primary/80 to-secondary text-white'>
									<CardContent className='p-6 relative'>
										<TrendingUp className='absolute right-[-20px] bottom-[-20px] h-32 w-32 text-white/10' />
										<div className='flex items-center justify-between mb-4 relative z-10'>
											<TrendingUp className='h-8 w-8 text-primary-foreground/80' />
											<span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Hiệu suất</span>
										</div>
										<div className='relative z-10'>
											<p className='text-3xl font-extrabold mb-1'>
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
											<p className='text-sm text-primary-foreground/80 font-medium'>Điểm trung bình toàn khoá</p>
										</div>
									</CardContent>
								</Card>

								<Card className='border-0 shadow-md hover:shadow-lg transition-all rounded-xl overflow-hidden bg-gradient-to-br from-secondary to-secondary/80 text-white'>
									<CardContent className='p-6 relative'>
										<Target className='absolute right-[-20px] bottom-[-20px] h-32 w-32 text-white/10' />
										<div className='flex items-center justify-between mb-4 relative z-10'>
											<Target className='h-8 w-8 text-secondary-foreground' />
											<span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Mục tiêu</span>
										</div>
										<div className='relative z-10'>
											<p className='text-3xl font-extrabold mb-1'>{userGoals.length}</p>
											<p className='text-sm text-secondary-foreground font-medium'>Số mục tiêu học tập đang chạy</p>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</TabsContent>

					{/* History */}
					<TabsContent value='history' className='space-y-6 mt-6'>
						{/* Filters */}
						<Card className='border-0 shadow-md bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden'>
							<CardHeader className="bg-slate-50 border-b border-gray-100">
								<CardTitle className='flex items-center gap-2 text-lg text-gray-800'>
									<Filter className='h-5 w-5 text-primary' />
									Bộ lọc & Tuỳ chỉnh hiển thị
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-6">
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
						<div className='border-0 shadow-md bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden'>
							<div className='p-6 border-b bg-slate-50'>
								<h3 className='font-bold text-gray-800 text-lg flex items-center gap-2'>
									<Calendar className="w-5 h-5 text-primary" />
									Lịch sử làm bài ({sortedHistory.length})
								</h3>
							</div>
							<div className='divide-y border-t-0'>
								{sortedHistory.map((item) => (
									<div key={item.attempt.id} className='p-6 hover:bg-slate-50/80 transition-colors group'>
										<div className='flex items-center justify-between gap-4'>
											<div className='flex items-center gap-4 flex-1'>
												<Badge
													variant='outline'
													className={`${item.exam.testType === TestType.IELTS
														? 'border-primary text-primary bg-primary/10'
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
														className={`text-lg font-bold ${item.attempt.score !== undefined && item.attempt.score >= 70
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

					{/* Achievements */}
					<TabsContent value='achievements' className='space-y-6 mt-6'>
						<Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden">
							<CardHeader className="bg-slate-50 border-b border-gray-100 flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-xl font-bold text-gray-800">Kho danh hiệu của bạn</CardTitle>
									<CardDescription>Hoàn thành các mốc quan trọng để nhận danh hiệu vinh danh</CardDescription>
								</div>
								<div className="bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-lg flex items-center">
									<Trophy className="w-5 h-5 mr-2 text-emerald-600"/>
									{earnedBadges.length} Danh hiệu
								</div>
							</CardHeader>
							<CardContent className="pt-8 pb-8">
								{earnedBadges.length === 0 ? (
									<div className="text-center py-16">
										<div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
											<Lock className="w-10 h-10 text-gray-300" />
										</div>
										<h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có danh hiệu nào</h3>
										<p className="text-gray-500 mb-6">Hãy chăm chỉ luyện tập để mở khóa các danh hiệu đầu tiên nhé!</p>
										<Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => router.push('/test-selection')}>
											Luyện tập ngay
										</Button>
									</div>
								) : (
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
										{earnedBadges.map((badge: any, index: number) => {
											// Tự động generate CSS class theo tên danh hiệu để cho đẹp
											const colorClass = index % 3 === 0 ? 'from-amber-300 to-orange-500' 
															: index % 3 === 1 ? 'from-secondary to-primary/80' 
															: 'from-emerald-300 to-teal-500';
											
											return (
												<div key={badge.id || index} className="flex flex-col items-center text-center group cursor-pointer">
													<div className={`w-28 h-28 mb-4 border-4 border-white shadow-lg rounded-full flex items-center justify-center bg-gradient-to-br ${colorClass} group-hover:scale-110 transition-transform duration-300 relative`}>
														<Award className="w-12 h-12 text-white drop-shadow-sm" />
														
														{/* Sparkle effects on hover */}
														<div className="absolute -top-2 -right-2 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">✨</div>
														<div className="absolute -bottom-1 -left-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75">✨</div>
													</div>
													<h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight mb-1">{badge.displayName || badge.name}</h4>
													<p className="text-xs text-gray-500 line-clamp-2">{badge.description}</p>
													{badge.date && (
														<p className="text-[10px] text-gray-400 mt-2">Đạt được: {formatDate(new Date(badge.date))}</p>
													)}
												</div>
											);
										})}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
