'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Section, TestType, Skill, Difficulty, Comment } from '../types/client';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useParams, useRouter } from 'next/navigation';
import { ExamPracticeService } from '@/lib/api-client';
import { extractApiErrorMessage, extractEntityData } from '@/lib/api-response';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { addComment } from './store/commentSlice';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
	Clock,
	MessageSquare,
	Users,
	AlertCircle,
	FileText,
	CheckCircle2,
	Circle,
	Play,
	BookOpen,
	Headphones,
	Mic,
	PenTool,
	Target,
	Info,
	ArrowLeft,
	History,
} from 'lucide-react';

export function ExamDetailPage() {
	const { id } = useParams();
	const router = useRouter();
	const dispatch = useAppDispatch();
	if (!id) return <div>Invalid Exam ID</div>;

	const examId = id as string;

	const [examData, setExamData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	const currentUser = useAppSelector((state) => state.currUser.current);
	const users = useAppSelector((state) => state.users.list);
	const comments = useAppSelector((state) => state.comments.list);

	useEffect(() => {
		const fetchExamData = async () => {
			try {
				setLoading(true);
				setLoadError(null);
				const response = await ExamPracticeService.examPracticeGatewayControllerGetExamDetailsV1(examId);
				const payload = extractEntityData<any>(response);
				if (!payload) {
					throw new Error('API không trả về dữ liệu đề thi.');
				}
				setExamData(payload);
			} catch (error) {
				console.error('Failed to fetch exam data:', error);
				setLoadError(extractApiErrorMessage(error, 'Không thể tải dữ liệu đề thi từ backend.'));
			} finally {
				setLoading(false);
			}
		};

		// Fetch attempt history để phát hiện bài dang dở
		const fetchOngoingAttempt = async () => {
			try {
				const res = await ExamPracticeService.examPracticeGatewayControllerGetUsersAttemptHistoryV1(
					examId,
					undefined,
					10,
					{ key: 'startedAt', direction: 'DESC' }
				);
				const attempts: any[] = res?.data?.attempts ?? [];
				// Attempt chưa nộp = endedAt null/undefined
				const inProgress = attempts.find((a) => !a.endedAt);
				if (inProgress) {
					setOngoingAttempt({ id: inProgress.id, startedAt: inProgress.startedAt });
				}
			} catch (e) {
				// Không thông báo lỗi này để không làm phiền user
				console.warn('Could not fetch attempt history:', e);
			}
		};

		if (examId) {
			fetchExamData();
			fetchOngoingAttempt();
		}
	}, [examId]);

	// --- State quản lý UI ---
	const [activeTab, setActiveTab] = useState<'practice' | 'fulltest' | 'discuss'>('practice');
	const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
	const [timer, setTimer] = useState<string>('');
	const [commentInput, setCommentInput] = useState<string>('');
	const [examRating, setExamRating] = useState<Difficulty>(Difficulty.Intermediate);
	const [startError, setStartError] = useState<string | null>(null);
	const [isStarting, setIsStarting] = useState(false);
	// Attempt dang dở của user cho exam này
	const [ongoingAttempt, setOngoingAttempt] = useState<{ id: string; startedAt: string } | null>(null);
	const [isSubmittingOld, setIsSubmittingOld] = useState(false);
	// Dialog fallback (giữ lại cho trường hợp 499 khi không tìm được từ history)
	const [pendingAttemptDialog, setPendingAttemptDialog] = useState<{ open: boolean; attemptId: string | null }>({ open: false, attemptId: null });

	// Tạm thời bảo toàn các helper functions UI
	const rootSections = examData?.sections || [];
	const countQuestionsInSection = (sectionId: string): number => {
		const sec = rootSections.find((s: any) => s.id === sectionId);
		return sec ? sec.questionsCount : 0;
	};
	const getTagsForSection = (sectionId: string) => {
		const sec = rootSections.find((s: any) => s.id === sectionId);
		return sec?.tags?.map((t: string) => ({ id: t, name: t })) || [];
	};
	const totalQuestions = rootSections.reduce((acc: number, cur: any) => acc + cur.questionsCount, 0);
	const examAttempts = examData?.attemptsCount || 0;

	// Xử lý thông tin parse từ tag
	const lowerTags = examData?.tags?.map((t: string) => t.toLowerCase()) || [];
	const difficulty = lowerTags.includes('beginner') ? Difficulty.Beginner : lowerTags.includes('advanced') ? Difficulty.Advanced : Difficulty.Intermediate;
	const skill = lowerTags.includes('listening') ? Skill.Listening : lowerTags.includes('speaking') ? Skill.Speaking : lowerTags.includes('writing') ? Skill.Writing : Skill.Reading;
	const testType = lowerTags.includes('ielts') ? TestType.IELTS : TestType.TOEIC;

	// --- Handlers ---
	const toggleSection = (secId: string) => {
		setSelectedSectionIds((prev) => (prev.includes(secId) ? prev.filter((id) => id !== secId) : [...prev, secId]));
	};

	const handleStart = async () => {
		if (!examData || isStarting) return;
		setIsStarting(true);
		setStartError(null);

		try {
			const sectionsToUse = activeTab === 'fulltest' ? [] : selectedSectionIds;
			const timerValue = activeTab === 'fulltest' ? examData.duration : timer ? parseInt(timer) : undefined;

			const res = await ExamPracticeService.examPracticeGatewayControllerAttemptV1(
				examId,
				{
					options: {
						duration: timerValue,
						sectionIds: sectionsToUse.length > 0 ? sectionsToUse : undefined,
					}
				}
			);

			const attemptId = res.data?.id;
			if (attemptId) {
				router.push(`/test/do/${attemptId}`);
			} else {
				setStartError('Không nhận được ID bài thi từ server.');
			}
		} catch (error: any) {
			const status = error?.status ?? error?.body?.statusCode;
			const errorMsg: string = error?.body?.error ?? '';

			// Backend trả 499: có attempt cũ chưa nộp (fallback nếu history chưa fetch kịp)
			if (status === 499 && errorMsg.toLowerCase().includes('previous attempt')) {
				const existingAttemptId: string | null = error?.body?.data?.id ?? null;
				setPendingAttemptDialog({ open: true, attemptId: existingAttemptId });
			} else {
				console.error('Failed to start attempt:', error);
				setStartError(extractApiErrorMessage(error, 'Không thể bắt đầu bài thi. Vui lòng thử lại.'));
			}
		} finally {
			setIsStarting(false);
		}
	};

	// Nộp attempt đang dang dở từ banner, lấy dữ liệu saved rồi tự động tạo attempt mới
	const handleSubmitOngoingAndStartNew = async () => {
		if (!ongoingAttempt) return;
		setIsSubmittingOld(true);
		const idToSubmit = ongoingAttempt.id;
		setOngoingAttempt(null);
		try {
			await ExamPracticeService.examPracticeGatewayControllerEndAttemptV1(idToSubmit);
		} catch (e) {
			console.error('Failed to submit ongoing attempt:', e);
		} finally {
			setIsSubmittingOld(false);
		}
		// Tự động bắt đầu bài mới ngay sau khi nộp xong
		await handleStart();
	};

	// Nộp attempt cũ từ fallback dialog (499 khi không tìm được từ history)
	const handleSubmitOldAndStartNew = async () => {
		const oldAttemptId = pendingAttemptDialog.attemptId;
		setPendingAttemptDialog({ open: false, attemptId: null });
		if (oldAttemptId) {
			try {
				await ExamPracticeService.examPracticeGatewayControllerEndAttemptV1(oldAttemptId);
			} catch (e) {
				console.error('Failed to submit old attempt:', e);
			}
		}
		handleStart();
	};

	const handleCommentSubmit = () => {
		if (!commentInput.trim() || !currentUser) return;

		const newComment: Comment = {
			id: 'comment_' + Date.now(),
			userId: currentUser.id,
			examId: examId,
			content: commentInput.trim(),
			examRating: examRating,
		};

		dispatch(addComment(newComment));
		setCommentInput('');
		setActiveTab('discuss');
	};

	// Filter comments for this exam
	const examComments = useMemo(() => {
		return comments.filter((c) => c.examId === examId);
	}, [comments, examId]);

	// Helper functions
	const getDifficultyColor = (difficulty: Difficulty) => {
		switch (difficulty) {
			case Difficulty.Beginner:
				return 'bg-green-100 text-green-800 border-green-200';
			case Difficulty.Intermediate:
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case Difficulty.Advanced:
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	};

	const getDifficultyText = (difficulty: Difficulty) => {
		switch (difficulty) {
			case Difficulty.Beginner:
				return 'Cơ bản';
			case Difficulty.Intermediate:
				return 'Trung bình';
			case Difficulty.Advanced:
				return 'Nâng cao';
			default:
				return difficulty;
		}
	};

	const getSkillIcon = (skill: Skill) => {
		switch (skill) {
			case Skill.Reading:
				return BookOpen;
			case Skill.Listening:
				return Headphones;
			case Skill.Speaking:
				return Mic;
			case Skill.Writing:
				return PenTool;
			default:
				return FileText;
		}
	};

	const getTestTypeLabel = (testType: TestType) => {
		return testType === TestType.IELTS ? 'IELTS' : 'TOEIC';
	};

	const getPartName = (_section: Section, index: number) => {
		return `Part ${index + 1}`;
	};

	if (loading) return <div className='p-6 text-center text-gray-500'>Đang tải đề thi...</div>;
	if (loadError) {
		return (
			<div className='min-h-screen bg-slate-50 px-6 py-16'>
				<div className='mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm'>
					<div className='flex items-start gap-3'>
						<AlertCircle className='mt-0.5 h-5 w-5 text-red-500' />
						<div className='space-y-3'>
							<div>
								<h1 className='text-xl font-semibold text-slate-900'>Không tải được đề thi</h1>
								<p className='mt-1 text-sm text-slate-600'>
									Nếu backend trả <code>502 Bad Gateway</code> thì thường là API nguồn đang lỗi,
									không phải do giao diện render.
								</p>
							</div>
							<div className='rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700'>
								{loadError}
							</div>
							<div className='flex flex-wrap gap-3'>
								<Button variant="outline" onClick={() => router.push('/test-selection')}>
									<ArrowLeft className='mr-2 h-4 w-4' />
									Quay lại danh sách đề
								</Button>
								<Button onClick={() => window.location.reload()}>
									Thử tải lại
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
	if (!examData) return <div className='p-6 text-center text-gray-500'>Không tìm thấy đề thi</div>;

	const SkillIcon = getSkillIcon(skill);

	return (
		<div className='min-h-screen bg-slate-50/50 pb-20'>
			{/* Premium Header */}
			<div className='bg-white border-b border-gray-200 mb-8 pt-10 pb-12 relative overflow-hidden'>
				<div className='absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 pointer-events-none'></div>
				<div className="absolute inset-0 bg-black/10 pointer-events-none" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

				<div className='max-w-6xl mx-auto px-6 relative z-10'>
					<Button
						variant="ghost"
						onClick={() => router.push('/test-selection')}
						className="flex items-center gap-2 mb-8 -ml-2 text-blue-100 hover:text-white hover:bg-white/10 transition-colors font-semibold"
					>
						<ArrowLeft className="h-4 w-4" />
						Trở về danh sách đề thi
					</Button>

					<div className='space-y-6'>
						<div className='flex items-start justify-between'>
							<div className='space-y-4 flex-1'>
								<div className='flex items-center gap-3 flex-wrap'>
									<Badge
										variant='outline'
										className={`shadow-sm bg-white/20 backdrop-blur-md text-white border-white/30 px-3 py-1 font-bold text-sm`}
									>
										{getTestTypeLabel(testType)}
									</Badge>
									<Badge variant='outline' className='bg-white/20 backdrop-blur-md text-white border-white/30 px-3 py-1 font-bold text-sm shadow-sm'>
										<SkillIcon className='h-4 w-4 mr-1.5' />
										{skill.charAt(0).toUpperCase() + skill.slice(1)}
									</Badge>
									<Badge className={`px-3 py-1 font-bold text-sm uppercase tracking-wide border bg-white/10 backdrop-blur-md shadow-sm ${difficulty === Difficulty.Beginner ? 'text-green-300 border-green-300/50' : difficulty === Difficulty.Intermediate ? 'text-yellow-300 border-yellow-300/50' : 'text-red-300 border-red-300/50'}`}>
										{getDifficultyText(difficulty)}
									</Badge>
								</div>
								<h1 className='text-4xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight'>{examData.name}</h1>
								<p className='text-blue-100 text-lg md:text-xl font-medium max-w-3xl leading-relaxed opacity-90'>{examData.description}</p>
							</div>
						</div>

						<div className='flex items-center gap-6 text-sm flex-wrap text-blue-50 pt-2'>
							<div className='flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner'>
								<Clock className='h-5 w-5 text-blue-200' />
								<span className="font-semibold text-base">{examData.duration} giây</span>
							</div>
							<div className='flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner'>
								<FileText className='h-5 w-5 text-indigo-200' />
								<span className="font-semibold text-base">{rootSections.length} phần thi</span>
							</div>
							<div className='flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner'>
								<Target className='h-5 w-5 text-rose-200' />
								<span className="font-semibold text-base">{totalQuestions} câu hỏi</span>
							</div>
							<div className='flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner'>
								<Users className='h-5 w-5 text-emerald-200' />
								<span className="font-semibold text-base">{examAttempts} người luyện</span>
							</div>
						</div>

						{activeTab === 'fulltest' && (
							<div className='bg-white/10 border-l-4 border-blue-400 backdrop-blur-md rounded-r-xl p-4 flex gap-3 text-blue-50 text-sm mt-4 shadow-sm'>
								<Info className='shrink-0 h-5 w-5 mt-0.5 text-blue-300' />
								<p className="font-medium text-[15px]">
									Chế độ <strong>Full Test</strong> sẽ mô phỏng kỳ thi thực tế. Hệ thống sẽ căn cứ vào đây để tính <strong>Scaled Score</strong> (điểm chuẩn) cho bạn (VD: Band 9.0 IELTS hoặc 990 TOEIC).
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className='max-w-6xl mx-auto px-6'>

				{/* 2. Navigation Tabs */}
				<div className='mb-8 flex justify-center md:justify-start'>
					<div className='inline-flex bg-slate-200/50 p-1.5 rounded-2xl shadow-inner border border-slate-200/60'>
						<button
							className={`px-6 py-2.5 rounded-xl text-[15px] font-bold transition-all ${activeTab === 'practice'
									? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50'
									: 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
								}`}
							onClick={() => setActiveTab('practice')}
						>
							Luyện Tập Từng Phần
						</button>
						<button
							className={`px-6 py-2.5 rounded-xl text-[15px] font-bold transition-all ${activeTab === 'fulltest'
									? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50'
									: 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
								}`}
							onClick={() => setActiveTab('fulltest')}
						>
							Làm Full Test
						</button>
						<button
							className={`px-6 py-2.5 rounded-xl text-[15px] font-bold transition-all ${activeTab === 'discuss'
									? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50'
									: 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
								}`}
							onClick={() => setActiveTab('discuss')}
						>
							Thảo Luận ({examComments.length})
						</button>
					</div>
				</div>

				{/* 3. Main Content Area */}
				<div className='space-y-6'>

					{/* Banner: Bài thi dang dở */}
					{ongoingAttempt && (
						<div className='relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-md'>
							<div className='absolute -top-6 -right-6 w-28 h-28 bg-amber-300 rounded-full blur-[40px] opacity-40 pointer-events-none' />
							<div className='relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4'>
								<div className='flex items-center gap-3 flex-1'>
									<div className='p-2.5 bg-amber-100 border border-amber-200 rounded-xl shrink-0'>
										<History className='h-6 w-6 text-amber-600' />
									</div>
									<div>
										<p className='font-black text-amber-900 text-[15px]'>Bạn có bài thi chưa hoàn thành!</p>
										<p className='text-amber-700 text-xs font-medium mt-0.5'>
											Bắt đầu lúc {new Date(ongoingAttempt.startedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
										</p>
									</div>
								</div>
								<div className='flex items-center gap-2 shrink-0 flex-wrap'>
									<Button
										className='bg-amber-500 hover:bg-amber-600 text-white font-bold h-10 px-5 rounded-xl shadow-sm'
										onClick={() => router.push(`/test/do/${ongoingAttempt.id}`)}
									>
										<Play className='h-4 w-4 mr-1.5' /> Tiếp tục làm bài
									</Button>
									<Button
										variant='outline'
										className='border-amber-300 text-amber-700 hover:bg-amber-100 font-bold h-10 px-4 rounded-xl text-sm'
										onClick={handleSubmitOngoingAndStartNew}
										disabled={isSubmittingOld}
									>
										{isSubmittingOld ? 'Đang nộp...' : 'Nộp & Bắt đầu mới'}
									</Button>
								</div>
							</div>
						</div>
					)}

					{/* Pro Tips Alert */}
					{activeTab === 'practice' && (
						<div className='bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 text-green-800 text-sm'>
							<AlertCircle className='shrink-0 h-5 w-5 mt-0.5' />
							<p>
								<strong>Mẹo luyện tập:</strong> Hình thức luyện tập từng phần và chọn mức thời gian phù hợp sẽ giúp bạn
								tập trung vào giải đúng các câu hỏi thay vì phải chịu áp lực hoàn thành bài thi.
							</p>
						</div>
					)}

					{/* Practice Mode: Part Selection */}
					{activeTab === 'practice' && (
						<div className='space-y-6'>
							<div>
								<h3 className='text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2'>
									<Target className="w-6 h-6 text-blue-600" />
									Cấu trúc đề thi
								</h3>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
									{rootSections.map((section: any, index: number) => {
										const sectionTags = getTagsForSection(section.id);
										const questionCount = countQuestionsInSection(section.id);
										const isSelected = selectedSectionIds.includes(section.id);

										return (
											<Card
												key={section.id}
												className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 border-2 overflow-hidden relative group ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-md ring-4 ring-blue-500/10' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg'
													}`}
												onClick={() => toggleSection(section.id)}
											>
												{isSelected && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400 rounded-full blur-[40px] opacity-20 pointer-events-none"></div>}
												<CardContent className='p-6 relative z-10'>
													<div className='flex items-start gap-4'>
														<div className={`mt-0.5 rounded-full p-1 transition-colors ${isSelected ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-blue-50'}`}>
															{isSelected ? (
																<CheckCircle2 className='h-6 w-6 text-blue-600' />
															) : (
																<Circle className='h-6 w-6 text-slate-400 group-hover:text-blue-400' />
															)}
														</div>
														<div className='flex-1 space-y-3.5'>
															<div>
																<h4 className={`font-bold text-lg mb-1.5 transition-colors ${isSelected ? 'text-blue-900' : 'text-slate-800 group-hover:text-blue-700'}`}>
																	{getPartName(section, index)}
																</h4>
																<div className='flex items-center gap-4 text-sm font-semibold mb-2'>
																	<span className='flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60'>
																		<FileText className='h-4 w-4 text-slate-500' />
																		{questionCount} câu
																	</span>
																</div>
															</div>

															{sectionTags.length > 0 && (
																<div className='flex flex-wrap gap-1.5 pt-2 border-t border-slate-100'>
																	{sectionTags.slice(0, 3).map((tag: any) => (
																		<span key={tag?.id} className='text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm'>
																			#{tag?.name}
																		</span>
																	))}
																	{sectionTags.length > 3 && (
																		<span className='text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md'>
																			+{sectionTags.length - 3}
																		</span>
																	)}
																</div>
															)}
														</div>
													</div>
												</CardContent>
											</Card>
										);
									})}
								</div>
							</div>

							{/* Timer Selection */}
							<Card className='border-0 shadow-sm ring-1 ring-slate-200/60 bg-white rounded-2xl overflow-hidden'>
								<div className="h-1.5 w-full bg-gradient-to-r from-teal-400 to-emerald-500"></div>
								<CardHeader className="pb-4">
									<CardTitle className='text-xl flex items-center gap-2 text-slate-800'>
										<Clock className="w-5 h-5 text-emerald-500" />
										Áp Lực Thời Gian
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='space-y-3'>
										<label className='text-sm font-medium text-gray-700 block'>Giới hạn thời gian (tùy chọn)</label>
										<select
											className='w-full max-w-xs border border-gray-300 rounded-md p-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
											value={timer}
											onChange={(e) => setTimer(e.target.value)}
										>
											<option value=''>Không giới hạn thời gian</option>
											<option value='10'>10 phút</option>
											<option value='15'>15 phút</option>
											<option value='20'>20 phút</option>
											<option value='30'>30 phút</option>
											<option value='45'>45 phút</option>
											<option value='60'>60 phút</option>
										</select>
										<p className='text-xs text-gray-500'>Để trống nếu bạn muốn làm bài không giới hạn thời gian</p>
									</div>
								</CardContent>
							</Card>
						</div>
					)}

					{/* Full Test Mode */}
					{activeTab === 'fulltest' && (
						<div className='space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4'>
							<Card className='border-0 shadow-lg ring-1 ring-blue-500/20 bg-gradient-to-br from-blue-50 via-white to-indigo-50/50 rounded-2xl overflow-hidden relative'>
								<div className="absolute top-0 right-0 w-64 h-64 bg-blue-300 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
								<div className="h-1.5 w-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>

								<CardContent className='p-8 relative z-10'>
									<div className='flex flex-col md:flex-row items-center md:items-start gap-8'>
										<div className='bg-white shadow-md border border-blue-100 rounded-3xl p-6 flex-shrink-0 animate-bounce-slow'>
											<FileText className='h-12 w-12 text-blue-600' strokeWidth={1.5} />
										</div>
										<div className='flex-1 text-center md:text-left'>
											<h3 className='text-3xl font-black text-slate-800 mb-3 tracking-tight'>Mô Phỏng Kỳ Thi Thực Tế</h3>
											<p className='text-slate-600 mb-8 font-medium text-lg leading-relaxed'>
												Chuẩn bị tâm lý vững vàng nhất. Hệ thống sẽ khóa trình duyệt và đếm ngược thời gian nghiêm ngặt.
											</p>
											<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
												<div className='bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5'>
													<span className='text-slate-500 font-bold uppercase text-xs tracking-wider'>Tổng số phần thi</span>
													<span className='text-2xl font-black text-blue-700'>{rootSections.length}</span>
												</div>
												<div className='bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5'>
													<span className='text-slate-500 font-bold uppercase text-xs tracking-wider'>Tổng câu hỏi</span>
													<span className='text-2xl font-black text-rose-600'>{totalQuestions}</span>
												</div>
												<div className='bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5'>
													<span className='text-slate-500 font-bold uppercase text-xs tracking-wider'>Thời gian chuẩn</span>
													<span className='text-2xl font-black text-emerald-600'>{examData.duration}s</span>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					)}

					{/* Discuss Tab */}
					{activeTab === 'discuss' && (
						<div className="animate-in fade-in duration-500 slide-in-from-bottom-4 pb-12">
							<h3 className='font-black text-2xl mb-8 text-slate-800 flex items-center gap-2'>
								<MessageSquare className="w-6 h-6 text-blue-500" />
								Khu Vực Thảo Luận ({examComments.length} bình luận)
							</h3>

							<div className='bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-10'>
								<Textarea
									placeholder='Bạn cảm thấy đề thi này thế nào? Có mẹo nào hay không...'
									className='flex-1 min-h-[100px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl resize-none bg-slate-50'
									value={commentInput}
									onChange={(e) => setCommentInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) {
											e.preventDefault();
											handleCommentSubmit();
										}
									}}
								/>
								<div className='flex items-center justify-between gap-3 mt-4'>
									<div className='flex flex-wrap items-center gap-3'>
										<label className='text-sm font-bold text-slate-700'>Chấm độ khó:</label>
										<select
											value={examRating}
											onChange={(e) => setExamRating(e.target.value as Difficulty)}
											className='bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 shadow-sm'
										>
											<option value={Difficulty.Beginner}>Cơ bản</option>
											<option value={Difficulty.Intermediate}>Trung bình</option>
											<option value={Difficulty.Advanced}>Rất khó</option>
										</select>
									</div>
									<Button
										onClick={handleCommentSubmit}
										className='bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] transition-all transform hover:-translate-y-0.5'
										disabled={!commentInput.trim() || !currentUser}
									>
										Gửi
									</Button>
								</div>
							</div>

							<div className='space-y-6'>
								{examComments.length === 0 ? (
									<div className='text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300'>
										<MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
										<p className="text-slate-500 font-medium text-sm">Chưa có bình luận nào. Hãy khai màn đi bạn ơi!</p>
									</div>
								) : (
									examComments.map((comment) => {
										const commentUser = users.find((u) => u.id === comment.userId);
										return (
											<div key={comment.id} className='bg-white border border-slate-100 rounded-2xl p-5 shadow-sm'>
												<div className='flex items-start gap-4'>
													<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-lg border border-blue-200">
														{(commentUser?.fullName || 'U').charAt(0).toUpperCase()}
													</div>
													<div className='flex-1'>
														<div className='flex flex-col sm:flex-row sm:items-center gap-2 mb-2'>
															<span className='font-bold text-slate-800 text-[15px]'>
																{commentUser?.fullName || 'Người dùng ẩn danh'}
															</span>
															<Badge className={`${getDifficultyColor(comment.examRating)} px-2 py-0.5 shadow-sm`} variant='outline'>
																Đánh giá: {getDifficultyText(comment.examRating)}
															</Badge>
														</div>
														<p className='text-slate-600 whitespace-pre-wrap text-[15px] leading-relaxed'>{comment.content}</p>
													</div>
												</div>
											</div>
										);
									})
								)}
							</div>
						</div>
					)}

					{/* Start Button */}
					{activeTab !== 'discuss' && (
						<div className='flex flex-col sm:flex-row items-center gap-4 pt-10 pb-4 justify-center md:justify-start border-t border-slate-200/60 mt-8'>
							<Button
								onClick={handleStart}
								className={`relative overflow-hidden font-black text-white px-10 h-14 text-lg rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl ${(activeTab === 'practice' && selectedSectionIds.length === 0) || isStarting ? 'bg-slate-300 shadow-none hover:translate-y-0 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}
								disabled={(activeTab === 'practice' && selectedSectionIds.length === 0) || isStarting}
							>
								<span className="relative z-10 flex items-center">
									{isStarting ? (
										<><div className='w-5 h-5 mr-2.5 border-2 border-white border-t-transparent rounded-full animate-spin' /> Đang tạo bài thi...</>
									) : activeTab === 'fulltest' ? (
										<><FileText className='h-5 w-5 mr-2.5' /> VÀO THI NGAY</>
									) : (
										<><Play className='h-5 w-5 mr-2.5' /> BẮT ĐẦU LUYỆN TẬP</>
									)}
								</span>
							</Button>
							{activeTab === 'practice' && selectedSectionIds.length > 0 && (
								<div className='text-sm font-bold text-blue-600 bg-blue-100/50 px-4 py-2.5 rounded-xl border border-blue-200'>
									Đã chọn sẵn {selectedSectionIds.length} phần thi
								</div>
							)}
							{startError && (
								<div className='flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl'>
									<AlertCircle className='h-4 w-4 shrink-0' />
									{startError}
								</div>
							)}
						</div>
					)}

					{/* Dialog fallback: Attempt cũ chưa nộp (khi 499 nhưng history chưa fetch kịp) */}
					{pendingAttemptDialog.open && (
						<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4'>
							<div className='bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-amber-200 relative overflow-hidden'>
								<div className='absolute top-0 right-0 w-40 h-40 bg-amber-300 rounded-full blur-[50px] opacity-30 pointer-events-none' />
								<div className='relative z-10'>
									<div className='flex items-center gap-3 mb-4'>
										<div className='p-2.5 bg-amber-100 rounded-2xl'>
											<AlertCircle className='h-7 w-7 text-amber-600' />
										</div>
										<div>
											<h3 className='text-xl font-black text-slate-900'>Bài thi chưa hoàn thành</h3>
											<p className='text-sm text-slate-500 font-medium'>Bạn còn một bài thi đang dang dở</p>
										</div>
									</div>
									<p className='text-slate-600 mb-8 leading-relaxed text-[15px]'>
										Bạn có một lần thi trước chưa được nộp. Bạn muốn <strong>tiếp tục</strong> bài đó, hay <strong>nộp bài cũ và bắt đầu lại</strong>?
									</p>
									<div className='flex flex-col sm:flex-row gap-3'>
										{pendingAttemptDialog.attemptId && (
											<Button
												className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-2xl shadow-md'
												onClick={() => {
													setPendingAttemptDialog({ open: false, attemptId: null });
													router.push(`/test/do/${pendingAttemptDialog.attemptId}`);
												}}
											>
												<Play className='h-4 w-4 mr-2' /> Tiếp tục bài cũ
											</Button>
										)}
										<Button
											variant='outline'
											className='flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold h-12 rounded-2xl'
											onClick={handleSubmitOldAndStartNew}
										>
											Nộp bài cũ & Tạo bài mới
										</Button>
										<Button
											variant='ghost'
											className='sm:w-auto text-slate-500 font-bold h-12 rounded-2xl'
											onClick={() => setPendingAttemptDialog({ open: false, attemptId: null })}
										>
											Hủy
										</Button>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* 4. Comments Section (khi không ở tab discuss) */}
				{activeTab !== 'discuss' && (
					<div className='pt-12 mt-12 border-t border-slate-200/60'>
						<h3 className='font-black text-2xl mb-8 text-slate-800 flex items-center gap-2'>
							<MessageSquare className="w-6 h-6 text-blue-500" />
							Bình luận & Thảo luận
						</h3>

						<div className='bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-10'>
							<Textarea
								placeholder='Bạn cảm thấy đề thi này thế nào? Có mẹo nào hay không...'
								className='flex-1 min-h-[100px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl resize-none bg-slate-50'
								value={commentInput}
								onChange={(e) => setCommentInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault();
										handleCommentSubmit();
									}
								}}
							/>
							<div className='flex items-center justify-between gap-3 mt-4'>
								<div className='flex flex-wrap items-center gap-3'>
									<label className='text-sm font-bold text-slate-700'>Chấm độ khó:</label>
									<select
										value={examRating}
										onChange={(e) => setExamRating(e.target.value as Difficulty)}
										className='bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 shadow-sm'
									>
										<option value={Difficulty.Beginner}>Cơ bản</option>
										<option value={Difficulty.Intermediate}>Trung bình</option>
										<option value={Difficulty.Advanced}>Rất khó</option>
									</select>
								</div>
								<Button
									onClick={handleCommentSubmit}
									className='bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] transition-all transform hover:-translate-y-0.5'
									disabled={!commentInput.trim() || !currentUser}
								>
									Gửi
								</Button>
							</div>
						</div>

						<div className='space-y-6'>
							{examComments.length === 0 ? (
								<div className='text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300'>
									<MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
									<p className="text-slate-500 font-medium text-sm">Chưa có bình luận nào. Hãy khai màn đi bạn ơi!</p>
								</div>
							) : (
								examComments.slice(0, 3).map((comment) => {
									const commentUser = users.find((u) => u.id === comment.userId);
									return (
										<div key={comment.id} className='bg-white border border-slate-100 rounded-2xl p-5 shadow-sm'>
											<div className='flex items-start gap-4'>
												<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-lg border border-blue-200">
													{(commentUser?.fullName || 'U').charAt(0).toUpperCase()}
												</div>
												<div className='flex-1'>
													<div className='flex flex-col sm:flex-row sm:items-center gap-2 mb-2'>
														<span className='font-bold text-slate-800 text-[15px]'>
															{commentUser?.fullName || 'Người dùng ẩn danh'}
														</span>
														<Badge className={`${getDifficultyColor(comment.examRating)} px-2 py-0.5 shadow-sm`} variant='outline'>
															Đánh giá: {getDifficultyText(comment.examRating)}
														</Badge>
													</div>
													<p className='text-slate-600 whitespace-pre-wrap text-[15px] leading-relaxed'>{comment.content}</p>
												</div>
											</div>
										</div>
									);
								})
							)}
							{examComments.length > 3 && (
								<div className='text-center pt-6'>
									<Button
										variant='outline'
										onClick={() => setActiveTab('discuss')}
										className='text-blue-700 border-blue-200 hover:bg-blue-50 font-bold px-8 rounded-xl h-12'
									>
										Xem tất cả {examComments.length} bình luận
									</Button>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
