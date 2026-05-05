'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, PenTool, RefreshCw, Sparkles, Target, Trophy, XCircle } from 'lucide-react';

import { ExamPracticeService } from '@/lib/api/services/ExamPracticeService';
import type { AttemptReviewDto } from '@/lib/api/models/AttemptReviewDto';
import type { QuestionReviewDto } from '@/lib/api/models/QuestionReviewDto';
import type { SectionReviewDto } from '@/lib/api/models/SectionReviewDto';
import { useAppSelector } from '@/lib/store/hooks';

import { Button } from './ui/button';
import { AICard, QuestionCard } from './QuestionCard';

type QuestionStatus = 'correct' | 'incorrect' | 'skipped' | 'manual';

/** Canonical writing-feedback shape used throughout this file */
type WritingFeedback = {
	overall_score: number;
	sub_scores?: Record<string, number>;
	detailed_feedback?: string;
	corrected_version?: string;
	corrections?: Array<{ type: string; original: string; corrected: string; explanation: string }>;
};

/**
 * Parse `additionalData` from the BE and normalise it to `WritingFeedback`.
 *
 * The AI service (exam.writing.scored) returns a Result-Event envelope:
 *   { "status": "success", "attempt_id": "…", "data": { "overall_score": 7.5, … } }
 *
 * The BE may store the full envelope OR only the inner `data` object.
 * A `status:"error"` result is converted into a failure feedback so the UI
 * can show the error message instead of staying in "pending" state.
 */
function parseWritingFeedback(additionalData: string | null | undefined): WritingFeedback | null {
	if (!additionalData?.trim()) return null;
	let raw: unknown;
	try {
		raw = JSON.parse(additionalData);
		// BE sometimes double-encodes: the stored string is itself a JSON string
		if (typeof raw === 'string') {
			raw = JSON.parse(raw);
		}
	} catch {
		return null;
	}

	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	let obj = raw as Record<string, any>;

	// ── Unwrap the Result-Event envelope if the BE stored the full payload ──
	if ('status' in obj) {
		if (obj.status === 'error') {
			// Grading completed with a failure — surface error message, stop polling
			return {
				overall_score: 0,
				detailed_feedback: `Chấm bài thất bại: ${obj.error_message ?? obj.error_code ?? 'Lỗi không xác định'}`,
			};
		}
		if (obj.status === 'success' && obj.data && typeof obj.data === 'object') {
			obj = obj.data as Record<string, any>;
		}
	}

	// ── Extract fields — exact AI-service names (README) first, aliases second ──
	const overall =
		obj.overall_score ?? obj.score ?? obj.band_score ?? obj.bandScore ??
		obj.total_score ?? obj.overall ?? obj.band;
	if (overall === undefined || overall === null) return null;

	const sub: Record<string, number> | undefined =
		obj.sub_scores ?? obj.subScores ?? obj.criteria ?? obj.subscores ??
		obj.breakdown ?? obj.scores ?? undefined;

	const feedback: string | undefined =
		obj.detailed_feedback ?? obj.detailedFeedback ?? obj.feedback ??
		obj.comment ?? obj.comments ?? undefined;

	const corrected: string | undefined =
		obj.corrected_version ?? obj.correctedVersion ?? obj.corrected_essay ?? undefined;

	// Corrections: the AI service prompt uses error_type / original_text / corrected_text
	const rawCorrections: any[] = obj.corrections ?? obj.errors ?? obj.mistakes ?? [];
	const corrections = rawCorrections.map((c: any) => ({
		type:        c.error_type     ?? c.type        ?? c.errorType    ?? 'Lỗi',
		original:    c.original_text  ?? c.original    ?? c.originalText ?? '',
		corrected:   c.corrected_text ?? c.corrected   ?? c.correctedText ?? '',
		explanation: c.explanation    ?? c.reason      ?? c.note         ?? '',
	}));

	return {
		overall_score: Number(overall),
		sub_scores: sub,
		detailed_feedback: feedback,
		corrected_version: corrected,
		corrections,
	};
}

type FlatQuestion = {
	q: QuestionReviewDto;
	part: number | null;
	sectionId: string;
	sectionName?: string;
	sectionType?: string;
};

function extractToeicPart(text: string | undefined): number | null {
	if (!text) return null;
	const m = text.match(/part\s*([1-7])/i) || text.match(/\bp([1-7])\b/i);
	if (!m) return null;
	const n = Number(m[1]);
	return Number.isFinite(n) && n >= 1 && n <= 7 ? n : null;
}

function extractToeicPartFromTags(tags?: Array<string>): number | null {
	if (!tags || tags.length === 0) return null;
	for (const t of tags) {
		const n = extractToeicPart(t);
		if (n) return n;
	}
	return null;
}

function clampInt(n: number, min: number, max: number) {
	const x = Math.round(n);
	return Math.max(min, Math.min(max, x));
}

function scaleTo495(correct: number, total: number) {
	if (!total || total <= 0) return 0;
	return clampInt((correct / total) * 495, 0, 495);
}

