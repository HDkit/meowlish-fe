'use client';

import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Target, BookOpen, TrendingUp, PlayCircle, Calendar, Flame, ChevronDown, X } from 'lucide-react';
import { useAppSelector, useIsStoreHydrated } from '@/lib/store/hooks';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { ExamPracticeService } from '@/lib/api-client';

type DateRangeOption = {
	label: string;
	days: number;
};

const DATE_RANGES: DateRangeOption[] = [
	{ label: '1 tuần', days: 7 },
	{ label: '1 tháng', days: 30 },
	{ label: '3 tháng', days: 90 },
	{ label: '6 tháng', days: 180 },
	{ label: '1 năm', days: 365 },
];

function computeStreak(dateMap: Map<string, number>): number {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	let streak = 0;
	const check = new Date(today);
	if (!dateMap.get(formatDateKey(check))) {
		check.setDate(check.getDate() - 1);
	}
	while (true) {
		const key = formatDateKey(check);
		if ((dateMap.get(key) || 0) > 0) {
			streak++;
			check.setDate(check.getDate() - 1);
		} else {
			break;
		}
	}
	return streak;
}

function formatDateKey(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function Dashboard() {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const isHydrated = useIsStoreHydrated();
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<any>(null);
	const [calendarHistory, setCalendarHistory] = useState<Record<string, number>>({});
	const [rangeDays, setRangeDays] = useState(180);
	const [completedCount, setCompletedCount] = useState<number | null>(null);
	const [rangeOpen, setRangeOpen] = useState(false);
	const [customFrom, setCustomFrom] = useState('');
	const [customTo, setCustomTo] = useState('');
	const [showCustomPicker, setShowCustomPicker] = useState(false);

	const fetchCalendar = useCallback(async (from: string, to: string) => {
		try {
			const summaryRes = await ExamPracticeService.examPracticeGatewayControllerGetUsersAttemptSummaryV1({
				from,
				to
			});
			if (summaryRes.data?.history) {
				setCalendarHistory(summaryRes.data.history);
			}
		} catch {
			console.warn("Failed to load calendar history");
		}
	}, []);

	useEffect(() => {
		if (!isHydrated) return;
		if (!currentUser) {
			router.push('/auth');
			return;
		}

		const fetchDashboardData = async () => {
			setLoading(true);
			try {
				const end = new Date();
				const start = new Date();
				start.setDate(end.getDate() - rangeDays);
				await Promise.all([
					ExamPracticeService.examPracticeGatewayControllerGetUsesStatsV1()
						.then(res => setStats(res.data))
						.catch(() => {}),
					fetchCalendar(start.toISOString(), end.toISOString()),
					(async () => {
						try {
							let total = 0;
							let cursor: string | undefined;
							while (true) {
								const res: any = await ExamPracticeService.examPracticeGatewayControllerGetUsersAttemptHistoryV1(
									undefined, cursor, 200, undefined
								);
								const data = res?.data as { attempts?: Array<{ endedAt?: string }>; nextCursor?: string } | undefined;
								if (!data?.attempts?.length) break;
								total += data.attempts.filter(a => a.endedAt != null).length;
								if (!data.nextCursor) break;
								cursor = data.nextCursor;
							}
							setCompletedCount(total);
						} catch {
							console.warn("Failed to fetch completed attempt count");
						}
					})(),
				]);
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [isHydrated, currentUser, router, fetchCalendar, rangeDays]);

	const dateMap = useMemo(() => {
		const map = new Map<string, number>();
		for (const [epochStr, count] of Object.entries(calendarHistory)) {
			const date = new Date(Number(epochStr) * 1000);
			const key = formatDateKey(date);
			map.set(key, (map.get(key) || 0) + count);
		}
		return map;
	}, [calendarHistory]);

	const heatmapWeeks = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const weeksToShow = Math.min(Math.ceil(rangeDays / 7), 52);
		const start = new Date(today);
		start.setDate(start.getDate() - (weeksToShow * 7 + today.getDay()));

		const grid: { date: Date; count: number }[][] = [];
		let week: { date: Date; count: number }[] = [];

		const current = new Date(start);
		while (current <= today) {
			const key = formatDateKey(current);
			const count = dateMap.get(key) || 0;
			week.push({ date: new Date(current), count });

			if (week.length === 7) {
				grid.push(week);
				week = [];
			}
			current.setDate(current.getDate() + 1);
		}
		if (week.length > 0) grid.push(week);

		return grid;
	}, [dateMap, rangeDays]);

	const maxCount = useMemo(() => {
		let max = 0;
		for (const week of heatmapWeeks) {
			for (const day of week) {
				if (day.count > max) max = day.count;
			}
		}
		return max;
	}, [heatmapWeeks]);

	const streak = useMemo(() => computeStreak(dateMap), [dateMap]);

	if (!isHydrated || loading) {
		return <div className="min-h-screen bg-background flex items-center justify-center">
			<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>;
	}

	if (!currentUser) return null;

	const completedAttemptsCount = completedCount ?? stats?.attemptCounts ?? 0;
	const averageScore = stats?.averageScoreInPercentage ? Math.round(stats.averageScoreInPercentage) : 0;
	const topicCount = stats?.tagInfos?.length || 0;

	const getCellColor = (count: number) => {
		if (count === 0) return 'bg-slate-100';
		if (maxCount === 0) return 'bg-slate-100';
		const ratio = count / maxCount;
		if (ratio <= 0.25) return 'bg-green-200';
		if (ratio <= 0.5) return 'bg-green-300';
		if (ratio <= 0.75) return 'bg-green-400';
		return 'bg-green-600';
	};

	const displayName = currentUser.fullName && currentUser.fullName !== 'User'
		? currentUser.fullName
		: currentUser.username || currentUser.email?.split('@')[0] || 'Bạn';
	const showUsername = currentUser.username
		&& currentUser.fullName
		&& currentUser.fullName !== 'User'
		&& currentUser.fullName !== currentUser.username;

	const selectedRange = DATE_RANGES.find(r => r.days === rangeDays) || DATE_RANGES[3];

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

			<div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
				{/* Activity Heatmap */}
				<Card className="border-0 shadow-md rounded-xl hover:shadow-lg transition-all">
					<CardContent className="pt-6 pb-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
								<Calendar className="w-5 h-5 text-primary" />
								Hoạt động luyện tập
							</h2>
							<div className="relative">
								{showCustomPicker ? (
									<div className="flex items-center gap-2">
										<input
											type="date"
											value={customFrom}
											onChange={(e) => setCustomFrom(e.target.value)}
											className="text-sm border border-slate-200 rounded-lg px-2 py-1.5"
										/>
										<span className="text-xs text-muted-foreground">→</span>
										<input
											type="date"
											value={customTo}
											onChange={(e) => setCustomTo(e.target.value)}
											className="text-sm border border-slate-200 rounded-lg px-2 py-1.5"
										/>
										<Button
											size="sm"
											variant="default"
											disabled={!customFrom || !customTo}
											onClick={() => {
												if (customFrom && customTo) {
													fetchCalendar(new Date(customFrom).toISOString(), new Date(customTo).toISOString());
												}
											}}
										>
											Xem
										</Button>
										<Button size="sm" variant="ghost" onClick={() => setShowCustomPicker(false)}>
											<X className="h-4 w-4" />
										</Button>
									</div>
								) : (
									<>
										<Button
											variant="outline"
											size="sm"
											className="text-sm gap-1"
											onClick={() => setRangeOpen(!rangeOpen)}
										>
											{selectedRange.label}
											<ChevronDown className="h-3.5 w-3.5" />
										</Button>
										{rangeOpen && (
											<div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
												{DATE_RANGES.map(range => (
													<button
														key={range.days}
														className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 transition-colors ${range.days === rangeDays && !showCustomPicker ? 'font-bold text-primary' : 'text-slate-700'}`}
														onClick={() => {
															setRangeDays(range.days);
															setShowCustomPicker(false);
															setRangeOpen(false);
															const end = new Date();
															const start = new Date();
															start.setDate(end.getDate() - range.days);
															fetchCalendar(start.toISOString(), end.toISOString());
														}}
													>
														{range.label}
													</button>
												))}
												<hr className="my-1 border-slate-100" />
												<button
													className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 transition-colors ${showCustomPicker ? 'font-bold text-primary' : 'text-slate-700'}`}
													onClick={() => {
														setShowCustomPicker(true);
														setRangeOpen(false);
													}}
												>
													Tùy chỉnh
												</button>
											</div>
										)}
									</>
								)}
							</div>
						</div>
						<div className="flex gap-[3px] overflow-x-auto pb-2">
							<div className="flex flex-col gap-[3px] mr-1 shrink-0">
								{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, i) => (
									<div key={i} className="h-[13px] text-[10px] text-muted-foreground flex items-center leading-none">
										{i % 2 === 1 ? d : ''}
									</div>
								))}
							</div>
							{heatmapWeeks.map((week, wi) => (
								<div key={wi} className="flex flex-col gap-[3px]">
									{week.map((day, di) => (
										<div key={di} className="relative group/cell">
											<div
												className={`w-[13px] h-[13px] rounded-[3px] ${getCellColor(day.count)} transition-colors`}
											/>
											<div className={`absolute ${di < 2 ? 'top-full mt-1.5' : 'bottom-full mb-1.5'} left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/cell:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg`}>
												{day.date.toLocaleDateString('vi-VN')}: {day.count} bài đã làm
												{di < 2 ? (
													<div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
												) : (
													<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
												)}
											</div>
										</div>
									))}
								</div>
							))}
						</div>
						<div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground justify-end">
							<span>Ít</span>
							<div className="flex gap-[3px]">
								<div className="w-[13px] h-[13px] rounded-[3px] bg-slate-100" />
								<div className="w-[13px] h-[13px] rounded-[3px] bg-green-200" />
								<div className="w-[13px] h-[13px] rounded-[3px] bg-green-300" />
								<div className="w-[13px] h-[13px] rounded-[3px] bg-green-400" />
								<div className="w-[13px] h-[13px] rounded-[3px] bg-green-600" />
							</div>
							<span>Nhiều</span>
						</div>
					</CardContent>
				</Card>

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
