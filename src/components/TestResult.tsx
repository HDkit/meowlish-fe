'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';
import { Button } from './ui/button';
import { Question, Attempt, Section } from '../types/client';
import { AICard, QuestionCard } from './QuestionCard';

export function TestResult() {
	const { id } = useParams(); // Đây là attemptId
	const router = useRouter();

	// 1. Lấy dữ liệu từ Redux Store
	const attempts = useAppSelector((state) => state.attempts.list);
	const questions = useAppSelector((state) => state.questions.list);
	const exams = useAppSelector((state) => state.exams.list);
	const sections = useAppSelector((state) => state.sections.list);

	const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);

	// 2. Tìm Attempt hiện tại dựa trên ID URL
	useEffect(() => {
		if (id) {
			const found = attempts.find((a) => a.id === id);
			if (found) setCurrentAttempt(found);
		}
	}, [id, attempts]);

	// 3. Logic tái tạo lại đề thi (Lấy tất cả câu hỏi thuộc Exam này)
	// Phải dùng useMemo để tính toán lại danh sách câu hỏi chuẩn của đề thi
	const examQuestions = useMemo(() => {
		if (!currentAttempt) return [];

		// Hàm đệ quy tìm tất cả section con của examId
		const collectSections = (rootId: string): Section[] => {
			const result: Section[] = [];
			const walk = (pid: string) => {
				const children = sections.filter((s) => s.parentId === pid);
				for (const c of children) {
					result.push(c);
					walk(c.id);
				}
			};
			walk(rootId);
			return result;
		};

		// Tìm tất cả section của Exam
		const examSections = collectSections(currentAttempt.examId);
		const sectionIds = new Set(examSections.map((s) => s.id));

		// Lọc ra các câu hỏi thuộc các section đó
		// Đây chính là bộ câu hỏi gốc từ questionSlice
		return questions.filter((q) => sectionIds.has(q.sectionId));
	}, [currentAttempt, sections, questions]);

	// Loading state
	if (!currentAttempt) {
		return <div className='p-10 text-center'>Đang tải kết quả...</div>;
	}

	const examInfo = exams.find((e) => e.id === currentAttempt.examId);

	// Tính thời gian đã làm
	const totalTime = (examInfo?.duration || 0) * 60;
	const timeTaken = totalTime - currentAttempt.timeLeft;
	const minutes = Math.floor(timeTaken / 60);
	const seconds = timeTaken % 60;

	// 4. Hàm kiểm tra đúng sai (Logic hiển thị màu sắc)
	const checkAnswerStatus = (q: Question, userAnswer: string) => {
		if (!userAnswer) return 'skipped'; // Chưa làm
		if (!q.correctAnswer || q.correctAnswer.length === 0) return 'manual'; // Câu hỏi tự luận/speaking

		let isCorrect = false;

		if (q.type === 'multiple-correct-answers') {
			const u = userAnswer.split(',').filter(Boolean).sort().join(',');
			const c = [...q.correctAnswer].sort().join(',');
			isCorrect = u === c;
		} else {
			// Multiple choice / Fill blank
			isCorrect = q.correctAnswer.includes(userAnswer);
		}

		return isCorrect ? 'correct' : 'incorrect';
	};

	return (
		<div className='min-h-screen bg-gray-50 p-8 p-4'>
			<div className='max-w-4xl mx-auto space-y-8'>
				{/* --- PHẦN 1: TỔNG KẾT --- */}
				<div className='bg-white rounded-xl shadow-md p-8 text-center border border-gray-200 p-4'>
					<h1 className='text-3xl font-bold text-gray-800 mb-2'>Kết quả làm bài {examInfo?.title}</h1>

					<div className='flex justify-center gap-12 mb-8'>
						<div className='text-center p-4'>
							<div className='text-sm text-gray-500 uppercase font-semibold tracking-wider'>Tổng điểm</div>
							<div className='text-6xl font-extrabold text-blue-600 mt-2'>
								{currentAttempt.score !== undefined ? currentAttempt.score.toFixed(1) : 0}
								<span className='text-xl text-gray-400 font-normal ml-1'>/ 100</span>
							</div>
						</div>

						<div className='text-center border-l pl-12 border-gray-200 p-4'>
							<div className='text-sm text-gray-500 uppercase font-semibold tracking-wider'>Thời gian làm bài</div>
							<div className='text-6xl font-extrabold text-gray-700 mt-2'>
								{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
							</div>
						</div>
					</div>

					<div className='flex justify-center gap-4'>
					<Button onClick={() => router.push('/')} variant='outline' className='px-6'>
						Quay về trang chủ
					</Button>

					{/* QUAN TRỌNG: Gửi state { retake: true } để TestInterface reset timer */}
					<Button
						onClick={() => {
							// Store retake flag in sessionStorage since Next.js doesn't support state in router.push
							sessionStorage.setItem('testState', JSON.stringify({ retake: true }));
							router.push(`/test/${currentAttempt.examId}`);
						}}
						className='px-6 bg-blue-600 hover:bg-blue-700 !text-white'
						>
							Làm lại bài kiểm tra
						</Button>
					</div>
				</div>

				{/* --- PHẦN 2: CHI TIẾT TỪNG CÂU --- */}
				<div className='space-y-6'>
					<h2 className='text-2xl font-bold text-gray-800 border-b pb-2'>Kết quả chi tiết</h2>

					{examQuestions.map((q, index) => {
						// Lấy câu trả lời của user từ attempt
						const userChoice = currentAttempt.choices.find((c) => c.questionId === q.id);
						const userAnswer = userChoice?.answerIdx || '';
						const status = checkAnswerStatus(q, userAnswer);

						// Xác định màu sắc dựa trên trạng thái
						let borderClass = 'border-gray-200';
						let bgHeaderClass = 'bg-gray-50';
						let statusText = 'Bỏ qua';
						let statusColor = 'text-gray-500';

						if (status === 'correct') {
							borderClass = 'border-green-500';
							bgHeaderClass = 'bg-green-50';
							statusText = 'Chính xác';
							statusColor = 'text-green-700';
						} else if (status === 'incorrect') {
							borderClass = 'border-red-500';
							bgHeaderClass = 'bg-red-50';
							statusText = 'Không chính xác';
							statusColor = 'text-red-700';
						}

						return (
							<div key={q.id} className={`bg-white rounded-lg border-l-8 shadow-sm overflow-hidden ${borderClass}`}>
								<div className={`px-6 py-4 flex justify-between items-start ${bgHeaderClass}`}>
									<div>
										<span className='font-bold text-gray-700 mr-2'>Câu {index + 1}:</span>
										<span
											className={`font-bold uppercase text-sm px-2 py-1 rounded ${
												status === 'correct' ? 'bg-green-200' : status === 'incorrect' ? 'bg-red-200' : 'bg-gray-200'
											} ${statusColor}`}
										>
										{statusText}
									</span>
								</div>
								<span className='text-sm text-gray-500 font-medium'>{q.points} Điểm</span>
								<AICard q={q}></AICard>
								</div>

								<div className='p-6'>
									<p className='text-gray-800 text-lg mb-4 font-medium'>{q.content}</p>

									<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								{/* Đáp án của User */}
								<div className='bg-gray-50 p-4 rounded-md border'>
									<p className='text-xs text-gray-500 uppercase font-bold mb-1'>Câu trả lời của bạn</p>
											<p
												className={`font-medium ${
													status === 'correct'
														? 'text-green-700'
														: status === 'incorrect'
														? 'text-red-600'
														: 'text-gray-400 italic'
												}`}
											>
												{userAnswer || '(No answer)'}
											</p>
										</div>

										{/* Đáp án đúng (Chỉ hiện nếu user sai hoặc bỏ qua) */}
										<QuestionCard q={q} status={status}></QuestionCard>
									</div>

								{/* Hiển thị Options nếu là trắc nghiệm để dễ đối chiếu */}
								{q.options && (
									<div className='mt-4 pt-4 border-t text-sm text-gray-500'>
										<p className='mb-2 font-semibold'>Các lựa chọn:</p>
											<ul className='list-disc pl-5 space-y-1'>
												{q.options.map((op, i) => (
													<li key={i} className={op === userAnswer ? 'font-bold text-gray-800' : ''}>
														{op}
													</li>
												))}
											</ul>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