function formatTime(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function statusLabel(status: QuestionStatus) {
	if (status === 'correct') return 'Chính xác';
	if (status === 'incorrect') return 'Sai';
	if (status === 'manual') return 'Chờ thẩm định';
	return 'Bỏ qua';
}

function statusTheme(status: QuestionStatus) {
	if (status === 'correct') {
		return {
			borderClass: 'border-green-500 ring-1 ring-green-500/30',
			bgHeaderClass: 'bg-green-50/50',
			badgeBg: 'bg-green-100',
			badgeText: 'text-green-700',
			Icon: CheckCircle2,
		};
	}
	if (status === 'incorrect') {
		return {
			borderClass: 'border-red-500 ring-1 ring-red-500/30',
			bgHeaderClass: 'bg-red-50/50',
			badgeBg: 'bg-red-100',
			badgeText: 'text-red-700',
			Icon: XCircle,
		};
	}
	if (status === 'manual') {
		return {
			borderClass: 'border-slate-200 ring-1 ring-slate-200',
			bgHeaderClass: 'bg-slate-50',
			badgeBg: 'bg-slate-200',
			badgeText: 'text-slate-700',
			Icon: AlertCircle,
		};
	}
	return {
		borderClass: 'border-slate-200 ring-1 ring-slate-200',
		bgHeaderClass: 'bg-slate-50',
		badgeBg: 'bg-slate-200',
		badgeText: 'text-slate-700',
		Icon: AlertCircle,
	};
}

export function TestResult() {
	const { id } = useParams();
	const router = useRouter();

	const exams = useAppSelector((state) => state.exams.list);
	const [reviewData, setReviewData] = useState<AttemptReviewDto | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [examId, setExamId] = useState<string>('');

	const [activePart, setActivePart] = useState<'overview' | number>('overview');
	const [filter, setFilter] = useState<'all' | 'incorrect' | 'skipped'>('all');
	const [pollElapsed, setPollElapsed] = useState(0);
	const [pollingTimedOut, setPollingTimedOut] = useState(false);

	useEffect(() => {
		const fetchReview = async () => {
			if (!id) return;
			try {
				const res = await ExamPracticeService.examPracticeGatewayControllerGetAttemptReviewV1(id as string);
				if (res.data) {
					// Some backends may include extra fields beyond the generated type
					setReviewData(res.data as AttemptReviewDto);
					const anyData = res.data as any;
					if (anyData?.examId) setExamId(String(anyData.examId));
				}
			} catch (err: any) {
				console.error(err);
				setError('Không thể tải kết quả. Có thể bài làm chưa hoàn thành hoặc không tồn tại.');
			} finally {
				setLoading(false);
			}
		};

		fetchReview();
	}, [id]);

	const examInfo = useMemo(() => (examId ? exams.find((e) => e.id === examId) : null), [examId, exams]);
	const title = examInfo?.title || 'Chi tiết kết quả bài thi';

	const flatQuestions = useMemo((): FlatQuestion[] => {
		if (!reviewData) return [];
		const out: FlatQuestion[] = [];

		const walk = (sections: SectionReviewDto[], inheritedPart: number | null) => {
			for (const s of sections || []) {
				const sectionPart = extractToeicPart(s.name) ?? extractToeicPart(s.directive) ?? inheritedPart;

				for (const q of s.questions || []) {
					const part = extractToeicPartFromTags(q.tags) ?? sectionPart;
					out.push({
						q,
						part,
						sectionId: s.id,
						sectionName: s.name,
						sectionType: s.type,
					});
				}

				if (s.sections && s.sections.length > 0) walk(s.sections, sectionPart);
			}
		};

		walk(reviewData.sections || [], null);
		out.sort((a, b) => (a.q.order ?? 0) - (b.q.order ?? 0) || a.q.id.localeCompare(b.q.id));
		return out;
	}, [reviewData]);

	const toeicParts = useMemo(() => {
		const set = new Set<number>();
		for (const item of flatQuestions) {
			if (item.part) set.add(item.part);
		}
		return Array.from(set).sort((a, b) => a - b);
	}, [flatQuestions]);

	const isToeicLike = useMemo(() => {
		if (flatQuestions.length === 200) return true;
		if (toeicParts.length >= 5) return true;
		return false;
	}, [flatQuestions.length, toeicParts.length]);

	const questionStatusById = useMemo(() => {
		const map = new Map<string, QuestionStatus>();
		if (!reviewData) return map;

		for (const { q } of flatQuestions) {
			const res = reviewData.responses?.find((r) => r.questionId === q.id);
			const answers = res?.answers || [];

			let status: QuestionStatus = 'skipped';
			if (answers.length > 0) {
				if (res?.isCorrect === true) status = 'correct';
				else if (res?.isCorrect === false) status = 'incorrect';
				else status = 'manual';
			}

			map.set(q.id, status);
		}

		return map;
	}, [flatQuestions, reviewData]);

	const stats = useMemo(() => {
		let correct = 0;
		let incorrect = 0;
		let skipped = 0;
		let manual = 0;

		for (const { q } of flatQuestions) {
			const st = questionStatusById.get(q.id) || 'skipped';
			if (st === 'correct') correct++;
			else if (st === 'incorrect') incorrect++;
			else if (st === 'manual') manual++;
			else skipped++;
		}

		return { correct, incorrect, skipped, manual, total: flatQuestions.length };
	}, [flatQuestions, questionStatusById]);

	const perPartStats = useMemo(() => {
		const parts: Record<number, { correct: number; incorrect: number; skipped: number; total: number }> = {};
		for (const item of flatQuestions) {
			const p = item.part ?? 0;
			if (!p) continue;
			if (!parts[p]) parts[p] = { correct: 0, incorrect: 0, skipped: 0, total: 0 };
			const st = questionStatusById.get(item.q.id) || 'skipped';
			parts[p].total++;
			if (st === 'correct') parts[p].correct++;
			else if (st === 'incorrect') parts[p].incorrect++;
			else parts[p].skipped++;
		}
		return parts;
	}, [flatQuestions, questionStatusById]);

	const toeicScore = useMemo(() => {
		if (!isToeicLike) return null;

		const listeningParts = new Set([1, 2, 3, 4]);
		const readingParts = new Set([5, 6, 7]);
		let listeningCorrect = 0;
		let listeningTotal = 0;
		let readingCorrect = 0;
		let readingTotal = 0;

		for (const item of flatQuestions) {
			const p = item.part;
			if (!p) continue;
			const st = questionStatusById.get(item.q.id) || 'skipped';

			if (listeningParts.has(p)) {
				listeningTotal++;
				if (st === 'correct') listeningCorrect++;
			} else if (readingParts.has(p)) {
				readingTotal++;
				if (st === 'correct') readingCorrect++;
			}
		}

		// fallback: if parts are missing, split by halves
		if (listeningTotal + readingTotal === 0 && flatQuestions.length > 0) {
			const half = Math.floor(flatQuestions.length / 2);
			for (let i = 0; i < flatQuestions.length; i++) {
				const st = questionStatusById.get(flatQuestions[i].q.id) || 'skipped';
				if (i < half) {
					listeningTotal++;
					if (st === 'correct') listeningCorrect++;
				} else {
					readingTotal++;
					if (st === 'correct') readingCorrect++;
				}
			}
		}

		const listeningScaled = scaleTo495(listeningCorrect, listeningTotal || 100);
		const readingScaled = scaleTo495(readingCorrect, readingTotal || 100);
		const totalScaled = clampInt(listeningScaled + readingScaled, 0, 990);

		return {
			listening: { correct: listeningCorrect, total: listeningTotal, scaled: listeningScaled },
			reading: { correct: readingCorrect, total: readingTotal, scaled: readingScaled },
			totalScaled,
		};
	}, [flatQuestions, isToeicLike, questionStatusById]);

	const partOptions = useMemo(() => {
		return [{ key: 'overview' as const, label: 'Tổng quát' }, ...toeicParts.map((p) => ({ key: p, label: `Part ${p}` }))];
	}, [toeicParts]);

	const activeQuestions = useMemo(() => {
		const list = activePart === 'overview' ? flatQuestions : flatQuestions.filter((x) => x.part === activePart);
		if (filter === 'all') return list;
		return list.filter((x) => (questionStatusById.get(x.q.id) || 'skipped') === filter);
	}, [activePart, filter, flatQuestions, questionStatusById]);

	const startedAtMs = reviewData ? new Date(reviewData.startedAt).getTime() : 0;
	const endedAtMs = reviewData ? new Date(reviewData.endedAt).getTime() : 0;
	const timeTakenSeconds = Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000));

	// Detect if this is a Writing-only test (case-insensitive type check)
	const isWritingTest = useMemo(() => {
		return flatQuestions.length > 0 && flatQuestions.every(q =>
			q.q.type?.toLowerCase() === 'writing' ||
			q.q.tags?.some(t => t.toLowerCase().includes('writing'))
		);
	}, [flatQuestions]);

	// Calculate average Writing band score
	const writingAvgScore = useMemo(() => {
		if (!isWritingTest || !reviewData) return 0;
		let totalScore = 0;
		let count = 0;
		for (const { q } of flatQuestions) {
			const res = reviewData.responses?.find((r) => r.questionId === q.id);
			const fb = parseWritingFeedback(res?.additionalData);
			if (fb && fb.overall_score > 0) {
				totalScore += fb.overall_score;
				count++;
			}
		}
		return count > 0 ? (totalScore / count).toFixed(1) : 0;
	}, [flatQuestions, reviewData, isWritingTest]);

	// Pending as long as ANY writing question still lacks AI feedback
	const isPendingGrading = useMemo(() => {
		if (!isWritingTest || !reviewData || flatQuestions.length === 0) return false;
		return flatQuestions.some(({ q }) => {
			const res = reviewData.responses?.find((r) => r.questionId === q.id);
			return !res?.additionalData?.trim();
		});
	}, [isWritingTest, reviewData, flatQuestions]);

	// How many essays have been graded so far (for progress display)
	const gradedCount = useMemo(() => {
		if (!isWritingTest || !reviewData) return 0;
		return flatQuestions.filter(({ q }) => {
			const res = reviewData.responses?.find((r) => r.questionId === q.id);
			return !!res?.additionalData?.trim();
		}).length;
	}, [isWritingTest, reviewData, flatQuestions]);

	// Elapsed-time ticker while AI grading is pending
	useEffect(() => {
		if (!isPendingGrading) return;
		const timer = setInterval(() => setPollElapsed((s) => s + 1), 1000);
		return () => clearInterval(timer);
	}, [isPendingGrading]);

	// Poll for results every 5 s (max 3 min = 36 attempts)
	useEffect(() => {
		if (!isPendingGrading || !id || pollingTimedOut) return;
		let count = 0;
		const MAX_POLLS = 36;

		const intervalId = setInterval(async () => {
			count++;
			if (count >= MAX_POLLS) {
				clearInterval(intervalId);
				setPollingTimedOut(true);
				return;
			}
			try {
				const res = await ExamPracticeService.examPracticeGatewayControllerGetAttemptReviewV1(id as string);
				if (res.data) {
					const responses = (res.data as AttemptReviewDto).responses ?? [];
					// Always update reviewData so partial progress (1/2 graded) is visible
					setReviewData(res.data as AttemptReviewDto);
					const anyData = res.data as any;
					if (anyData?.examId) setExamId(String(anyData.examId));
					// Stop polling only when ALL responses have received AI feedback
					const allGraded = responses.length > 0 && responses.every((r) => r.additionalData?.trim());
					if (allGraded) {
						clearInterval(intervalId);
					}
				}
			} catch (err) {
				console.error('Polling error:', err);
			}
		}, 5000);

		return () => clearInterval(intervalId);
	}, [isPendingGrading, id, pollingTimedOut]);

	const scoreLabel = isToeicLike ? 'Điểm TOEIC' : isWritingTest ? 'Band IELTS trung bình' : 'Điểm';
	const scoreValue = isToeicLike ? (toeicScore?.totalScaled ?? 0) : isWritingTest ? writingAvgScore : reviewData?.totalPoints ?? 0;
	const scoreDenom = isToeicLike ? 990 : isWritingTest ? '9.0' : 100;

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
				<div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
				<p className="mt-4 text-slate-600 font-medium">Đang tải kết quả...</p>
			</div>
		);
	}

	if (error || !reviewData) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
				<div className="text-red-500 mb-4">
					<XCircle className="w-16 h-16" />
				</div>
				<p className="text-slate-700 font-medium">{error || 'Không có dữ liệu bài làm.'}</p>
				<Button onClick={() => router.push('/')} className="mt-4">
					Về trang chủ
				</Button>
			</div>
		);
	}

	if (isPendingGrading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
				{/* Top bar */}
				<div className="relative overflow-hidden bg-primary shadow-lg">
					<div className="absolute inset-0 bg-black/10" />
					<div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
					<div className="relative px-6 py-6 max-w-7xl mx-auto">
						<Button
							variant="ghost"
							onClick={() => router.push(examId ? `/test/${examId}` : '/dashboard')}
							className="flex items-center gap-2 -ml-2 text-primary-foreground/80 hover:text-white hover:bg-white/10 font-medium"
						>
							<ArrowLeft className="h-4 w-4" />
							Trở về
						</Button>
					</div>
				</div>

				{/* Waiting card */}
				<div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
					<div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-10 max-w-md w-full text-center space-y-8">
						{/* Animated icon */}
						<div className="relative inline-flex items-center justify-center mx-auto">
							<div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
								<Sparkles className="w-11 h-11 text-primary animate-pulse" />
							</div>
							<div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
						</div>

					<div className="space-y-3">
						<h2 className="text-2xl font-extrabold text-slate-800">AI đang chấm bài viết của bạn</h2>
						<p className="text-slate-500 font-medium leading-relaxed">
							Quá trình này có thể mất từ 1–2 phút.<br />Bạn có thể chờ tại đây hoặc quay lại sau.
						</p>
					</div>

					{/* Progress: X / N bài đã chấm xong */}
					{flatQuestions.length > 1 && (
						<div className="w-full space-y-2">
							<div className="flex justify-between text-sm font-bold text-slate-600">
								<span>Tiến trình chấm bài</span>
								<span>{gradedCount} / {flatQuestions.length} bài</span>
							</div>
							<div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
								<div
									className="h-full bg-primary rounded-full transition-all duration-700"
									style={{ width: `${flatQuestions.length > 0 ? (gradedCount / flatQuestions.length) * 100 : 0}%` }}
								/>
							</div>
						</div>
					)}

					{/* Elapsed timer */}
					<div className="flex items-center justify-center gap-2 text-slate-600">
						<Clock className="w-4 h-4" />
						<span className="font-mono text-xl font-bold tabular-nums">{formatTime(pollElapsed)}</span>
					</div>

					{/* Bouncing dots */}
					<div className="flex justify-center gap-2.5">
						{[0, 1, 2].map((i) => (
							<div
								key={i}
								className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
								style={{ animationDelay: `${i * 0.18}s` }}
							/>
						))}
					</div>

						{pollingTimedOut ? (
							<div className="space-y-4">
								<p className="text-amber-600 font-semibold text-sm bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
									Kết quả chưa sẵn sàng. Vui lòng quay lại sau để xem điểm và nhận xét.
								</p>
								<div className="flex gap-3 justify-center">
									<Button
										onClick={() => router.push('/history')}
										className="bg-primary hover:bg-primary/90 text-white font-bold px-6 h-11 rounded-xl"
									>
										Xem lịch sử
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											setPollingTimedOut(false);
											setPollElapsed(0);
										}}
										className="font-bold px-6 h-11 rounded-xl"
									>
										Thử lại
									</Button>
								</div>
							</div>
						) : (
							<Button
								variant="outline"
								onClick={() => router.push('/history')}
								className="font-bold px-8 h-11 rounded-xl w-full border-slate-200 hover:bg-slate-50"
							>
								Quay lại sau
							</Button>
						)}
					</div>

					<p className="mt-8 text-sm text-slate-500 text-center max-w-sm">
						Kết quả sẽ được lưu tự động. Bạn có thể xem lại trong{' '}
						<button
							type="button"
							onClick={() => router.push('/history')}
							className="font-bold text-primary hover:underline"
						>
							Lịch sử làm bài
						</button>
						.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 pb-20">
			{/* Header — writing variant */}
			{isWritingTest ? (
				<div className="mb-8 pt-6 pb-16 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 pointer-events-none" />
					<div className="absolute inset-0 bg-black/10 pointer-events-none" />
					<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
					<div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
						<Button
							variant="ghost"
							onClick={() => router.push(examId ? `/tests/${examId}` : '/dashboard')}
							className="flex items-center gap-2 mb-6 -ml-2 text-white/80 hover:text-white hover:bg-white/10 font-medium transition-colors"
						>
							<ArrowLeft className="h-4 w-4" />
							Trở về
						</Button>

						<div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 text-center md:text-left">
							<div className="flex-1">
								<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-bold mb-4 shadow-sm">
									<PenTool className="w-4 h-4 text-emerald-200" /> KẾT QUẢ WRITING
								</div>
								<h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">{title}</h1>
								<p className="text-white/80 font-medium text-lg max-w-2xl leading-relaxed">
									Nộp bài vào lúc {new Date(reviewData.endedAt).toLocaleString('vi-VN')}
								</p>
							</div>

							<div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl w-56 shrink-0 relative overflow-hidden">
								<div className="absolute inset-0 bg-white/5 pointer-events-none" />
								<span className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Band trung bình</span>
								<div className="flex items-baseline gap-1">
									<span className="text-5xl font-black text-white drop-shadow-md">{Number(writingAvgScore).toFixed(1)}</span>
									<span className="text-xl font-bold text-white bg-emerald-700 px-2.5 py-1 rounded-lg shadow-md">/9.0</span>
								</div>
								<div className="mt-2 text-xs text-white/70 font-semibold">{flatQuestions.length} bài viết</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				/* Header — standard variant */
				<div className="bg-white border-b border-gray-200 mb-8 pt-6 pb-16 relative overflow-hidden">
					<div className="absolute inset-0 bg-primary pointer-events-none" />
					<div className="absolute inset-0 bg-black/10 pointer-events-none" />
					<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
								<h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">{title}</h1>
								<p className="text-primary-foreground/80 font-medium text-lg max-w-2xl leading-relaxed">
									Nộp bài vào lúc {new Date(reviewData.endedAt).toLocaleString('vi-VN')}
								</p>
							</div>

							<div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl w-56 shrink-0 relative overflow-hidden">
								<div className="absolute inset-0 bg-white/5 pointer-events-none" />
								<span className="text-sm font-bold text-primary-foreground/80 uppercase tracking-widest mb-1">{scoreLabel}</span>
								<div className="flex items-baseline gap-1">
									<span className="text-5xl font-black text-white drop-shadow-md">{isToeicLike ? scoreValue : Number(scoreValue).toFixed(1)}</span>
									<span className="text-xl font-bold text-white bg-blue-600 px-2.5 py-1 rounded-lg shadow-md">/{scoreDenom}</span>
								</div>
								{isToeicLike && toeicScore && (
									<div className="mt-2 text-xs text-primary-foreground/80 font-bold text-center">
										<span className="block">Listening {toeicScore.listening.scaled}/495</span>
										<span className="block">Reading {toeicScore.reading.scaled}/495</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 -mt-10 relative z-20">
				{/* Part tabs + filter — hidden for writing exams */}
				{!isWritingTest && (
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
						<div className="flex flex-wrap gap-2">
							{partOptions.map((p) => (
								<button
									key={String(p.key)}
									type="button"
									onClick={() => setActivePart(p.key)}
									className={`px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
										activePart === p.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
									}`}
								>
									{p.label}
								</button>
							))}
						</div>
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => setFilter('all')}
								className={`px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
									filter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
								}`}
							>
								Tất cả
							</button>
							<button
								type="button"
								onClick={() => setFilter('incorrect')}
								className={`px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
									filter === 'incorrect' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
								}`}
							>
								Câu sai
							</button>
							<button
								type="button"
								onClick={() => setFilter('skipped')}
								className={`px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
									filter === 'skipped' ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
								}`}
							>
								Bỏ qua
							</button>
						</div>
					</div>

					{activePart === 'overview' && isToeicLike && toeicParts.length > 0 && (
						<div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
							<div className="rounded-2xl border border-slate-200 overflow-hidden">
								<div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-extrabold text-slate-800">Phân tích theo Part</div>
								<div className="p-4">
									<div className="grid grid-cols-1 gap-3">
										{toeicParts.map((p) => {
											const st = perPartStats[p];
											if (!st) return null;
											const acc = st.total ? (st.correct / st.total) * 100 : 0;
											return (
												<div key={p} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-200 bg-white">
													<div className="font-extrabold text-slate-800">Part {p}</div>
													<div className="text-sm text-slate-600 font-bold whitespace-nowrap">
														Đúng {st.correct} · Sai {st.incorrect} · Bỏ {st.skipped}
													</div>
													<div className="text-sm font-extrabold text-slate-800 whitespace-nowrap">{acc.toFixed(1)}%</div>
												</div>
											);
										})}
									</div>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200 overflow-hidden">
								<div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-extrabold text-slate-800">Tổng quan</div>
								<div className="p-4 grid grid-cols-2 gap-3">
									<div className="p-4 rounded-xl border border-slate-200 bg-white">
										<div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Số câu</div>
										<div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
									</div>
									<div className="p-4 rounded-xl border border-slate-200 bg-white">
										<div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Chính xác</div>
										<div className="text-2xl font-black text-slate-900 mt-1">{stats.total ? ((stats.correct / stats.total) * 100).toFixed(1) : '0.0'}%</div>
									</div>
									<div className="p-4 rounded-xl border border-slate-200 bg-white">
										<div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Listening</div>
										<div className="text-2xl font-black text-slate-900 mt-1">{toeicScore?.listening.scaled ?? 0}/495</div>
									</div>
									<div className="p-4 rounded-xl border border-slate-200 bg-white">
										<div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Reading</div>
										<div className="text-2xl font-black text-slate-900 mt-1">{toeicScore?.reading.scaled ?? 0}/495</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
				)} {/* end !isWritingTest part-tabs */}

				{/* Stats */}
				<div className={`grid gap-4 ${isWritingTest ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
					<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
						<div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-1 border border-slate-100">
							<Clock className="h-6 w-6" />
						</div>
						<span className="text-sm font-bold text-slate-500 uppercase">Thời gian</span>
						<span className="text-2xl font-black text-slate-800">{formatTime(timeTakenSeconds)}</span>
					</div>
					{!isWritingTest && (
						<>
							<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
								<div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-1 border border-green-100">
									<CheckCircle2 className="h-6 w-6" />
								</div>
								<span className="text-sm font-bold text-slate-500 uppercase">Đúng</span>
								<span className="text-2xl font-black text-green-600">
									{stats.correct} / {stats.total}
								</span>
							</div>
							<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
								<div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-1 border border-red-100">
									<XCircle className="h-6 w-6" />
								</div>
								<span className="text-sm font-bold text-slate-500 uppercase">Sai</span>
								<span className="text-2xl font-black text-red-600">{stats.incorrect}</span>
							</div>
						</>
					)}
					{isWritingTest && (
						<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
							<div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-1 border border-emerald-100">
								<Trophy className="h-6 w-6" />
							</div>
							<span className="text-sm font-bold text-slate-500 uppercase">Band trung bình</span>
							<span className="text-2xl font-black text-emerald-600">{writingAvgScore}</span>
						</div>
					)}
					<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
						<div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-1 border border-slate-100">
							<AlertCircle className="h-6 w-6" />
						</div>
						<span className="text-sm font-bold text-slate-500 uppercase">{isWritingTest ? 'Số bài viết' : 'Bỏ qua'}</span>
						<span className="text-2xl font-black text-slate-800">{isWritingTest ? flatQuestions.length : stats.skipped}</span>
					</div>
				</div>

				{/* Actions */}
				<div className="flex flex-col sm:flex-row justify-center gap-4 py-4">
					<Button onClick={() => router.push('/')} className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-bold px-8 h-12 rounded-xl shadow-sm">
						Về Trang Chủ
					</Button>
					{examId && (
						<Button
							onClick={() => {
								sessionStorage.setItem('testState', JSON.stringify({ retake: true }));
								router.push(`/test/${examId}`);
							}}
							className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-xl shadow-md transition-all hover:-translate-y-0.5"
						>
							<RefreshCw className="w-4 h-4 mr-2" /> Làm Lại Bài Thi
						</Button>
					)}
				</div>

				{/* Detailed results */}
				<div className="space-y-6">
					<div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
						{isWritingTest ? <PenTool className="w-6 h-6 text-emerald-600" /> : <Target className="w-6 h-6 text-primary" />}
						<h2 className="text-2xl font-extrabold text-slate-800">
							{isWritingTest ? 'Nhận xét chi tiết từ AI' : 'Đáp án chi tiết'}
						</h2>
					</div>

					<div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
						<div className="space-y-6">
							{activeQuestions.map((item, index) => {
								const q = item.q;
								const res = reviewData.responses?.find((r) => r.questionId === q.id);
								const userAnswers = res?.answers || [];
								const userAnswerStr = userAnswers.join(', ');

								let status: QuestionStatus = 'skipped';
								if (userAnswers.length > 0) {
									if (res?.isCorrect === true) status = 'correct';
									else if (res?.isCorrect === false) status = 'incorrect';
									else status = 'manual';
								}

								const theme = statusTheme(status);
								const options = q.choices?.map((c) => c.key) || [];

								// Check if this is a Writing question (case-insensitive)
								const isWriting = q.type?.toLowerCase() === 'writing' || q.tags?.some(t => t.toLowerCase().includes('writing'));

								// Parse & normalise AI-service feedback (handles envelope + all field-name variants)
								const writingData: WritingFeedback | null =
									isWriting ? parseWritingFeedback(res?.additionalData) : null;

								return (
									<div id={`q-${q.id}`} key={q.id} className={`bg-white rounded-2xl border-l-[6px] shadow-sm hover:shadow-md transition-shadow overflow-hidden ${theme.borderClass}`}>
										<div className={`px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${theme.bgHeaderClass} border-b border-slate-100`}>
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-slate-700">{index + 1}</div>
												{isWriting && writingData ? (
													<span className="inline-flex items-center gap-1.5 font-bold text-sm px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
														<Trophy className="w-3.5 h-3.5" />
														{writingData.overall_score} Band
													</span>
												) : (
													<span className={`inline-flex items-center gap-1.5 font-bold uppercase text-xs px-3 py-1.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
														<theme.Icon className="w-3.5 h-3.5" />
														{statusLabel(status)}
													</span>
												)}
												{item.part && <span className="text-xs font-extrabold px-2 py-1 rounded-lg bg-white/70 border border-slate-200 text-slate-700">Part {item.part}</span>}
											</div>
											<div className="flex items-center gap-4">
												<span className="text-sm bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-600 font-bold shadow-sm whitespace-nowrap">{q.points} Điểm</span>
												<AICard q={q} />
											</div>
										</div>

										<div className="p-6 md:p-8 space-y-8">
											<div className="prose prose-slate max-w-none">
												<p className="text-slate-800 text-lg font-medium leading-relaxed">{q.content}</p>
											</div>

											{q.fileUrls && q.fileUrls.length > 0 && (
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
													{q.fileUrls.slice(0, 4).map((url, i) => (
														<div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
															{/* eslint-disable-next-line @next/next/no-img-element */}
															<img src={url} alt={`asset-${i}`} className="w-full h-auto object-contain" />
														</div>
													))}
												</div>
											)}

											{/* Writing Result UI */}
											{isWriting && writingData ? (
												<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
													{/* Left column - Scores & Feedback */}
													<div className="space-y-6">
														{/* Overall Score */}
														<div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-200">
															<div className="flex items-center justify-between mb-4">
																<span className="font-bold text-slate-700">Điểm & nhận xét chung</span>
																<span className="text-2xl font-black text-emerald-600">{writingData.overall_score} Band</span>
															</div>

															{/* Sub-scores */}
															<div className="space-y-3">
																<p className="text-sm font-bold text-slate-600 mb-2">Điểm chi tiết:</p>
																{writingData.sub_scores && Object.entries(writingData.sub_scores).map(([key, score]) => (
																	<div key={key} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-emerald-100">
																		<span className="text-sm text-slate-600">{key}</span>
																		<span className="font-bold text-emerald-600">{score}<span className="text-slate-400 font-normal">/9.0</span></span>
																	</div>
																))}
															</div>
														</div>

														{/* Detailed Feedback */}
														{writingData.detailed_feedback && (
															<div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
																<p className="font-bold text-slate-700 mb-3">Nhận xét chi tiết</p>
																<div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
																	{writingData.detailed_feedback}
																</div>
															</div>
														)}
													</div>

													{/* Right column - Essay & Corrections */}
													<div className="space-y-6">
														{/* User's Answer */}
														<div className="bg-amber-50/50 rounded-xl p-5 border border-amber-200">
															<div className="flex items-center gap-2 mb-3">
																<AlertCircle className="w-4 h-4 text-amber-600" />
																<p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Bài viết của bạn</p>
															</div>
															<div className="bg-white rounded-lg p-4 border border-amber-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
																{userAnswerStr || <span className="text-slate-400 italic">Chưa có bài viết</span>}
															</div>
														</div>

														{/* Corrected Version */}
														{writingData.corrected_version && (
															<div className="bg-emerald-50/30 rounded-xl p-5 border border-emerald-200">
																<div className="flex items-center gap-2 mb-3">
																	<div className="w-2 h-2 rounded-full bg-emerald-500" />
																	<p className="text-sm font-bold text-slate-700">Phiên bản đã chỉnh sửa</p>
																</div>
																<div className="bg-white rounded-lg p-4 border border-emerald-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
																	{writingData.corrected_version}
																</div>
															</div>
														)}

														{/* Corrections List */}
														{writingData.corrections && writingData.corrections.length > 0 && (
															<div className="bg-white rounded-xl p-5 border border-slate-200">
																<p className="font-bold text-slate-700 mb-4">Danh sách lỗi ({writingData.corrections.length})</p>
																<div className="space-y-3">
																	{writingData.corrections.map((correction, idx) => (
																		<div key={idx} className="bg-red-50/50 rounded-lg p-3 border border-red-100 border-dashed">
																		<div className="flex items-center gap-2 mb-2">
																			<div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{idx + 1}</div>
																			<span className="text-xs font-bold text-red-700 uppercase">{correction.type || 'Lỗi'}</span>
																		</div>
																		<div className="grid grid-cols-2 gap-2 text-sm">
																			<div>
																				<span className="text-slate-500 text-xs">Gốc:</span>
																				<p className="text-red-600 line-through">{correction.original}</p>
																				</div>
																			<div>
																				<span className="text-slate-500 text-xs">Sửa:</span>
																				<p className="text-emerald-600 font-medium">{correction.corrected}</p>
																				</div>
																		</div>
																		{correction.explanation && (
																			<p className="text-xs text-slate-500 mt-2"><span className="font-medium">Giải thích:</span> {correction.explanation}</p>
																		)}
																	</div>
																	))}
																</div>
															</div>
														)}
													</div>
												</div>
											) : (
												<>
												{/* Regular question options */}
												{options && options.length > 0 && (
													<div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
														<p className="mb-3 font-bold text-slate-700 text-sm uppercase tracking-wide">Các lựa chọn:</p>
														<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
												</>
											)}

											{/* Câu trả lời / Đáp án đúng — only for non-writing questions */}
											{!isWriting && (
												<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
													<div className={`p-5 rounded-xl border ${status === 'correct' ? 'bg-green-50/50 border-green-200' : status === 'incorrect' ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
														<div className="flex items-center gap-2 mb-2">
															<UserIcon className={`w-4 h-4 ${status === 'correct' ? 'text-green-600' : status === 'incorrect' ? 'text-red-600' : 'text-slate-500'}`} />
															<p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Câu trả lời của bạn</p>
														</div>
														<div className="min-h-[2.5rem] flex flex-wrap items-center gap-2">
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
															<p className="text-xs uppercase font-bold text-primary tracking-wider">Đáp án đúng</p>
														</div>
														<div className="min-h-[2.5rem] flex flex-wrap items-center gap-2">
															<QuestionCard q={q} status={status} />
														</div>
													</div>
												</div>
											)}

											{/* additionalData fallback — only for non-writing questions (writing uses the card above) */}
											{!isWriting && res?.additionalData && (
												<div className="mt-6 p-5 rounded-xl border bg-amber-50/50 border-amber-200">
													<div className="flex items-center gap-2 mb-3">
														<AlertCircle className="w-5 h-5 text-amber-500" />
														<p className="text-sm uppercase font-bold text-amber-700 tracking-wider">Nhận xét chi tiết</p>
													</div>
													<div className="prose prose-sm max-w-none text-amber-900/80 whitespace-pre-wrap">
														{(() => {
															try {
																const parsed = JSON.parse(res.additionalData);
																return (
																	<div className="space-y-4">
																		{parsed.overall_score !== undefined && (
																			<div className="flex items-center gap-2">
																				<span className="font-bold text-amber-800">Điểm tổng:</span>
																				<span className="text-xl font-black text-amber-600">{parsed.overall_score}</span>
																			</div>
																		)}
																		{parsed.detailed_feedback && (
																			<div>
																				<span className="font-bold text-amber-800 block mb-1">Nhận xét:</span>
																				<div className="bg-white/50 p-3 rounded-lg border border-amber-200/50">{parsed.detailed_feedback}</div>
																			</div>
																		)}
																		{parsed.corrected_version && (
																			<div>
																				<span className="font-bold text-amber-800 block mb-1">Phiên bản gợi ý:</span>
																				<div className="bg-white/50 p-3 rounded-lg border border-amber-200/50">{parsed.corrected_version}</div>
																			</div>
																		)}
																	</div>
																);
															} catch (e) {
																return <div>{res.additionalData}</div>;
															}
														})()}
													</div>
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>

						{/* Question map */}
						<div className="xl:sticky xl:top-24">
							<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
								<div className="flex items-center justify-between gap-2 mb-3">
									<div className="font-extrabold text-slate-800 text-sm">Danh sách câu</div>
									<div className="text-xs text-slate-500 font-bold">{activeQuestions.length} câu</div>
								</div>
							<div className="grid grid-cols-8 gap-2">
								{activeQuestions.map((item, idx) => {
									const st = questionStatusById.get(item.q.id) || 'skipped';
									const isWritingQ = item.q.type?.toLowerCase() === 'writing' || item.q.tags?.some((t) => t.toLowerCase().includes('writing'));
									const bg = isWritingQ
										? 'bg-emerald-100 text-emerald-800 border-emerald-200'
										: st === 'correct'
											? 'bg-green-100 text-green-800 border-green-200'
											: st === 'incorrect'
												? 'bg-red-100 text-red-800 border-red-200'
												: 'bg-slate-100 text-slate-700 border-slate-200';
									return (
										<button
											key={item.q.id}
											type="button"
											onClick={() => {
												const el = document.getElementById(`q-${item.q.id}`);
												el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
											}}
											className={`h-8 rounded-lg border text-xs font-extrabold ${bg} hover:brightness-95 transition`}
											title={`Bài ${idx + 1}`}
										>
											{idx + 1}
										</button>
									);
								})}
							</div>
							{isWritingTest ? (
								<div className="mt-4 flex items-center gap-3 text-xs font-bold text-slate-600">
									<span className="inline-flex items-center gap-2">
										<span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
										Bài viết
									</span>
								</div>
							) : (
								<div className="mt-4 flex items-center gap-3 text-xs font-bold text-slate-600">
									<span className="inline-flex items-center gap-2">
										<span className="w-3 h-3 rounded bg-green-100 border border-green-200" />
										Đúng
									</span>
									<span className="inline-flex items-center gap-2">
										<span className="w-3 h-3 rounded bg-red-100 border border-red-200" />
										Sai
									</span>
									<span className="inline-flex items-center gap-2">
										<span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
										Bỏ
									</span>
								</div>
							)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

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
	);
}

