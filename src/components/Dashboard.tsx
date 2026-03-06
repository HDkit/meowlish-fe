'use client';

import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Target, BookOpen, Clock, CheckCircle, Trophy, ChevronRight, Sparkles, TrendingUp, PlayCircle } from 'lucide-react';
import { useAppSelector } from '@/lib/store/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ExamStatus } from '../types/client';

export function Dashboard() {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const router = useRouter();

	const allExams = useAppSelector((state) => state.exams.list);
	const allAttempts = useAppSelector((state) => state.attempts.list);

	useEffect(() => {
		if (!currentUser) router.push('/auth');
	}, [currentUser, router]);

	if (!currentUser) return null;

	// Derived Data
	const userAttempts = allAttempts.filter(a => a.userId === currentUser.id);
	const completedAttempts = userAttempts.filter(a => a.score !== undefined);
	const inProgressAttempts = userAttempts.filter(a => a.score === undefined);

	const averageScore = completedAttempts.length > 0
		? Math.round(completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length)
		: 0;

	const publishedExams = allExams.filter(e => e.status === ExamStatus.Published || e.status === ExamStatus.Approved);

	// Get 3 recommended exams (that user hasn't completed)
	const completedExamIds = new Set(completedAttempts.map(a => a.examId));
	const recommendedExams = publishedExams.filter(e => !completedExamIds.has(e.id)).slice(0, 3);

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 pb-10'>
			{/* ── Hero Header ── */}
			<div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
				<div className="absolute inset-0 bg-black/10" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
				<div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />

				<div className="relative px-6 py-10 max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row items-center justify-between gap-6">
						<div>
							<h1 className="text-3xl font-bold mb-2">
								Chào mừng trở lại, {currentUser.fullName}! 👋
							</h1>
							<p className="text-blue-100 text-lg">
								Hôm nay là một ngày tuyệt vời để nâng cao kỹ năng Tiếng Anh của bạn.
							</p>
						</div>
						<Button
							size="lg"
							onClick={() => router.push('/test-selection')}
							className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg border-0 px-6 py-6"
						>
							<PlayCircle className="h-5 w-5 mr-2" />
							Làm bài tập ngay
						</Button>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
						<div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-500/30 rounded-lg">
									<BookOpen className="h-5 w-5 text-blue-100" />
								</div>
								<div>
									<div className="text-2xl font-bold">{completedAttempts.length}</div>
									<div className="text-xs text-blue-200">Đề đã làm</div>
								</div>
							</div>
						</div>
						<div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-emerald-500/30 rounded-lg">
									<Target className="h-5 w-5 text-emerald-100" />
								</div>
								<div>
									<div className="text-2xl font-bold">{averageScore}%</div>
									<div className="text-xs text-blue-200">Điểm trung bình</div>
								</div>
							</div>
						</div>
						<div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-amber-500/30 rounded-lg">
									<Clock className="h-5 w-5 text-amber-100" />
								</div>
								<div>
									<div className="text-2xl font-bold">{inProgressAttempts.length}</div>
									<div className="text-xs text-blue-200">Đang thực hiện</div>
								</div>
							</div>
						</div>
						<div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-purple-500/30 rounded-lg">
									<Trophy className="h-5 w-5 text-purple-100" />
								</div>
								<div>
									<div className="text-2xl font-bold">{publishedExams.length}</div>
									<div className="text-xs text-blue-200">Đề thi có sẵn</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
				{/* Section: In Progress (Nếu có) */}
				{inProgressAttempts.length > 0 && (
					<div className="space-y-4">
						<div className="flex items-center gap-2 text-gray-900 border-b pb-2">
							<Clock className="h-5 w-5 text-amber-500" />
							<h2 className="text-xl font-bold">Bài thi đang thực hiện</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{inProgressAttempts.slice(0, 3).map(attempt => {
								const exam = allExams.find(e => e.id === attempt.examId);
								if (!exam) return null;
								return (
									<Card key={attempt.id} className="hover:shadow-md transition-shadow border-gray-200 cursor-pointer" onClick={() => router.push(`/test/do/${exam.id}`)}>
										<CardContent className="p-5">
											<h3 className="font-bold text-gray-900 line-clamp-1">{exam.title}</h3>
											<p className="text-sm text-gray-500 mt-1 mb-4 flex items-center gap-1">
												<Clock className="h-3.5 w-3.5" /> Còn {Math.ceil(attempt.timeLeft / 60)} phút
											</p>
											<Button className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 shadow-none border border-amber-200">
												Tiếp tục làm bài
											</Button>
										</CardContent>
									</Card>
								)
							})}
						</div>
					</div>
				)}

				{/* Section: Đề xuất cho bạn */}
				<div className="space-y-4">
					<div className="flex items-center justify-between border-b pb-2">
						<div className="flex items-center gap-2 text-gray-900">
							<Sparkles className="h-5 w-5 text-purple-500" />
							<h2 className="text-xl font-bold">Đề xuất cho bạn</h2>
						</div>
						<Button variant="ghost" className="text-blue-600 hover:text-blue-800" onClick={() => router.push('/test-selection')}>
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
									<div className="h-1 shrink-0 bg-gradient-to-r from-blue-400 to-cyan-400" />
									<CardContent className="p-5 flex flex-col flex-1">
										<div className="inline-block self-start px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 mb-3 uppercase tracking-wider">
											{exam.testType}
										</div>
										<h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
											{exam.title}
										</h3>
										<p className="text-sm text-gray-500 line-clamp-2 mb-4">
											{exam.description}
										</p>
										<div className="mt-auto">
											<Button className="w-full bg-slate-900 hover:bg-blue-600 text-white transition-colors" onClick={() => router.push(`/test/${exam.id}`)}>
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
								color: 'bg-blue-100 text-blue-600'
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
