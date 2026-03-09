'use client';

import React, { useMemo, useState } from 'react';
import { Section, TestType, Skill, Difficulty, Comment } from '../types/client';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useParams, useRouter } from 'next/navigation';
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
} from 'lucide-react';

export function ExamDetailPage() {
	const { id } = useParams();
	const router = useRouter();
	const dispatch = useAppDispatch();
	if (!id) return <div>Invalid Exam ID</div>;

	const examId = id;
	const exams = useAppSelector((state) => state.exams.list);
	const sections = useAppSelector((state) => state.sections.list);
	const questions = useAppSelector((state) => state.questions.list);
	const attempts = useAppSelector((state) => state.attempts.list);
	const tags = useAppSelector((state) => state.tags.list);
	const comments = useAppSelector((state) => state.comments.list);
	const currentUser = useAppSelector((state) => state.currUser.current);
	const users = useAppSelector((state) => state.users.list);

	const exam = exams.find((e) => e.id === examId);

	// --- Logic xử lý dữ liệu ---
	// Lấy danh sách các phần thi chính (các section có parentId là examId)
	const rootSections = useMemo(() => sections.filter((sec) => sec.parentId === examId), [examId, sections]);

	// Helper: đệ quy lấy tất cả child sections
	const getAllChildSections = (parentId: string): Section[] => {
		const children = sections.filter((sec) => sec.parentId === parentId);
		let all: Section[] = [];
		for (const child of children) {
			all.push(child);
			all = all.concat(getAllChildSections(child.id));
		}
		return all;
	};

	// Đếm số câu hỏi trong một section (bao gồm cả nested sections)
	const countQuestionsInSection = (sectionId: string): number => {
		const allSections = [sectionId, ...getAllChildSections(sectionId).map((s) => s.id)];
		return questions.filter((q) => allSections.includes(q.sectionId)).length;
	};

	// Helper lấy tags cho một section cụ thể
	const getTagsForSection = (sectionId: string) => {
		const allSections = [sectionId, ...getAllChildSections(sectionId).map((s) => s.id)];
		const sectionQuestions = questions.filter((q) => allSections.includes(q.sectionId));
		const tagIds = new Set<string>();
		sectionQuestions.forEach((q) => q.tagIds.forEach((t) => tagIds.add(t)));
		return Array.from(tagIds)
			.map((tid) => tags.find((t) => t.id === tid))
			.filter(Boolean);
	};

	// Tổng số câu hỏi trong exam
	const totalQuestions = useMemo(() => {
		const allExamSections = rootSections.flatMap((s) => [s.id, ...getAllChildSections(s.id).map((sec) => sec.id)]);
		return questions.filter((q) => allExamSections.includes(q.sectionId)).length;
	}, [rootSections, questions, sections]);

	// Tổng quan số liệu
	const examAttempts = useMemo(() => attempts.filter((a) => a.examId === examId).length, [attempts, examId]);

	// --- State quản lý UI ---
	const [activeTab, setActiveTab] = useState<'practice' | 'fulltest' | 'discuss'>('practice');
	const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
	const [timer, setTimer] = useState<string>(''); // Để trống là không giới hạn
	const [commentInput, setCommentInput] = useState<string>('');
	const [examRating, setExamRating] = useState<Difficulty>(Difficulty.Intermediate);

	// --- Handlers ---
	const toggleSection = (secId: string) => {
		setSelectedSectionIds((prev) => (prev.includes(secId) ? prev.filter((id) => id !== secId) : [...prev, secId]));
	};

	const handleStart = () => {
		if (!exam) return;

		const sectionsToUse = activeTab === 'fulltest' ? rootSections.map((s) => s.id) : selectedSectionIds;
		const timerValue = activeTab === 'fulltest' ? exam.duration : timer ? parseInt(timer) : null;

		console.log('Start exam:', {
			mode: activeTab,
			sections: sectionsToUse,
			timer: timerValue,
		});

		// Navigate to test interface
		// Store state in sessionStorage since Next.js doesn't support state in router.push
		sessionStorage.setItem('testState', JSON.stringify({ sections: sectionsToUse, timer: timerValue }));
		router.push(`/test/do/${examId}`);
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

		// Switch to discuss tab to show the comment
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

	const getPartName = (section: Section, index: number) => {
		// Nếu section có title trong direction hoặc có thể tạo từ id
		// Tạm thời dùng format Part {index + 1}
		return `Part ${index + 1}`;
	};

	if (!exam) return <div className='p-6 text-center text-gray-500'>Không tìm thấy đề thi</div>;

	const SkillIcon = getSkillIcon(exam.skill);

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
										{getTestTypeLabel(exam.testType)}
									</Badge>
									<Badge variant='outline' className='bg-white/20 backdrop-blur-md text-white border-white/30 px-3 py-1 font-bold text-sm shadow-sm'>
										<SkillIcon className='h-4 w-4 mr-1.5' />
										{exam.skill.charAt(0).toUpperCase() + exam.skill.slice(1)}
									</Badge>
									<Badge className={`px-3 py-1 font-bold text-sm uppercase tracking-wide border bg-white/10 backdrop-blur-md shadow-sm ${exam.difficulty === Difficulty.Beginner ? 'text-green-300 border-green-300/50' : exam.difficulty === Difficulty.Intermediate ? 'text-yellow-300 border-yellow-300/50' : 'text-red-300 border-red-300/50'}`}>
										{getDifficultyText(exam.difficulty)}
									</Badge>
								</div>
								<h1 className='text-4xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight'>{exam.title}</h1>
								<p className='text-blue-100 text-lg md:text-xl font-medium max-w-3xl leading-relaxed opacity-90'>{exam.description}</p>
							</div>
						</div>

						<div className='flex items-center gap-6 text-sm flex-wrap text-blue-50 pt-2'>
							<div className='flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner'>
								<Clock className='h-5 w-5 text-blue-200' />
								<span className="font-semibold text-base">{exam.duration} phút</span>
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
									{rootSections.map((section, index) => {
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
																	<Badge className={`px-2.5 py-1 ${getDifficultyColor(section.difficulty)}`} variant='outline'>
																		{getDifficultyText(section.difficulty)}
																	</Badge>
																</div>
															</div>

															{sectionTags.length > 0 && (
																<div className='flex flex-wrap gap-1.5 pt-2 border-t border-slate-100'>
																	{sectionTags.slice(0, 3).map((tag) => (
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
													<span className='text-2xl font-black text-emerald-600'>{exam.duration}'</span>
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
							
							{/* Nhập bình luận */}
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
								className={`relative overflow-hidden font-black text-white px-10 h-14 text-lg rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl ${activeTab === 'practice' && selectedSectionIds.length === 0 ? 'bg-slate-300 shadow-none hover:translate-y-0 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}
								disabled={activeTab === 'practice' && selectedSectionIds.length === 0}
							>
								<span className="relative z-10 flex items-center">
									{activeTab === 'fulltest' ? (
										<>
											<FileText className='h-5 w-5 mr-2.5' /> VÀO THI NGAY
										</>
									) : (
										<>
											<Play className='h-5 w-5 mr-2.5' /> BẮT ĐẦU LUYỆN TẬP
										</>
									)}
								</span>
							</Button>
							{activeTab === 'practice' && selectedSectionIds.length > 0 && (
								<div className='text-sm font-bold text-blue-600 bg-blue-100/50 px-4 py-2.5 rounded-xl border border-blue-200'>
									Đã chọn sẵn {selectedSectionIds.length} phần thi
								</div>
							)}
						</div>
					)}
			</div>

			{/* 4. Comments Section */}
			{activeTab !== 'discuss' && (
						<div className='pt-12 mt-12 border-t border-slate-200/60'>
							<h3 className='font-black text-2xl mb-8 text-slate-800 flex items-center gap-2'>
								<MessageSquare className="w-6 h-6 text-blue-500" />
								Bình luận & Thảo luận
							</h3>

							{/* Nhập bình luận */}
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
