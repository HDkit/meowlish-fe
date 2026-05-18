import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Mail,
	Calendar,
	Trophy,
	Target,
	TrendingUp,
	BookOpen,
	Edit,
	Award,
	BarChart3,
	Flame,
	CheckSquare,
	Lock,
	User,
	Key,
	Eye,
	EyeOff,
	Loader2,
	Clock,
	CheckCircle2,
	Circle,
} from 'lucide-react';
import { EditGoalButton } from './EditGoalBtn';
import { AddGoalButton } from './AddGoalBtn';
import { useAppSelector, useAppDispatch } from './store/main/hook';
import { useRouter } from 'next/navigation';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ExamPracticeService, AchievementsService, AuthService, GoalsService } from '@/lib/api-client';
import { setUser } from './store/currUserSlice';
import { useToast } from '@/components/ui/use-toast';
import type { GoalResDto } from '@/lib/api/models/GoalResDto';
import type { UserStatsDto } from '@/lib/api/models/UserStatsDto';
import type { MinimalAttemptInfoDto } from '@/lib/api/models/MinimalAttemptInfoDto';

function formatElapsed(startedAt: string, endedAt?: string): string {
	const start = new Date(startedAt).getTime();
	const end = endedAt ? new Date(endedAt).getTime() : Date.now();
	const diffSeconds = Math.round((end - start) / 1000);
	if (diffSeconds < 60) return `${diffSeconds}s`;
	const h = Math.floor(diffSeconds / 3600);
	const m = Math.floor((diffSeconds % 3600) / 60);
	if (h > 0) return `${h}h ${m}m`;
	return `${m} phút`;
}

function getScorePercent(attempt: MinimalAttemptInfoDto): number | null {
	if (attempt.score == null || attempt.totalPoints == null || attempt.totalPoints === 0) return null;
	return Math.round((attempt.score / attempt.totalPoints) * 100);
}

