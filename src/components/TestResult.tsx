'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, Clock, Trophy, Target, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { ExamPracticeService } from '@/lib/api/services/ExamPracticeService';
import { AttemptReviewDto } from '@/lib/api/models/AttemptReviewDto';
import { QuestionReviewDto } from '@/lib/api/models/QuestionReviewDto';
import { SectionReviewDto } from '@/lib/api/models/SectionReviewDto';
import { AICard, QuestionCard } from './QuestionCard';
import { useAppSelector } from '@/lib/store/hooks';

export function TestResult() {
	const { id } = useParams(); // Đây là attemptId
	const router = useRouter();

	const exams = useAppSelector((state) => state.exams.list);
	const [reviewData, setReviewData] = useState<AttemptReviewDto | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	// Exam ID might not be in review data directly, but we can try to guess it from exams or it might not be strictly needed except for retake
	const [examId, setExamId] = useState<string>('');

	// 1. Fetch Review Data
	useEffect(() => {
		const fetchReview = async () => {
			if (!id) return;
			try {
				const res = await ExamPracticeService.examPracticeGatewayControllerGetAttemptReviewV1(id as string);
				if (res.data) {
					setReviewData(res.data as AttemptReviewDto);
					// Extract examId from the responses if possible, or usually we might not need it
					if (res.data.examId) {
						setExamId(res.data.examId);
					}
				}
			} catch (err: any) {
				console.error(err);
				setError("Không thể tải kết quả. Có thể bài làm chưa hoàn thành hoặc không tồn tại.");
			} finally {
				setLoading(false);
			}
		};
		fetchReview();
	}, [id]);

	// 2. Logic tái tạo lại đề thi (Lấy tất cả câu hỏi thuộc Review Data)
	const examQuestions = useMemo(() => {
		if (!reviewData) return [];

		const result: QuestionReviewDto[] = [];
		const walk = (sections: SectionReviewDto[]) => {
			for (const s of sections) {
				if (s.questions) result.push(...s.questions);
				if (s.sections) walk(s.sections);
			}
		};
		walk(reviewData.sections || []);
		return result;
	}, [reviewData]);

	// Thống kê đúng sai
	const stats = useMemo(() => {
		let correct = 0;
		let incorrect = 0;
		let skipped = 0;
		let manual = 0;

		if (!reviewData) return { correct, incorrect, skipped, manual, total: 0 };

		examQuestions.forEach((q) => {
			const res = reviewData.responses?.find(r => r.questionId === q.id);
			if (!res || !res.answers || res.answers.length === 0) {
				skipped++;
			} else if (res.isCorrect === true) {
				correct++;
			} else if (res.isCorrect === false) {
				incorrect++;
			} else {
				manual++;
			}
		});

		return { correct, incorrect, skipped, manual, total: examQuestions.length };
	}, [examQuestions, reviewData]);

	// Loading state
	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
				<div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
				<p className="mt-4 text-slate-600 font-medium">Đang tải kết quả...</p>
			</div>
		);
	}

	if (error || !reviewData) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
				<div className="text-red-500 mb-4"><XCircle className="w-16 h-16" /></div>
				<p className="text-slate-700 font-medium">{error || "Không có dữ liệu bài làm."}</p>
				<Button onClick={() => router.push('/')} className="mt-4">Về trang chủ</Button>
			</div>
		);
	}

	// Lấy exam info để hiển thị tiêu đề
	const examInfo = examId ? exams.find((e) => e.id === examId) : null;
	const title = examInfo?.title || "Chi tiết kết quả bài thi";

	// Tính thời gian đã làm
	const startedAt = new Date(reviewData.startedAt).getTime();
	const endedAt = new Date(reviewData.endedAt).getTime();
	const timeTakenSeconds = Math.max(0, Math.floor((endedAt - startedAt) / 1000));
	const minutes = Math.floor(timeTakenSeconds / 60);
	const seconds = timeTakenSeconds % 60;

	return (
		<div className='min-h-screen bg-slate-50 pb-20'>
			{/* Premium Header */}
			<div className='bg-white border-b border-gray-200 mb-8 pt-6 pb-16 relative overflow-hidden'>
				<div className='absolute inset-0 bg-primary pointer-events-none'></div>
				<div className="absolute inset-0 bg-black/10 pointer-events-none" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
					<Button
						variant="ghost"
						onClick={() => router.push(examId ? `/tests/${examId}` : '/dashboard')}
						className="flex items-center gap-2 mb-6 -ml-2 text-primary-foreground/80 hover:text-white hover:bg-white/10 font-medium transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Trở về
					</Button>

					<div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 text-center md:text-left">
						<div className="flex-1">
							<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-bold mb-4 shadow-sm">
								<Trophy className="w-4 h-4 text-yellow-300" /> KẾT QUẢ BÀI THI
							</div>
							<h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">
								{title}
							</h1>
							<p className="text-primary-foreground/80 font-medium text-lg max-w-2xl leading-relaxed">
								Nộp bài vào lúc {new Date(reviewData.endedAt).toLocaleString('vi-VN')}
							</p>
						</div>

						{/* Score Circle / Badge */}
						<div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl w-48 shrink-0 relative overflow-hidden group">
							<div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
							<span className="text-sm font-bold text-primary-foreground/80 uppercase tracking-widest mb-1">Tổng điểm</span>
							<div className="flex items-baseline gap-1">
								<span className="text-5xl font-black text-white drop-shadow-md">{reviewData.totalPoints !== undefined ? Number(reviewData.totalPoints).toFixed(1) : 0}</span>
								<span className="text-xl text-primary/60 font-bold">/100</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 -mt-10 relative z-20'>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
						<div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-1 border border-slate-100">
							<Clock className="h-6 w-6" />
						</div>
						<span className="text-sm font-bold text-slate-500 uppercase">Thời gian</span>
						<span className="text-2xl font-black text-slate-800">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
					</div>

					<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
						<div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-1 border border-green-100">
							<CheckCircle2 className="h-6 w-6" />
						</div>
						<span className="text-sm font-bold text-slate-500 uppercase">Đúng</span>
						<span className="text-2xl font-black text-green-600">{stats.correct} / {stats.total}</span>
					</div>

					<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
						<div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-1 border border-red-100">
							<XCircle className="h-6 w-6" />
						</div>
						<span className="text-sm font-bold text-slate-500 uppercase">Sai</span>
						<span className="text-2xl font-black text-red-600">{stats.incorrect}</span>
					</div>

					<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
						<div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-1 border border-orange-100">
							<AlertCircle className="h-6 w-6" />
						</div>
						<span className="text-sm font-bold text-slate-500 uppercase">Bỏ qua / Tự luận</span>
						<span className="text-2xl font-black text-orange-600">{stats.skipped + stats.manual}</span>
					</div>
				</div>

				<div className='flex flex-col sm:flex-row justify-center gap-4 py-4'>
					<Button
						onClick={() => router.push('/')}
						className='bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-bold px-8 h-12 rounded-xl shadow-sm'
					>
						Về Trang Chủ
					</Button>
					{examId && (
						<Button
							onClick={() => {
								sessionStorage.setItem('testState', JSON.stringify({ retake: true }));
								router.push(`/test/${examId}`);
							}}
							className='bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-xl shadow-md transition-all hover:-translate-y-0.5'
						>
							<RefreshCw className="w-4 h-4 mr-2" /> Làm Lại Bài Thi
						</Button>
					)}
				</div>

				{/* Detailed Results */}
				<div className='space-y-6'>
					<div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
						<Target className="w-6 h-6 text-primary" />
						<h2 className='text-2xl font-extrabold text-slate-800'>Đáp án chi tiết</h2>
					</div>

					{examQuestions.map((q, index) => {
						const res = reviewData.responses?.find((r) => r.questionId === q.id);
						const userAnswers = res?.answers || [];
						const userAnswerStr = userAnswers.join(', ');

						let status = 'skipped';
						if (userAnswers.length > 0) {
							if (res?.isCorrect === true) status = 'correct';
							else if (res?.isCorrect === false) status = 'incorrect';
							else status = 'manual';
						}

						let borderClass = 'border-slate-200 ring-1 ring-slate-200';
						let bgHeaderClass = 'bg-slate-50';
						let statusText = 'Bỏ qua';
						let statusColor = 'text-slate-500';
						let statusBg = 'bg-slate-200';
						let StatusIcon = AlertCircle;

						if (status === 'correct') {
							borderClass = 'border-green-500 ring-1 ring-green-500/30';
							bgHeaderClass = 'bg-green-50/50';
							statusText = 'Chính xác';
							statusColor = 'text-green-700';
							statusBg = 'bg-green-100';
							StatusIcon = CheckCircle2;
						} else if (status === 'incorrect') {
							borderClass = 'border-red-500 ring-1 ring-red-500/30';
							bgHeaderClass = 'bg-red-50/50';
							statusText = 'Không chính xác';
							statusColor = 'text-red-700';
							statusBg = 'bg-red-100';
							StatusIcon = XCircle;
						} else if (status === 'manual') {
							statusText = 'Chờ thẩm định';
						}

						// Parse options from the choices if present
						const options = q.choices?.map(c => c.key) || [];

						return (
							<div key={q.id} className={`bg-white rounded-2xl border-l-[6px] shadow-sm hover:shadow-md transition-shadow overflow-hidden ${borderClass}`}>
								<div className={`px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${bgHeaderClass} border-b border-slate-100`}>
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-slate-700">
											{index + 1}
										</div>
										<span className={`inline-flex items-center gap-1.5 font-bold uppercase text-xs px-3 py-1.5 rounded-full ${statusBg} ${statusColor}`}>
											<StatusIcon className="w-3.5 h-3.5" />
											{statusText}
										</span>
									</div>
									<div className="flex items-center gap-4">
										<span className='text-sm bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-600 font-bold shadow-sm whitespace-nowrap'>{q.points} Điểm</span>
										<AICard q={q} />
									</div>
								</div>

								<div className='p-6 md:p-8 space-y-8'>
									<div className="prose prose-slate max-w-none">
										<p className='text-slate-800 text-lg font-medium leading-relaxed'>{q.content}</p>
									</div>

									{options && options.length > 0 && (
										<div className='bg-slate-50 rounded-xl p-5 border border-slate-100'>
											<p className='mb-3 font-bold text-slate-700 text-sm uppercase tracking-wide'>Các lựa chọn:</p>
											<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
												{q.choices.map((op, i) => {
													const opKey = String.fromCharCode(65 + i);
													const isChecked = userAnswers.includes(op.key);
													return (
														<div key={i} className={`flex items-start gap-3 p-3 rounded-lg border bg-white ${isChecked ? 'border-primary shadow-[0_0_0_1px_rgba(96,165,250,1)]' : 'border-slate-200'}`}>
															<div className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center text-xs font-bold ${isChecked ? 'bg-primary border-primary text-primary-foreground' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
																{opKey}
															</div>
															<span className={`text-sm ${isChecked ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{op.content || op.key}</span>
														</div>
													);
												})}
											</div>
										</div>
									)}

									<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
										<div className={`p-5 rounded-xl border ${status === 'correct' ? 'bg-green-50/50 border-green-200' : status === 'incorrect' ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
											<div className="flex items-center gap-2 mb-2">
												<UserIcon className={`w-4 h-4 ${status === 'correct' ? 'text-green-600' : status === 'incorrect' ? 'text-red-600' : 'text-slate-500'}`} />
												<p className='text-xs uppercase font-bold text-slate-500 tracking-wider'>Câu trả lời của bạn</p>
											</div>
											<div className='min-h-[2.5rem] flex flex-wrap items-center gap-2'>
												{userAnswerStr ? (
													<span className={`text-lg font-bold px-3 py-1 bg-white rounded-lg border shadow-sm ${status === 'correct' ? 'text-green-700 border-green-200' : status === 'incorrect' ? 'text-red-600 border-red-200' : 'text-slate-700 border-slate-300'}`}>
														{userAnswerStr}
													</span>
												) : (
													<span className="text-slate-400 italic font-medium">Chưa trả lời</span>
												)}
											</div>
										</div>

										<div className="p-5 rounded-xl border bg-primary/10 border-primary/30">
											<div className="flex items-center gap-2 mb-2">
												<CheckCircle2 className="w-4 h-4 text-primary" />
												<p className='text-xs uppercase font-bold text-primary tracking-wider'>Đáp án đúng</p>
											</div>
											<div className='min-h-[2.5rem] flex flex-wrap items-center gap-2'>
												<QuestionCard q={q} status={status}></QuestionCard>
											</div>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

// Helper icon component
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	)
}
