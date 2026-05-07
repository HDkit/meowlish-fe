'use client';

import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Target, BookOpen, Clock, CheckCircle, Trophy, ChevronRight, Sparkles, TrendingUp, PlayCircle, Calendar } from 'lucide-react';
import { useAppSelector, useIsStoreHydrated } from '@/lib/store/hooks';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ExamPracticeService } from '@/lib/api-client';

export function Dashboard() {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const isHydrated = useIsStoreHydrated();
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<any>(null); // UserStatsDto
	const [recommendedExams, setRecommendedExams] = useState<any[]>([]); // MinimalExamInfoDto[]
	const [totalExamsDisplay, setTotalExamsDisplay] = useState("10+");
	const [calendarHistory, setCalendarHistory] = useState<Record<string, number>>({});

	useEffect(() => {
		if (!isHydrated) return;
		if (!currentUser) {
			router.push('/auth');
			return;
		}

		const fetchDashboardData = async () => {
			try {
				setLoading(true);
				
				// Fetch user stats
				try {
					const statsRes = await ExamPracticeService.examPracticeGatewayControllerGetUsesStatsV1();
					setStats(statsRes.data);
				} catch (err) {
					console.warn("Failed to load user stats (Might be unavailable yet)");
				}

				// Fetch history for heatmap
				try {
					const end = new Date();
					const start = new Date();
					start.setDate(end.getDate() - 365);
					const summaryRes = await ExamPracticeService.examPracticeGatewayControllerGetUsersAttemptSummaryV1({
						from: start.toISOString(),
						to: end.toISOString()
					});
					if (summaryRes.data?.history) {
						setCalendarHistory(summaryRes.data.history);
					}
				} catch (err) {
					console.warn("Failed to load history (Might be unavailable yet)");
				}

				// Fetch exams (using random limit for 'recommendation')
				try {
					const examsRes = await ExamPracticeService.examPracticeGatewayControllerFindExamsV1(undefined, undefined, undefined, 6);
					
					// Randomize the recommended exams
					const examList = examsRes.data?.exams || [];
					const shuffled = [...examList].sort(() => 0.5 - Math.random());
					setRecommendedExams(shuffled.slice(0, 3));
					
					// Approximate total limit since endpoint is cursor-based
					setTotalExamsDisplay(examList.length >= 6 ? "50+" : `${examList.length}`);
				} catch (err) {
					console.warn("Failed to load exams (Might be unavailable yet)");
				}

			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [isHydrated, currentUser, router]);

	// Activity Heatmap Data
	const heatmapWeeks = useMemo(() => {
		const weeks: { dateStr: string; count: number; isFuture: boolean }[][] = [];
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		
		const startDate = new Date(today);
		startDate.setDate(today.getDate() - 364); 
		
		// Align to Sunday
		while (startDate.getDay() !== 0) {
			startDate.setDate(startDate.getDate() - 1);
		}

		let currDate = new Date(startDate);
		while (currDate <= today || currDate.getDay() !== 0) {
			if (currDate > today && currDate.getDay() === 0) break;

			const weekIndex = Math.floor((currDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
			if (!weeks[weekIndex]) weeks[weekIndex] = [];

			const tzoffset = currDate.getTimezoneOffset() * 60000;
			const localISOTime = new Date(currDate.getTime() - tzoffset).toISOString().slice(0, 10);
			
			weeks[weekIndex].push({
				dateStr: localISOTime,
				count: calendarHistory[localISOTime] || 0,
				isFuture: currDate.getTime() > today.getTime()
			});

			currDate.setDate(currDate.getDate() + 1);
		}
		return weeks;
	}, [calendarHistory]);

	if (!isHydrated || loading) {
		return <div className="min-h-screen bg-background flex items-center justify-center">
			<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>;
	}

	if (!currentUser) return null;

	const completedAttemptsCount = stats?.attemptCounts || 0;
	const averageScore = stats?.averageScoreInPercentage ? Math.round(stats.averageScoreInPercentage) : 0;
	
	// Temporarily remove in-progress attempts since backend attempt history doesn't bundle exam titles elegantly yet
	const inProgressAttemptsCount = 0;

	const formatDate = (date: Date | string) => {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
	};

	const getHeatmapColor = (count: number, isFuture: boolean) => {
		if (isFuture) return 'bg-transparent border border-dashed border-muted';
		if (count === 0) return 'bg-muted';
		if (count === 1) return 'bg-primary/20';
		if (count >= 2 && count <= 3) return 'bg-primary/40';
		if (count >= 4 && count <= 5) return 'bg-primary/60';
		return 'bg-primary';
	};

	return (
		<div className='min-h-screen bg-background pb-10'>
			{/* ── Hero Header ── */}
			<div className="relative overflow-hidden bg-primary text-primary-foreground">

				<div className="relative px-6 py-10 max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row items-center justify-between gap-6">
						<div>
							<h1 className="text-3xl font-bold mb-2">
								Chào mừng trở lại, {currentUser.fullName}! 👋
							</h1>
							<p className="text-primary-foreground/80 text-lg">
								Hôm nay là một ngày tuyệt vời để nâng cao kỹ năng Tiếng Anh của bạn.
							</p>
						</div>
						<Button
							size="lg"
							onClick={() => router.push('/test-selection')}
							className="bg-white text-primary hover:bg-primary/10 font-bold shadow-lg border-0 px-6 py-6"
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
								<div className="p-2 bg-amber-500/30 rounded-lg">
									<Clock className="h-5 w-5 text-amber-100" />
								</div>
								<div>
									<div className="text-2xl font-bold">{inProgressAttemptsCount}</div>
									<div className="text-xs text-primary-foreground/60">Đang thực hiện</div>
								</div>
							</div>
						</div>
						<div className="bg-white/20 rounded-2xl p-4 border border-white/20">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-secondary/30 rounded-lg">
									<Trophy className="h-5 w-5 text-secondary-foreground" />
								</div>
								<div>
									<div className="text-2xl font-bold">{totalExamsDisplay}</div>
									<div className="text-xs text-primary-foreground/60">Đề thi có sẵn</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
				{/* Activity Heatmap */}
				<Card className="border-0 shadow-md bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all mb-8">
					<CardContent className="pt-6 pb-6 overflow-x-auto">
						<div className="min-w-[800px]">
							<div className="flex justify-between items-end mb-4">
								<h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
									<Calendar className="w-5 h-5 text-emerald-600" /> Hoạt động luyện tập
								</h2>
								<div className="text-sm text-gray-500">2026</div>
							</div>
							<div className="flex gap-[3px]">
								{/* Day Labels (Mon, Wed, Fri) */}
								<div className="flex flex-col gap-[3px] pr-2 text-xs text-gray-400 font-medium justify-between font-sans mt-[18px]">
									<span className="h-[14px]"></span>
									<span className="h-[14px] leading-[14px]">Mon</span>
									<span className="h-[14px]"></span>
									<span className="h-[14px] leading-[14px]">Wed</span>
									<span className="h-[14px]"></span>
									<span className="h-[14px] leading-[14px]">Fri</span>
									<span className="h-[14px]"></span>
								</div>

								{/* Heatmap Grid */}
								<div className="flex gap-[3px] flex-1">
									{heatmapWeeks.map((week, wIdx) => {
										// Strictly match -01 to prevent double month labels like NovNov
										const monthLabel = week.find((d) => d.dateStr.endsWith('-01'));
										return (
											<div key={wIdx} className="flex flex-col gap-[3px] relative pt-[18px]">
												{monthLabel && (
													<div className="absolute top-0 left-0 text-[10px] text-gray-500 font-medium select-none whitespace-nowrap">
														{new Date(monthLabel.dateStr).toLocaleString('en-US', { month: 'short' })}
													</div>
												)}
												{week.map((day, dIdx) => (
													<div
														key={dIdx}
														className={`w-[14px] h-[14px] rounded-[3px] ${getHeatmapColor(day.count, day.isFuture)} transition-colors duration-200 hover:ring-2 hover:ring-gray-300 hover:ring-offset-1`}
														title={day.isFuture ? undefined : `${day.count} bài làm vào ${formatDate(day.dateStr)}`}
													/>
												))}
											</div>
										);
									})}
								</div>
							</div>
							<div className="flex items-center justify-between mt-4 text-xs text-gray-500">
								<div>Cố gắng duy trì để phủ kín bảng này nhé!</div>
								<div className="flex items-center gap-1.5">
									<span>Ít</span>
									<div className="flex gap-[3px]">
										<div className="w-3 h-3 rounded-[2px] bg-muted" />
										<div className="w-3 h-3 rounded-[2px] bg-primary/20" />
										<div className="w-3 h-3 rounded-[2px] bg-primary/40" />
										<div className="w-3 h-3 rounded-[2px] bg-primary/60" />
										<div className="w-3 h-3 rounded-[2px] bg-primary" />
									</div>
									<span>Nhiều</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Section: Đề xuất cho bạn */}
				<div className="space-y-4">
					<div className="flex items-center justify-between border-b pb-2">
						<div className="flex items-center gap-2 text-gray-900">
							<Sparkles className="h-5 w-5 text-secondary/80" />
							<h2 className="text-xl font-bold">Đề xuất cho bạn</h2>
						</div>
						<Button variant="ghost" className="text-primary hover:text-primary/80" onClick={() => router.push('/test-selection')}>
							Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
						</Button>
					</div>
					{recommendedExams.length === 0 ? (
						<div className="text-center py-10 bg-white rounded-xl border border-gray-200 border-dashed">
							<CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
							<h3 className="text-gray-900 font-medium">Bạn đã làm hết các đề hiện có!</h3>
							<p className="text-sm text-gray-500 mt-1">Hệ thống đang cập nhật thêm đề thi mới.</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{recommendedExams.map(exam => (
								<Card key={exam.id} className="flex flex-col hover:shadow-lg transition-all border-gray-100 group overflow-hidden">
									<div className="h-1 shrink-0 bg-primary" />
									<CardContent className="p-5 flex flex-col flex-1">
										<div className="inline-block self-start px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 mb-3 uppercase tracking-wider">
											{exam.tags && exam.tags.find((t: string) => t.toLowerCase() === 'ielts' || t.toLowerCase() === 'toeic') || 'EXAM'}
										</div>
										<h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
											{exam.name}
										</h3>
										<p className="text-sm text-gray-500 line-clamp-2 mb-4">
											Bao gồm {exam.questionsCount} câu hỏi
										</p>
										<div className="mt-auto">
											<Button className="w-full bg-slate-900 hover:bg-primary/90 text-white transition-colors" onClick={() => router.push(`/test/${exam.id}`)}>
												Xem chi tiết
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>

				{/* AI Features */}
				<div className="space-y-4 pt-4">
					<h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Tính năng AI thông minh</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{[
							{
								icon: Target,
								title: 'Câu hỏi thích ứng',
								desc: 'Câu hỏi tự động điều chỉnh theo trình độ của bạn để tối ưu hóa việc học',
								color: 'bg-rose-100 text-rose-600'
							},
							{
								icon: TrendingUp,
								title: 'Phản hồi tức thì',
								desc: 'Nhận giải thích chi tiết và gợi ý cải thiện ngay lập tức',
								color: 'bg-primary/15 text-primary'
							},
							{
								icon: BookOpen,
								title: 'Lộ trình cá nhân hóa',
								desc: 'AI tạo kế hoạch học tập riêng dựa trên điểm mạnh và điểm yếu của bạn',
								color: 'bg-emerald-100 text-emerald-600'
							},
						].map(({ icon: Icon, title, desc, color }) => (
							<div key={title} className='group hover:-translate-y-1 transition-transform bg-white rounded-xl p-6 border border-gray-100 shadow-sm'>
								<div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
									<Icon className='h-6 w-6' />
								</div>
								<h4 className='font-bold text-gray-900 mb-2'>{title}</h4>
								<p className='text-sm text-gray-500 leading-relaxed'>{desc}</p>
							</div>
						))}
					</div>
				</div>

			</div>
		</div>
	);
}