export function UserPage() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'history'>('overview');

	// API data state
	const [goal, setGoal] = useState<GoalResDto | null>(null);
	const [userStats, setUserStats] = useState<UserStatsDto | null>(null);
	const [attemptHistory, setAttemptHistory] = useState<MinimalAttemptInfoDto[]>([]);

	// State for badges and streak
	const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
	const [calendarHistory, setCalendarHistory] = useState<Record<string, number>>({});
	const [streak, setStreak] = useState(0);

	// Profile update state
	const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
	const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [profileForm, setProfileForm] = useState({
		username: '',
		fullName: '',
		bio: '',
	});
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [showPassword, setShowPassword] = useState(false);
	// Auth data from Redux
	const dispatch = useAppDispatch();
	const { toast } = useToast();
	const currUser = useAppSelector((state) => state.currUser.current);

	const fetchGoal = useCallback(async () => {
		try {
			const res = await GoalsService.goalGatewayControllerGetGoalV1();
			if (res.data) {
				setGoal(res.data as unknown as GoalResDto);
			} else {
				setGoal(null);
			}
		} catch {
			setGoal(null);
		}
	}, []);

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
					start.setDate(end.getDate() - 365);

					const summaryRes = await ExamPracticeService.examPracticeGatewayControllerGetUsersAttemptSummaryV1({
						from: start.toISOString(),
						to: end.toISOString()
					});

					if (summaryRes.data?.history) {
						const historyObj = summaryRes.data.history;
						setCalendarHistory(historyObj);

						let currentStreak = 0;
						let d = new Date();
						d.setHours(0, 0, 0, 0);

						while (true) {
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

					// Fetch user practice stats
					const statsRes = await ExamPracticeService.examPracticeGatewayControllerGetUsesStatsV1();
					if (statsRes.data) {
						setUserStats(statsRes.data as unknown as UserStatsDto);
					}

					// Fetch goal
					await fetchGoal();

					// Fetch recent attempt history
					const historyRes = await ExamPracticeService.examPracticeGatewayControllerGetUsersAttemptHistoryV1(
						undefined, undefined, 20
					);
					if (historyRes.data) {
						const data = historyRes.data as any;
						setAttemptHistory(data.attempts ?? []);
					}
				} catch (e) {
					console.error("Failed to load profile data:", e);
				}
			};
			fetchProfileData();
		}
	}, [currUser]); // eslint-disable-line react-hooks/exhaustive-deps

	// Initialize profile form when user data is available
	useEffect(() => {
		if (currUser) {
			setProfileForm({
				username: currUser.email?.split('@')[0] || '',
				fullName: currUser.fullName || '',
				bio: '',
			});
		}
	}, [currUser]);

	// Handle profile update
	const handleUpdateProfile = async () => {
		if (!currUser) return;
		setIsLoading(true);
		try {
			await AuthService.authGatewayControllerUpdateIdentityV1({
				username: profileForm.username || undefined,
				fullName: profileForm.fullName || undefined,
				bio: profileForm.bio || undefined,
			});
			dispatch(
				setUser({
					...currUser,
					fullName: profileForm.fullName || currUser.fullName,
				})
			);
			toast({ title: 'Cập nhật hồ sơ thành công' });
			setIsProfileDialogOpen(false);
		} catch (err: any) {
			console.error('Failed to update profile:', err);
			toast({
				title: 'Cập nhật thất bại',
				description: err?.body?.error || 'Không thể cập nhật hồ sơ.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Handle password change
	const handleChangePassword = async () => {
		if (!currUser) return;
		if (!passwordForm.newPassword) {
			toast({ title: 'Vui lòng nhập mật khẩu mới', variant: 'destructive' });
			return;
		}
		if (passwordForm.newPassword.length < 6) {
			toast({ title: 'Mật khẩu mới phải có ít nhất 6 ký tự', variant: 'destructive' });
			return;
		}
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast({ title: 'Mật khẩu xác nhận không khớp', variant: 'destructive' });
			return;
		}
		setIsLoading(true);
		try {
			await AuthService.authGatewayControllerUpdateMailPasswordV1({
				id: currUser.id,
				password: passwordForm.newPassword,
			});
			toast({ title: 'Đổi mật khẩu thành công' });
			setIsPasswordDialogOpen(false);
			setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
		} catch (err: any) {
			console.error('Failed to change password:', err);
			toast({
				title: 'Đổi mật khẩu thất bại',
				description: err?.body?.error || 'Không thể đổi mật khẩu.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const formatDate = (date: Date | number | string) => {
		const dateObj = typeof date === 'string' ? new Date(date) : typeof date === 'number' ? new Date(date) : date;
		return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
	};

	// Radar Chart Data from API tag stats
	const radarData = (userStats?.tagInfos ?? []).map(tag => ({
		subject: tag.name,
		score: Math.round(tag.correctPercentage),
		fullMark: 100,
	}));

	// Login Streak Current Week Data
	const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
	const currentWeekChecks = [...Array(7)].map((_, i) => {
		const curr = new Date();
		const first = curr.getDate() - curr.getDay();
		const dayDate = new Date();
		dayDate.setDate(first + i);
		const tzoffset = dayDate.getTimezoneOffset() * 60000;
		const localISOTime = (new Date(dayDate.getTime() - tzoffset)).toISOString().slice(0, 10);

		const isFuture = dayDate.getTime() > new Date().setHours(23, 59, 59, 999);
		return {
			label: daysOfWeek[i],
			checked: !!(calendarHistory[localISOTime] && calendarHistory[localISOTime] > 0),
			isFuture
		};
	});

	return (
		<div className='min-h-screen bg-background pb-20'>
			{/* ── Profile Hero Header ── */}
			<div className="relative overflow-hidden bg-primary text-white shadow-xl mb-10 pt-16 pb-20 px-4 md:px-6 lg:px-8 xl:px-10">
				<div className="absolute inset-0 bg-black/10 pointer-events-none" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

				<div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
					<Avatar className='h-32 w-32 border-4 border-white/30 shadow-2xl'>
						<AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currUser?.fullName || 'User'}`} />
						<AvatarFallback className='bg-primary text-white text-4xl font-bold'>
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
						<Button
							className='bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md shadow-sm w-full md:w-auto justify-start'
							onClick={() => setIsProfileDialogOpen(true)}
						>
							<User className='h-4 w-4 mr-2' /> Cập nhật hồ sơ
						</Button>
						<Button
							className='bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md shadow-sm w-full md:w-auto justify-start'
							onClick={() => router.push('/progress')}
						>
							<BarChart3 className='h-4 w-4 mr-2' /> Phân tích học tập
						</Button>
						<Button
							className='bg-white/10 hover:bg-white/20 text-primary-foreground/80 border-0 backdrop-blur-md w-full md:w-auto justify-start'
							onClick={() => setIsPasswordDialogOpen(true)}
						>
							<Key className='h-4 w-4 mr-2' /> Đổi mật khẩu
						</Button>

					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-8 -mt-12 relative z-10'>

				{/* Goals Section */}
				<div className='bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-6'>
					<div className='flex items-center justify-between mb-6 border-b border-gray-100 pb-4'>
						<h2 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
							<Target className="h-6 w-6 text-primary" /> Mục tiêu của bạn
						</h2>
						{!goal && <AddGoalButton onGoalUpdated={fetchGoal} />}
					</div>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						{goal ? (
							<Card className='border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all rounded-xl bg-card'>
								<CardHeader className='pb-3 bg-primary/5 rounded-t-xl'>
									<div className='flex items-center justify-between'>
										<div className='space-y-1'>
											{goal.date && (
												<p className='text-sm text-primary font-semibold flex items-center gap-1.5'>
													<Calendar className='h-4 w-4' />
													{formatDate(goal.date)}
												</p>
											)}
											<p className='text-base font-bold text-gray-800'>Điểm {goal.type?.toUpperCase()} mục tiêu</p>
										</div>
										<EditGoalButton goal={goal} onGoalUpdated={fetchGoal} />
									</div>
								</CardHeader>
								<CardContent className="pt-4 pb-6">
									<p className='text-5xl font-extrabold text-primary drop-shadow-sm'>{goal.target}</p>
								</CardContent>
							</Card>
						) : (
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
									<CardHeader className="bg-slate-50 border-b border-gray-100">
										<CardTitle className="text-xl font-bold text-gray-800">Phân tích theo chủ đề</CardTitle>
									</CardHeader>
									<CardContent className="pt-6 h-[300px] flex items-center justify-center">
										{radarData.length > 0 ? (
											<ResponsiveContainer width="100%" height="100%">
												<RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
													<PolarGrid strokeDasharray="3 3" />
													<PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} />
													<PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
													<Radar name="Tỷ lệ đúng" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
													<RechartsTooltip formatter={(value) => [`${value}%`, 'Tỷ lệ']} />
												</RadarChart>
											</ResponsiveContainer>
										) : (
											<p className="text-gray-400">Chưa có dữ liệu thống kê</p>
										)}
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

							{/* Goal Progress Card */}
							{goal && userStats && (
								<Card className='border-0 shadow-md bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-lg transition-all'>
									<CardHeader className='bg-slate-50 border-b border-gray-100'>
										<CardTitle className='flex items-center justify-between text-lg'>
											<span className='font-bold text-gray-800'>{goal.type?.toUpperCase()} - Mục tiêu</span>
											<Badge variant='secondary' className='ml-2 shadow-sm'>
												Mục tiêu: {goal.target}
											</Badge>
										</CardTitle>
									</CardHeader>
									<CardContent className='space-y-5 pt-6'>
										<div className='space-y-3'>
											<div className='flex justify-between items-center'>
												<span className='font-medium text-slate-500'>Điểm trung bình hiện tại</span>
												<span className='text-3xl font-extrabold text-primary'>
													{Math.round(userStats.averageScoreInPercentage)}%
												</span>
											</div>
											<Progress value={userStats.averageScoreInPercentage} className='h-2.5 [&>div]:bg-primary' />
										</div>
										{goal.date && (
											<div className='flex items-center justify-between text-sm pt-2 border-t'>
												<span className='text-muted-foreground'>Ngày dự thi</span>
												<span className='font-semibold'>{formatDate(goal.date)}</span>
											</div>
										)}
										<div className='flex items-center justify-between text-sm pt-2 border-t'>
											<span className='text-muted-foreground'>Số bài đã làm</span>
											<span className='font-semibold'>{userStats.attemptCounts} bài</span>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Tag/Skill Statistics */}
							{userStats && userStats.tagInfos.length > 0 && (
								<Card className='border-0 shadow-md bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden'>
									<CardHeader className='bg-slate-50 border-b border-gray-100'>
										<CardTitle className="text-xl font-bold text-gray-800">Tỷ lệ đúng theo chủ đề</CardTitle>
										<CardDescription>Phân tích chi tiết theo từng nhóm kỹ năng và chủ đề</CardDescription>
									</CardHeader>
									<CardContent className="pt-6">
										<div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
											{userStats.tagInfos.map((tag) => {
												const pct = Math.round(tag.correctPercentage);
												return (
													<div key={tag.name} className='space-y-2'>
														<div className='flex items-center justify-between'>
															<span className='font-medium capitalize'>{tag.name}</span>
															<div className='flex items-center space-x-4'>
																<span className='text-lg font-semibold'>{pct}%</span>
															</div>
														</div>
														<Progress value={pct} className='h-2.5 [&>div]:bg-primary' />
													</div>
												);
											})}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Overall Statistics */}
							<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
								<Card className='border-0 shadow-md hover:shadow-lg transition-all rounded-xl overflow-hidden bg-primary text-white'>
									<CardContent className='p-6 relative'>
										<BookOpen className='absolute right-[-20px] bottom-[-20px] h-32 w-32 text-white/10' />
										<div className='flex items-center justify-between mb-4 relative z-10'>
											<BookOpen className='h-8 w-8 text-primary-foreground/80' />
											<span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Tổng quát</span>
										</div>
										<div className='relative z-10'>
											<p className='text-3xl font-extrabold mb-1'>{userStats?.attemptCounts ?? '—'}</p>
											<p className='text-sm text-primary-foreground/80 font-medium'>Số bài kiểm tra đã làm</p>
										</div>
									</CardContent>
								</Card>

								<Card className='border-0 shadow-md hover:shadow-lg transition-all rounded-xl overflow-hidden bg-primary/80 text-white'>
									<CardContent className='p-6 relative'>
										<TrendingUp className='absolute right-[-20px] bottom-[-20px] h-32 w-32 text-white/10' />
										<div className='flex items-center justify-between mb-4 relative z-10'>
											<TrendingUp className='h-8 w-8 text-primary-foreground/80' />
											<span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Hiệu suất</span>
										</div>
										<div className='relative z-10'>
											<p className='text-3xl font-extrabold mb-1'>
												{userStats ? `${Math.round(userStats.averageScoreInPercentage * 10) / 10}%` : '—'}
											</p>
											<p className='text-sm text-primary-foreground/80 font-medium'>Điểm trung bình toàn khoá</p>
										</div>
									</CardContent>
								</Card>

								<Card className='border-0 shadow-md hover:shadow-lg transition-all rounded-xl overflow-hidden bg-secondary text-white'>
									<CardContent className='p-6 relative'>
										<Target className='absolute right-[-20px] bottom-[-20px] h-32 w-32 text-white/10' />
										<div className='flex items-center justify-between mb-4 relative z-10'>
											<Target className='h-8 w-8 text-secondary-foreground' />
											<span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Mục tiêu</span>
										</div>
										<div className='relative z-10'>
											<p className='text-3xl font-extrabold mb-1'>{goal ? 1 : 0}</p>
											<p className='text-sm text-secondary-foreground font-medium'>Số mục tiêu học tập đang chạy</p>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</TabsContent>

					{/* History */}
					<TabsContent value='history' className='space-y-6 mt-6'>
						<div className='border-0 shadow-md bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden'>
							<div className='p-6 border-b bg-slate-50'>
								<h3 className='font-bold text-gray-800 text-lg flex items-center gap-2'>
									<Calendar className="w-5 h-5 text-primary" />
									Lịch sử làm bài gần đây ({attemptHistory.length})
								</h3>
							</div>
							<div className='divide-y border-t-0'>
								{attemptHistory.map((attempt) => {
									const isPending = !attempt.endedAt;
									const scorePct = getScorePercent(attempt);

									return (
										<div key={attempt.id} className='p-4 hover:bg-muted/50 transition-colors'>
											<div className='mb-3'>
												<h3 className='text-base font-semibold text-foreground leading-tight'>
													{attempt.examName || 'Đề thi không có tên'}
												</h3>
											</div>

											<div className='flex items-center justify-between flex-wrap gap-3'>
												{/* Left: status + dates */}
												<div className='flex items-center gap-3 flex-wrap'>
													{isPending ? (
														<span className='flex items-center gap-1.5 text-amber-600 text-sm font-medium'>
															<Circle className='h-4 w-4' />
															Đang làm
														</span>
													) : (
														<span className='flex items-center gap-1.5 text-green-600 text-sm font-medium'>
															<CheckCircle2 className='h-4 w-4' />
															Hoàn thành
														</span>
													)}

													<div className='text-sm text-muted-foreground flex items-center gap-1'>
														<Calendar className='h-3.5 w-3.5' />
														{formatDate(attempt.startedAt)}
													</div>

													{attempt.isStrict && (
														<span className='text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200'>
															Strict
														</span>
													)}
												</div>

												{/* Right: score, duration, actions */}
												<div className='flex items-center gap-5 flex-wrap'>
													{!isPending && scorePct != null && (
														<div className='text-right'>
															<p className='text-xs text-muted-foreground'>Điểm</p>
															<span className={`font-semibold ${scorePct >= 80 ? 'text-green-600' : scorePct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
																{scorePct}%
															</span>
														</div>
													)}

													{!isPending && attempt.score != null && attempt.totalPoints != null && (
														<div className='text-right'>
															<p className='text-xs text-muted-foreground'>Thô</p>
															<span className='font-medium text-sm'>
																{attempt.score}/{attempt.totalPoints}
															</span>
														</div>
													)}

													<div className='text-right'>
														<p className='text-xs text-muted-foreground'>Thời gian</p>
														<span className='font-medium text-sm flex items-center gap-1'>
															<Clock className='h-3.5 w-3.5 text-muted-foreground' />
															{attempt.endedAt
																? formatElapsed(attempt.startedAt, attempt.endedAt)
																: `${Math.floor(attempt.durationLimit / 60)} phút`}
														</span>
													</div>

													<Button
														variant='outline'
														size='sm'
														onClick={() => router.push(`/results/${attempt.id}`)}
													>
														Xem chi tiết
													</Button>
												</div>
											</div>
										</div>
									);
								})}

								{attemptHistory.length === 0 && (
									<div className='text-center py-12'>
										<Calendar className='h-12 w-12 mx-auto mb-3 opacity-30' />
										<p className='text-gray-500'>Bạn chưa có bài kiểm tra nào.</p>
									</div>
								)}
							</div>

							{attemptHistory.length > 0 && (
								<div className='p-4 border-t text-center'>
									<Button variant='outline' onClick={() => router.push('/history')}>
										Xem toàn bộ lịch sử
									</Button>
								</div>
							)}
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
											const colorClass = index % 3 === 0 ? 'bg-amber-400'
															: index % 3 === 1 ? 'bg-secondary'
															: 'bg-emerald-500';

											return (
												<div key={badge.id || index} className="flex flex-col items-center text-center group cursor-pointer">
													<div className={`w-28 h-28 mb-4 border-4 border-white shadow-lg rounded-full flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform duration-300 relative`}>
														<Award className="w-12 h-12 text-white drop-shadow-sm" />
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

			{/* Profile Update Dialog */}
			<Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<User className='h-5 w-5' />
							Cập nhật hồ sơ
						</DialogTitle>
						<DialogDescription>
							Cập nhật thông tin cá nhân của bạn
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='username'>Tên đăng nhập</Label>
							<Input
								id='username'
								value={profileForm.username}
								onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
								placeholder='Nhập tên đăng nhập'
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='fullName'>Họ và tên</Label>
							<Input
								id='fullName'
								value={profileForm.fullName}
								onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
								placeholder='Nhập họ và tên'
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='bio'>Giới thiệu</Label>
							<Input
								id='bio'
								value={profileForm.bio}
								onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
								placeholder='Mô tả về bản thân'
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setIsProfileDialogOpen(false)} disabled={isLoading}>
							Hủy
						</Button>
						<Button onClick={handleUpdateProfile} disabled={isLoading}>
							{isLoading ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : null}
							Lưu thay đổi
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Password Change Dialog */}
			<Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<Key className='h-5 w-5' />
							Đổi mật khẩu
						</DialogTitle>
						<DialogDescription>
							Cập nhật mật khẩu mới cho tài khoản của bạn
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='newPassword'>Mật khẩu mới</Label>
							<div className='relative'>
								<Input
									id='newPassword'
									type={showPassword ? 'text' : 'password'}
									value={passwordForm.newPassword}
									onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
									placeholder='Nhập mật khẩu mới'
								/>
								<Button
									type='button'
									variant='ghost'
									size='sm'
									className='absolute right-0 top-0 h-full px-3'
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
								</Button>
							</div>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='confirmPassword'>Xác nhận mật khẩu</Label>
							<Input
								id='confirmPassword'
								type='password'
								value={passwordForm.confirmPassword}
								onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
								placeholder='Nhập lại mật khẩu mới'
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setIsPasswordDialogOpen(false)} disabled={isLoading}>
							Hủy
						</Button>
						<Button onClick={handleChangePassword} disabled={isLoading}>
							{isLoading ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : null}
							Đổi mật khẩu
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
