'use client';

import { Button } from './ui/button';
import { Target, BookOpen, TrendingUp, PlayCircle, Flame } from 'lucide-react';
import { useAppSelector, useIsStoreHydrated } from '@/lib/store/hooks';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ExamPracticeService } from '@/lib/api-client';
import { usePracticeActivity, useSkillStats } from '@/lib/hooks/usePracticeStats';
import { practiceSuggestion } from '@/lib/skill-stats';
import { ActivityHeatmapCard } from './progress/ActivityHeatmapCard';
import { WeeklyPlanCard } from './progress/WeeklyPlanCard';

export function Dashboard() {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const isHydrated = useIsStoreHydrated();
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<any>(null);
	const [heatWeeks, setHeatWeeks] = useState(26);
	const signedIn = isHydrated && !!currentUser;
	const activity = usePracticeActivity(heatWeeks * 7, signedIn);
	const skills = useSkillStats(signedIn);
	const suggestion = useMemo(
		() => (skills.data ? practiceSuggestion(skills.data.skills, skills.data.tags) : null),
		[skills.data],
	);

	useEffect(() => {
		if (!isHydrated) return;
		if (!currentUser) {
			router.push('/auth');
			return;
		}
		setLoading(true);
		ExamPracticeService.examPracticeGatewayControllerGetUsesStatsV1()
			.then(res => setStats(res.data))
			.catch(() => console.warn('Failed to load practice stats'))
			.finally(() => setLoading(false));
	}, [isHydrated, currentUser, router]);

	if (!isHydrated || loading) {
		return <div className="min-h-screen bg-background flex items-center justify-center">
			<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>;
	}

	if (!currentUser) return null;

	const completedAttemptsCount = activity.data?.totalAttempts ?? stats?.attemptCounts ?? 0;
	const streak = activity.data?.currentStreak ?? 0;
	const averageScore = stats?.averageScoreInPercentage ? Math.round(stats.averageScoreInPercentage) : 0;
	const topicCount = stats?.tagInfos?.length || 0;

	const displayName = currentUser.fullName && currentUser.fullName !== 'User'
		? currentUser.fullName
		: currentUser.username || currentUser.email?.split('@')[0] || 'Bạn';
	const showUsername = currentUser.username
		&& currentUser.fullName
		&& currentUser.fullName !== 'User'
		&& currentUser.fullName !== currentUser.username;

	return (
		<div className='min-h-screen bg-background pb-10'>
			{/* Hero Header */}
			<div className="relative overflow-hidden bg-primary text-primary-foreground">
				<div className="relative px-6 py-10 max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row items-center justify-between gap-6">
						<div>
							<h1 className="text-3xl font-bold mb-1">
								Chào mừng trở lại, {displayName}!
							</h1>
							{showUsername && (
								<p className="text-primary-foreground/50 text-sm mb-2">@{currentUser.username}</p>
							)}
							<p className="text-primary-foreground/80 text-lg">
								Hôm nay là một ngày tuyệt vời để nâng cao kỹ năng Tiếng Anh của bạn.
							</p>
						</div>
						<Button
							size="lg"
							onClick={() => router.push('/test-selection')}
							className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg border-0 px-6 py-6"
						>
							<PlayCircle className="h-5 w-5 mr-2" />
							Làm bài tập ngay
						</Button>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
						<div className="bg-white/20 rounded-2xl p-4 border border-white/20">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-primary/30 rounded-lg">
									<BookOpen className="h-5 w-5 text-primary-foreground/80" />
								</div>
								<div>
									<div className="text-2xl font-bold">{completedAttemptsCount}</div>
									<div className="text-xs text-primary-foreground/60">Đề đã làm</div>
								</div>
							</div>
						</div>
						<div className="bg-white/20 rounded-2xl p-4 border border-white/20">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-emerald-500/30 rounded-lg">
									<Target className="h-5 w-5 text-emerald-100" />
								</div>
								<div>
									<div className="text-2xl font-bold">{averageScore}%</div>
									<div className="text-xs text-primary-foreground/60">Điểm trung bình</div>
								</div>
							</div>
						</div>
						<div className="bg-white/20 rounded-2xl p-4 border border-white/20">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-orange-500/30 rounded-lg">
									<Flame className="h-5 w-5 text-orange-100" />
								</div>
								<div>
									<div className="text-2xl font-bold">{streak}</div>
									<div className="text-xs text-primary-foreground/60">Ngày liên tiếp</div>
								</div>
							</div>
						</div>
						<div className="bg-white/20 rounded-2xl p-4 border border-white/20">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-secondary/30 rounded-lg">
									<TrendingUp className="h-5 w-5 text-secondary-foreground" />
								</div>
								<div>
									<div className="text-2xl font-bold">{topicCount}</div>
									<div className="text-xs text-primary-foreground/60">Chủ đề đã ôn</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
				{/* This week + activity heatmap */}
				<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
					<WeeklyPlanCard
						className="lg:col-span-2"
						activity={activity.data}
						loading={activity.loading}
						error={activity.error}
						onRetry={activity.reload}
						suggestion={suggestion}
					/>
					<ActivityHeatmapCard
						className="lg:col-span-3 min-w-0"
						activity={activity.data}
						loading={activity.loading}
						error={activity.error}
						onRetry={activity.reload}
						weeks={heatWeeks}
						onWeeksChange={setHeatWeeks}
					/>
				</div>

				{/* Quick Actions */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{[
						{
							icon: Target,
							title: 'Luyện đề thi',
							desc: 'Chọn đề thi phù hợp với trình độ và mục tiêu của bạn',
							color: 'bg-rose-100 text-rose-600',
							href: '/test-selection',
						},
						{
							icon: TrendingUp,
							title: 'Xem tiến độ',
							desc: 'Theo dõi quá trình học tập và phân tích điểm mạnh, điểm yếu',
							color: 'bg-primary/15 text-primary',
							href: '/progress',
						},
						{
							icon: BookOpen,
							title: 'Flashcards',
							desc: 'Ôn tập từ vựng với thẻ ghi nhớ thông minh',
							color: 'bg-emerald-100 text-emerald-600',
							href: '/flashcards',
						},
					].map(({ icon: Icon, title, desc, color, href }) => (
						<button key={title} onClick={() => router.push(href)} className='group hover:-translate-y-1 transition-transform bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-left'>
							<div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
								<Icon className='h-6 w-6' />
							</div>
							<h4 className='font-bold text-gray-900 mb-2'>{title}</h4>
							<p className='text-sm text-gray-500 leading-relaxed'>{desc}</p>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
