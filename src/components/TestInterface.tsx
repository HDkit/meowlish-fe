'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Question, Section, Attempt } from '../types/client';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { useParams, useRouter } from 'next/navigation';
import { addAttempt, updateAttempt } from './store/attemptSlice';
import { TextHighlighter } from './TextHighlighter';
import { Clock, Send, Lightbulb } from 'lucide-react';

/**
 * TestInterface - The main component for the test interface page.
 * 
 * Provides a grid of questions with answer options and a tracker for the user's progress.
 * 
 * The component also includes a timer and a submit button to submit the test.
 * 
 * @param {Object} props - The props object passed to the component.
 * @param {string} id - The ID of the exam to be taken.
 * @param {string} currentQuestionId - The ID of the currently selected question.
 * @param {number} timeLeft - The number of seconds left in the test.
 * @param {Function} handleSubmit - The function to call when the user submits the test.
 * @param {Function} scrollToQuestion - The function to call when the user clicks on a question.
 */
export function TestInterface() {
	const params = useParams();
	const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
	const router = useRouter();
	const dispatch = useAppDispatch();

	// --- REDUX SELECTORS ---a
	const allExams = useAppSelector((state) => state.exams.list);
	const allSections = useAppSelector((state) => state.sections.list);
	const allQuestions = useAppSelector((state) => state.questions.list);
	const allAttempts = useAppSelector((state) => state.attempts.list);
	const currentUser = useAppSelector((state) => state.currUser.current);

	// --- LOCAL STATE ---
	const [sections, setSections] = useState<Section[]>([]);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);

	const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
	const [timeLeft, setTimeLeft] = useState(0);

	const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
	const [currentSectionAncestors, setCurrentSectionAncestors] = useState<Section[]>([]);

	// State Resizer
	const [leftWidth, setLeftWidth] = useState(45);
	const [isResizing, setIsResizing] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// State Highlight Mode
	const [highlightEnabled, setHighlightEnabled] = useState(true);

	// --- REFS ---
	const currentAttemptRef = useRef<Attempt | null>(null);
	const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const isSubmittingRef = useRef(false);
	const lastSavedTimeRef = useRef<number>(0);
	const orderedQuestionsRef = useRef<Question[]>([]);

	useEffect(() => {
		currentAttemptRef.current = currentAttempt;
	}, [currentAttempt]);

	useEffect(() => {
		orderedQuestionsRef.current = orderedQuestions;
	}, [orderedQuestions]);

	// --- 1. DATA LOGIC ---
	useEffect(() => {
		const collectSections = (rootId: string, all: Section[]): Section[] => {
			const result: Section[] = [];
			const walk = (pid: string) => {
				const children = all.filter((s) => s.parentId === pid);
				for (const c of children) {
					result.push(c);
					walk(c.id);
				}
			};
			walk(rootId);
			return result;
		};

		if (!id) return;
		const nestedSections = collectSections(id, allSections);
		setSections(nestedSections);
		const secIds = new Set(nestedSections.map((s) => s.id));
		setQuestions(allQuestions.filter((q) => secIds.has(q.sectionId)));
	}, [id, allSections, allQuestions]);

	const buildOrderedQuestions = useCallback(() => {
		const map: Record<string, Section[]> = {};
		sections.forEach((s) => {
			if (!map[s.parentId]) map[s.parentId] = [];
			map[s.parentId].push(s);
		});

		const orderSections = (pid: string): string[] => {
			let res: string[] = [];
			for (const s of map[pid] || []) {
				res.push(s.id);
				res = res.concat(orderSections(s.id));
			}
			return res;
		};

		const orderedSectionIds = orderSections(id!);
		const finalQuestions: Question[] = [];
		for (const sid of orderedSectionIds) {
			finalQuestions.push(...questions.filter((q) => q.sectionId === sid));
		}
		return finalQuestions;
	}, [sections, questions, id]);

	useEffect(() => {
		setOrderedQuestions(buildOrderedQuestions());
	}, [buildOrderedQuestions]);

	// --- 2. INITIALIZATION ---
	useEffect(() => {
		if (!id || !currentUser) return;
		if (currentAttempt) return;

		isSubmittingRef.current = false;
		if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

		// Read state from sessionStorage (set in TestDetail.tsx)
		const testState = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('testState') || '{}') : {};
		const isRetake = testState.retake;
		const { timer } = testState;

		let attemptToLoad: Attempt | undefined;

		if (!isRetake) {
			attemptToLoad = allAttempts.find(
				(a) => a.examId === id && a.userId === currentUser.id && typeof a.score === 'undefined'
			);
		}

		if (attemptToLoad) {
			setCurrentAttempt(attemptToLoad);
			setTimeLeft(attemptToLoad.timeLeft);
			lastSavedTimeRef.current = attemptToLoad.timeLeft;
		} else {
			const exam = allExams.find((e) => e.id === id);
			if (!exam) return;

			const durationSec = (timer || exam.duration) * 60;
			const newAttempt: Attempt = {
				id: 'attempt_' + Date.now(),
				userId: currentUser.id,
				examId: id,
				startTime: Date.now(),
				timeLeft: durationSec,
				isPaused: false,
				score: undefined,
				choices: [],
			};

			lastSavedTimeRef.current = durationSec;
			dispatch(addAttempt(newAttempt));
			setCurrentAttempt(newAttempt);
			setTimeLeft(durationSec);

			if (orderedQuestions.length > 0) {
				setCurrentQuestionId(orderedQuestions[0].id);
			}
		}
	}, [id, currentUser, allAttempts, allExams, dispatch, currentAttempt, orderedQuestions]);

	// --- 3. HANDLERS (moved before timer to avoid closure issues) ---
	const performSubmit = useCallback((isAuto: boolean) => {
		if (isSubmittingRef.current) return;
		const finalAttempt = currentAttemptRef.current;
		if (!finalAttempt) return;

		isSubmittingRef.current = true;
		if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

		let correctCount = 0;
		let totalPoints = 0;
		const questions = orderedQuestionsRef.current;
		questions.forEach((q) => {
			totalPoints += q.points;
			const userChoice = finalAttempt.choices.find((c) => c.questionId === q.id);
			const userAnswer = userChoice?.answerIdx || '';
			if (q.correctAnswer && q.correctAnswer.length > 0) {
				if (q.type === 'multiple-correct-answers') {
					const userArr = userAnswer.split(',').filter(Boolean).sort();
					const correctArr = [...q.correctAnswer].sort();
					if (JSON.stringify(userArr) === JSON.stringify(correctArr)) correctCount += q.points;
				} else {
					if (q.correctAnswer.includes(userAnswer)) correctCount += q.points;
				}
			}
		});

		const finalScore = totalPoints > 0 ? (correctCount / totalPoints) * 100 : 0;
		// Use lastSavedTimeRef instead of timeLeft state to avoid stale closure
		const completedAttempt: Attempt = {
			...finalAttempt,
			timeLeft: isAuto ? 0 : lastSavedTimeRef.current,
			score: finalScore,
		};
		dispatch(updateAttempt(completedAttempt));
		router.push(`/results/${completedAttempt.id}`);
	}, [dispatch, router]);

	const handleAutoSubmit = useCallback(() => performSubmit(true), [performSubmit]);
	const handleSubmit = useCallback(() => performSubmit(false), [performSubmit]);

	// --- 4. TIMER ---
	useEffect(() => {
		if (!currentAttempt && !currentAttemptRef.current) return;
		if (isSubmittingRef.current) return;
		if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

		timerIntervalRef.current = setInterval(() => {
			setTimeLeft((prevTime) => {
				if (prevTime <= 0) {
					if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
					if (!isSubmittingRef.current) handleAutoSubmit();
					return 0;
				}
				const newTime = prevTime - 1;
				// Update ref immediately
				lastSavedTimeRef.current = newTime;

				// Save to Redux every 5 seconds
				if (newTime % 5 === 0) {
					const latestState = currentAttemptRef.current;
					if (latestState && typeof latestState.score === 'undefined') {
						const updatedAttempt = { ...latestState, timeLeft: newTime };
						dispatch(updateAttempt(updatedAttempt));
						// Update the ref to keep in sync
						setCurrentAttempt(updatedAttempt);
					}
				}
				return newTime;
			});
		}, 1000);

		return () => {
			if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
		};
	}, [dispatch, currentAttempt?.id, handleAutoSubmit]);

	// --- 5. ANSWER HANDLERS ---
	const handleAnswerChange = useCallback(
		(questionId: string, answer: string) => {
			setCurrentAttempt((prev) => {
				if (!prev) return null;
				const updatedChoices = [...prev.choices];
				const idx = updatedChoices.findIndex((c) => c.questionId === questionId);
				if (idx >= 0) updatedChoices[idx] = { ...updatedChoices[idx], answerIdx: answer };
				else updatedChoices.push({ questionId, answerIdx: answer });

				const newAttempt = { ...prev, choices: updatedChoices };
				dispatch(updateAttempt(newAttempt));
				return newAttempt;
			});
		},
		[dispatch]
	);

	const getCurrentAnswer = useCallback(
		(qId: string) => {
			const attempt = currentAttempt || currentAttemptRef.current;
			return attempt?.choices.find((c) => c.questionId === qId)?.answerIdx || '';
		},
		[currentAttempt]
	);

	const scrollToQuestion = useCallback((qId: string) => {
		setCurrentQuestionId(qId);
		const element = document.getElementById(`question-${qId}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}, []);

	const getAncestors = useCallback(
		(pId: string): Section[] => {
			const ancestors: Section[] = [];
			let current = sections.find((s) => s.id === pId);
			while (current) {
				ancestors.unshift(current);
				current = sections.find((s) => s.id === current?.parentId);
			}
			return ancestors;
		},
		[sections]
	);

	useEffect(() => {
		if (!currentQuestionId && orderedQuestions.length > 0) {
			if (!currentQuestionId) setCurrentQuestionId(orderedQuestions[0].id);
		}
		if (currentQuestionId) {
			const q = questions.find((item) => item.id === currentQuestionId);
			if (q) setCurrentSectionAncestors(getAncestors(q.sectionId));
		}
	}, [currentQuestionId, questions, getAncestors, orderedQuestions]);

	// --- RESIZER LOGIC ---
	const startResizing = useCallback(() => setIsResizing(true), []);
	const stopResizing = useCallback(() => setIsResizing(false), []);
	const resize = useCallback(
		(e: MouseEvent) => {
			if (isResizing && containerRef.current) {
				const trackerWidth = 340;
				const containerWidth = containerRef.current.clientWidth - trackerWidth;
				const newLeftWidth = (e.clientX / containerWidth) * 100;
				if (newLeftWidth > 20 && newLeftWidth < 80) setLeftWidth(newLeftWidth);
			}
		},
		[isResizing]
	);

	useEffect(() => {
		window.addEventListener('mousemove', resize);
		window.addEventListener('mouseup', stopResizing);
		return () => {
			window.removeEventListener('mousemove', resize);
			window.removeEventListener('mouseup', stopResizing);
		};
	}, [resize, stopResizing]);

	// --- RENDER ---
	return (
		<div className='inset-0 flex flex-row bg-slate-50 font-sans overflow-hidden p-4 gap-4' ref={containerRef}>
			{/* --- KHỐI 1: PASSAGE (TRÁI) --- */}
			<div
				style={{ width: `${leftWidth}%` }}
				className='h-full flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 shrink-0'
			>
				{/* Passage Header */}
				<div className='h-14 border-b bg-white flex items-center justify-between px-5 shrink-0 sticky top-0 z-10 shadow-sm'>
					{/* Hiển thị tiêu đề Section hiện tại */}

					<div className='flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full'>
						<Lightbulb className="w-4 h-4 text-yellow-500" />
						<span className='text-xs font-bold uppercase tracking-wider text-slate-600'>Highlight mode</span>
						<button
							onClick={() => setHighlightEnabled(!highlightEnabled)}
							className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors duration-200 ${highlightEnabled ? 'bg-blue-600' : 'bg-gray-300'
								}`}
						>
							<div
								className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${highlightEnabled ? 'right-0.5' : 'left-0.5'
									}`}
							></div>
						</button>
					</div>
				</div>

				{/* Passage Content with Text Highlighter */}
				<div className='flex-1 overflow-y-auto p-6 scroll-smooth'>
					{currentSectionAncestors.map((section) => {
						if (!section.direction) return null;

						// Tách dòng đầu tiên làm tiêu đề lớn (nếu có)
						const lines = section.direction.split('\n');
						const title = lines[0];
						const content = lines.slice(1).join('\n');

						const handleNewWord = (word: string) => {
							// Here you can implement the logic to add the word to the "Từ mới" form
							console.log('New word to add to flashcard:', word);
							// You can update your state or call a function to show the flashcard creation form
						};

						return (
							<div key={section.id} className='mb-10'>
								{/* Title - Hiển thị to, đậm giống ảnh mẫu */}
								<h2 className='text-2xl font-extrabold text-slate-800 mb-5 leading-tight'>{title}</h2>
								{/* Nội dung bài đọc với chức năng highlight */}
								<div className='text-gray-800 leading-7 text-justify font-serif text-lg'>
									<TextHighlighter
										text={content}
										onNewWord={handleNewWord}
										highlightEnabled={highlightEnabled}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* RESIZER HANDLE */}
			<div
				className='w-1 hover:bg-blue-400 cursor-col-resize z-30 transition-colors flex items-center justify-center shrink-0 rounded opacity-50'
				onMouseDown={startResizing}
			>
				<div className='h-8 w-1 bg-gray-400 rounded-full'></div>
			</div>

			{/* --- KHỐI 2: QUESTIONS (GIỮA) --- */}
			<div className='flex-1 h-full flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200'>
				{/* Questions Header */}
				<div className='h-14 border-b bg-white px-5 flex items-center shrink-0 justify-between sticky top-0 z-10 shadow-sm'>
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
						<h2 className='text-sm font-extrabold text-slate-700 uppercase tracking-widest'>Nội dung câu hỏi</h2>
					</div>
				</div>

				{/* Questions Content */}
				<div className='flex-1 overflow-y-auto p-6 bg-white'>
					<div className='space-y-6'>
						{orderedQuestions
							.filter((q) => {
								const currentActive = questions.find((item) => item.id === currentQuestionId);
								return q.sectionId === currentActive?.sectionId;
							})
							.map((q) => {
								return (
									<div
										key={q.id}
										id={`question-${q.id}`}
										className={`flex gap-5 p-6 rounded-xl transition-all border border-transparent hover:border-blue-100 hover:bg-slate-50/50 ${q.id === currentQuestionId ? 'bg-blue-50/30 border-blue-200 shadow-sm ring-1 ring-blue-500/20' : ''}`}
										onClick={() => setCurrentQuestionId(q.id)}
									>
										{/* Số thứ tự câu hỏi */}
										<div
											className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${q.id === currentQuestionId ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0' : 'bg-white border border-slate-200 text-slate-600'
												}`}
										>
											{orderedQuestions.indexOf(q) + 1}
										</div>

										<div className='flex-1'>
											{/* Nội dung câu hỏi */}
											<p className='text-slate-800 font-semibold mb-4 text-[1.05rem] leading-relaxed'>{q.content}</p>

											<div className='mt-2'>
												{/* --- 1. MULTIPLE CHOICE (Dạng A, B, C, D) --- */}
												{q.type === 'multiple-choice' && q.options && (
													<div className='flex flex-col gap-3'>
														{q.options.map((op, idx) => {
															const charLabel = String.fromCharCode(65 + idx); // A, B, C...
															const isSelected = getCurrentAnswer(q.id) === op;
															return (
																<label
																	key={idx}
																	className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${isSelected
																		? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-200 text-blue-900 font-bold'
																		: 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
																		}`}
																>
																	<div
																		className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-blue-600 bg-white' : 'border-slate-300'
																			}`}
																	>
																		{isSelected && <div className='w-2.5 h-2.5 bg-blue-600 rounded-full'></div>}
																	</div>
																	<input
																		type='radio'
																		name={q.id}
																		value={op}
																		checked={isSelected}
																		onChange={(e) => handleAnswerChange(q.id, e.target.value)}
																		className='hidden' // Ẩn radio mặc định
																	/>
																	<div className="flex gap-2.5 items-baseline">
																		<span className={`font-black ${isSelected ? 'text-blue-700' : 'text-slate-400'}`}>{charLabel}.</span>
																		<span className="leading-relaxed text-slate-700">{op}</span>
																	</div>
																</label>
															);
														})}
													</div>
												)}

												{/* --- 2. CHECKBOXES (Multiple Correct) --- */}
												{q.type === 'multiple-correct-answers' && q.options && (
													<div className='flex flex-col gap-3'>
														{q.options.map((op, idx) => {
															const currentAnswers = getCurrentAnswer(q.id).split(',').filter(Boolean);
															const isChecked = currentAnswers.includes(op);
															const charLabel = String.fromCharCode(65 + idx);
															return (
																<label
																	key={idx}
																	className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${isChecked
																		? 'bg-blue-100 border-blue-500 text-blue-900 font-medium'
																		: 'bg-white border-gray-200 hover:bg-gray-50'
																		}`}
																>
																	<input
																		type='checkbox'
																		value={op}
																		checked={isChecked}
																		onChange={(e) => {
																			const newAnswers = e.target.checked
																				? [...currentAnswers, op]
																				: currentAnswers.filter((ans) => ans !== op);
																			handleAnswerChange(q.id, newAnswers.join(','));
																		}}
																		className='w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
																	/>
																	<span className='font-bold text-gray-500 w-4'>{charLabel}.</span>
																	<span>{op}</span>
																</label>
															);
														})}
													</div>
												)}

												{/* --- 3. TEXT INPUT (Fill Blank / Essay) --- */}
												{(q.type === 'fill-blank' || q.type === 'essay' || q.type === 'speaking') && (
													<div className='relative'>
														<input
															type='text'
															className='border border-gray-300 rounded w-full h-11 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm text-gray-800 placeholder:text-gray-400'
															placeholder='Type your answer here...'
															value={getCurrentAnswer(q.id)}
															onChange={(e) => handleAnswerChange(q.id, e.target.value)}
														/>
													</div>
												)}
											</div>
										</div>
									</div>
								);
							})}
					</div>
				</div>
			</div>

			{/* --- KHỐI 3: TRACKER (PHẢI) --- */}
			<div className='w-80 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col shrink-0 overflow-hidden'>
				{/* Header Cố định (TIMER) */}
				<div className='bg-white shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]'>
					<div className='p-6 border-b border-slate-100 text-center bg-gradient-to-b from-blue-50/50 to-white relative overflow-hidden'>
						<Clock className="absolute top-4 right-4 text-blue-100 w-24 h-24 -mr-8 -mt-8 rotate-12" />
						<div className='text-xs text-blue-600/80 uppercase font-bold text-center mb-1 tracking-widest flex items-center justify-center gap-2'>
							<Clock className="w-3.5 h-3.5" /> Thời gian còn lại
						</div>
						<div
							className={`text-5xl font-black font-mono tracking-wider tabular-nums mt-2 drop-shadow-sm ${timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-slate-800'
								}`}
						>
							{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
						</div>
					</div>

					<div className='p-5 bg-white'>
						<Button
							variant='default'
							onClick={handleSubmit}
							className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold h-14 uppercase tracking-widest shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 border-0 rounded-xl flex items-center justify-center gap-2'
						>
							<Send className="w-4 h-4" /> Nộp bài
						</Button>
					</div>

					<div className='px-5 pb-3 border-b border-slate-100 bg-white pt-1 flex justify-between items-center'>
						<span className='text-xs text-slate-500 font-bold tracking-wider uppercase bg-slate-100 px-3 py-1 rounded-full'>{orderedQuestions.length} câu hỏi</span>
						<span className='text-xs text-blue-600 font-bold tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full'>Đã làm {orderedQuestions.filter(q => getCurrentAnswer(q.id) !== '').length}</span>
					</div>
				</div>

				{/* Grid Scrollable */}
				<div className='flex-1 overflow-y-auto px-5 py-5 bg-slate-50/50'>
					<div className='grid grid-cols-5 gap-2.5'>
						{orderedQuestions.map((q, i) => {
							const hasAnswer = getCurrentAnswer(q.id) !== '';
							const isActive = currentQuestionId === q.id;

							return (
								<button
									key={q.id}
									onClick={() => scrollToQuestion(q.id)}
									className={`
            h-10 w-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative shadow-sm
            ${isActive
											? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-2 ring-blue-300 ring-offset-1 transform scale-110 z-10 font-black shadow-md border-0'
											: hasAnswer
												? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
												: 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700'
										}
          `}
								>
									{i + 1}
									{hasAnswer && !isActive && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-slate-50 rounded-full"></div>}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
