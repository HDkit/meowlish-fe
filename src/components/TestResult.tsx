'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronDown, Clock, Loader2, PenTool, RefreshCw, Sparkles, Target, Trophy, XCircle } from 'lucide-react';

import { ExamPracticeService } from '@/lib/api/services/ExamPracticeService';
import type { AttemptReviewDto } from '@/lib/api/models/AttemptReviewDto';
import type { QuestionDetailDto } from '@/lib/api/models/QuestionDetailDto';
import type { QuestionReviewDto } from '@/lib/api/models/QuestionReviewDto';
import type { SectionReviewDto } from '@/lib/api/models/SectionReviewDto';
import { useAppSelector } from '@/lib/store/hooks';

import { Button } from './ui/button';

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
	/** Top-level section id (same idea as TestInterface `ancestorSections[0]`) */
	rootSectionId: string;
	rootSectionName?: string;
	/** Media URLs on the section that directly owns this question */
	ownerSectionFileUrls: string[];
	/** 1-based index across the whole exam after sort */
	globalIndex: number;
};

/** Same as TestInterface — BE often returns host-only paths without a scheme */
function formatMediaUrl(url: string): string {
	if (!url) return '';
	const t = url.trim();
	if (t.startsWith('http://') || t.startsWith('https://')) return t;
	if (t.startsWith('//')) return `https:${t}`;
	// Absolute path on current site (avoid invalid "http:///path")
	if (t.startsWith('/')) {
		if (typeof window !== 'undefined') return `${window.location.origin}${t}`;
		return t;
	}
	return `http://${t}`;
}

function isImageUrl(url: string): boolean {
	return !!url.trim().match(/\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i);
}

function isAudioUrl(url: string): boolean {
	return !!url.trim().match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i);
}

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

export function TestResult() {
	const { id } = useParams();
	const router = useRouter();

	const exams = useAppSelector((state) => state.exams.list);
	const [reviewData, setReviewData] = useState<AttemptReviewDto | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [examId, setExamId] = useState<string>('');
	// Tổng điểm user đạt được cho attempt hiện tại (non-TOEIC, non-writing)
	const [attemptScore, setAttemptScore] = useState<number | null>(null);

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
					// Backend có thể trả thêm trường score (điểm user) trên attempt
					if (typeof anyData?.score === 'number') {
						setAttemptScore(Number(anyData.score));
					}
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
		const out: Omit<FlatQuestion, 'globalIndex'>[] = [];

		const walk = (sections: SectionReviewDto[], inheritedPart: number | null, rootSection: SectionReviewDto | null) => {
			for (const s of sections || []) {
				const root = rootSection ?? s;
				const sectionPart = extractToeicPart(s.name) ?? extractToeicPart(s.directive) ?? inheritedPart;

				for (const q of s.questions || []) {
					const part = extractToeicPartFromTags(q.tags) ?? sectionPart;
					out.push({
						q,
						part,
						sectionId: s.id,
						sectionName: s.name,
						sectionType: s.type,
						rootSectionId: root.id,
						rootSectionName: root.name,
						ownerSectionFileUrls: s.fileUrls ?? [],
					});
				}

				if (s.sections && s.sections.length > 0) walk(s.sections, sectionPart, root);
			}
		};

		walk(reviewData.sections || [], null, null);
		out.sort((a, b) => (a.q.order ?? 0) - (b.q.order ?? 0) || a.q.id.localeCompare(b.q.id));
		return out.map((item, i) => ({ ...item, globalIndex: i + 1 }));
	}, [reviewData]);

	/** Root-level parts in exam order (matches TestInterface tracker) */
	const reviewParts = useMemo(() => {
		const seen = new Set<string>();
		const parts: { id: string; name: string }[] = [];
		let fallback = 1;
		for (const item of flatQuestions) {
			if (!seen.has(item.rootSectionId)) {
				seen.add(item.rootSectionId);
				parts.push({
					id: item.rootSectionId,
					name: item.rootSectionName?.trim() || `Part ${fallback++}`,
				});
			}
		}
		return parts;
	}, [flatQuestions]);

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
					if (typeof anyData?.score === 'number') {
						setAttemptScore(Number(anyData.score));
					}
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

	const rawTotalPoints = reviewData?.totalPoints ?? 0;

	const scoreLabel = isToeicLike
		? 'Điểm TOEIC'
		: isWritingTest
			? 'Band IELTS trung bình'
			: 'Điểm';

	// Giá trị điểm chính để hiển thị:
	// - TOEIC: điểm scaled 0–990 tự tính từ số câu đúng
	// - Writing: band trung bình 0–9
	// - Bài khác: score (điểm user đạt được), fallback 0 nếu BE chưa trả
	const scoreMain = isToeicLike
		? toeicScore?.totalScaled ?? 0
		: isWritingTest
			? Number(writingAvgScore || 0)
			: attemptScore != null
				? attemptScore === 0 && stats.correct > 0
					? stats.correct
					: attemptScore
				: stats.correct ?? 0;

	// Mẫu số hiển thị cạnh điểm
	const scoreDenom = isToeicLike
		? 990
		: isWritingTest
			? '9.0'
			: rawTotalPoints || stats.total || 100;

	// % cho các bài thường (non-TOEIC, non-writing) nếu có đủ dữ liệu
	const scorePercent =
		!isToeicLike && !isWritingTest && rawTotalPoints > 0
			? Math.round((((attemptScore != null ? (attemptScore === 0 && stats.correct > 0 ? stats.correct : attemptScore) : stats.correct) || 0) / rawTotalPoints) * 100)
			: null;

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
							onClick={() => router.push(examId ? `/test/${examId}` : '/dashboard')}
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
							onClick={() => router.push(examId ? `/test/${examId}` : '/dashboard')}
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
								<div className="flex flex-col items-center gap-1">
									<div className="flex items-baseline gap-1">
										<span className="text-5xl font-black text-white drop-shadow-md">
											{isToeicLike ? scoreMain : Number(scoreMain).toFixed(1)}
										</span>
										<span className="text-xl font-bold text-white bg-blue-600 px-2.5 py-1 rounded-lg shadow-md">
											/{scoreDenom}
										</span>
									</div>
									{!isToeicLike && !isWritingTest && scorePercent != null && (
										<div className="text-xs font-semibold text-primary-foreground/80">
											{scoreMain}/{rawTotalPoints} điểm ({scorePercent}%)
										</div>
									)}
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
				<DetailedAnalysis
					flatQuestions={flatQuestions}
					questionStatusById={questionStatusById}
					toeicParts={toeicParts}
					reviewData={reviewData!}
					isWritingTest={isWritingTest}
				/>
			</div>
		</div>
	);
}

function DetailedAnalysis({
	flatQuestions,
	questionStatusById,
	toeicParts,
	reviewData,
	isWritingTest,
}: {
	flatQuestions: FlatQuestion[];
	questionStatusById: Map<string, QuestionStatus>;
	toeicParts: number[];
	reviewData: AttemptReviewDto;
	isWritingTest: boolean;
}) {
	const [analysisPart, setAnalysisPart] = useState<'overview' | number>('overview');
	const [expandedQ, setExpandedQ] = useState<string | null>(null);
	const [detailCache, setDetailCache] = useState<Record<string, QuestionDetailDto>>({});
	const [detailLoading, setDetailLoading] = useState<string | null>(null);

	const getCorrectKey = useCallback((q: QuestionReviewDto) => {
		const correct = q.choices?.find(c => c.isCorrect);
		return correct?.key || '–';
	}, []);

	const getUserAnswer = useCallback((qId: string) => {
		const res = reviewData.responses?.find(r => r.questionId === qId);
		return res?.answers?.join(', ') || '';
	}, [reviewData]);

	const fetchDetail = useCallback(async (qId: string) => {
		if (detailCache[qId]) {
			setExpandedQ(prev => prev === qId ? null : qId);
			return;
		}
		setDetailLoading(qId);
		setExpandedQ(qId);
		try {
			const res = await ExamPracticeService.examPracticeGatewayControllerGetDetailedQuestionInfoV1(qId);
			if (res.data) {
				setDetailCache(prev => ({ ...prev, [qId]: res.data as QuestionDetailDto }));
			}
		} catch (err) {
			console.error('Failed to load question detail:', err);
		} finally {
			setDetailLoading(null);
		}
	}, [detailCache]);

	const tagAnalysis = useMemo(() => {
		const filtered = analysisPart === 'overview'
			? flatQuestions
			: flatQuestions.filter(x => x.part === analysisPart);

		const byTag = new Map<string, { correct: number; incorrect: number; skipped: number; questions: number[] }>();

		for (const item of filtered) {
			const st = questionStatusById.get(item.q.id) || 'skipped';
			const tags = item.q.tags?.length ? item.q.tags : ['Khác'];

			for (const tag of tags) {
				if (!byTag.has(tag)) byTag.set(tag, { correct: 0, incorrect: 0, skipped: 0, questions: [] });
				const entry = byTag.get(tag)!;
				entry.questions.push(item.globalIndex);
				if (st === 'correct') entry.correct++;
				else if (st === 'incorrect') entry.incorrect++;
				else entry.skipped++;
			}
		}

		const rows = Array.from(byTag.entries()).map(([tag, data]) => ({
			tag,
			...data,
			total: data.correct + data.incorrect + data.skipped,
			accuracy: data.correct + data.incorrect > 0
				? ((data.correct / (data.correct + data.incorrect)) * 100).toFixed(2)
				: '–',
		}));

		const totals = rows.reduce(
			(acc, r) => ({ correct: acc.correct + r.correct, incorrect: acc.incorrect + r.incorrect, skipped: acc.skipped + r.skipped }),
			{ correct: 0, incorrect: 0, skipped: 0 }
		);
		const totalAcc = totals.correct + totals.incorrect > 0
			? ((totals.correct / (totals.correct + totals.incorrect)) * 100).toFixed(2)
			: '–';

		return { rows, totals, totalAcc };
	}, [flatQuestions, questionStatusById, analysisPart]);

	const questionsByPart = useMemo(() => {
		const groups = new Map<number, FlatQuestion[]>();
		for (const item of flatQuestions) {
			const p = item.part ?? 0;
			if (!groups.has(p)) groups.set(p, []);
			groups.get(p)!.push(item);
		}
		return Array.from(groups.entries()).sort(([a], [b]) => a - b);
	}, [flatQuestions]);

	if (isWritingTest) return null;

	const analysisTabs = [
		{ key: 'overview' as const, label: 'Tổng quát' },
		...toeicParts.map(p => ({ key: p, label: `Part ${p}` })),
	];

	return (
		<div className="space-y-8">
			{/* Phân tích chi tiết */}
			<div className="space-y-4">
				<div className="flex items-center gap-3 border-b border-slate-200 pb-4">
					<Target className="w-6 h-6 text-primary" />
					<h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Phân tích chi tiết</h2>
				</div>

				{toeicParts.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{analysisTabs.map(tab => (
							<button
								key={String(tab.key)}
								onClick={() => setAnalysisPart(tab.key)}
								className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
									analysisPart === tab.key
										? 'bg-primary text-white shadow-md'
										: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
				)}

				<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
								<th className="text-left px-4 py-3 font-bold">Phân loại câu hỏi</th>
								<th className="text-center px-3 py-3 font-bold whitespace-nowrap">Đúng</th>
								<th className="text-center px-3 py-3 font-bold whitespace-nowrap">Sai</th>
								<th className="text-center px-3 py-3 font-bold whitespace-nowrap">Bỏ qua</th>
								<th className="text-center px-3 py-3 font-bold whitespace-nowrap">Độ chính xác</th>
								<th className="text-left px-4 py-3 font-bold">Danh sách câu</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-slate-700">
							{tagAnalysis.rows.map(row => (
								<tr key={row.tag} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
									<td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{row.tag}</td>
									<td className="text-center px-3 py-3 font-bold text-green-600">{row.correct}</td>
									<td className="text-center px-3 py-3 font-bold text-red-500">{row.incorrect}</td>
									<td className="text-center px-3 py-3 text-slate-400">{row.skipped}</td>
									<td className={`text-center px-3 py-3 font-bold ${
										row.accuracy === '–' ? 'text-slate-400' :
										parseFloat(row.accuracy) >= 80 ? 'text-green-600' :
										parseFloat(row.accuracy) >= 50 ? 'text-amber-600' : 'text-red-500'
									}`}>{row.accuracy === '–' ? '–' : `${row.accuracy}%`}</td>
									<td className="px-4 py-3 text-slate-500 text-xs">{row.questions.join(' ')}</td>
								</tr>
							))}
							<tr className="bg-slate-50 dark:bg-slate-800/80 font-bold">
								<td className="px-4 py-3 text-slate-800 dark:text-slate-200">Tổng cộng</td>
								<td className="text-center px-3 py-3 text-green-600">{tagAnalysis.totals.correct}</td>
								<td className="text-center px-3 py-3 text-red-500">{tagAnalysis.totals.incorrect}</td>
								<td className="text-center px-3 py-3 text-slate-400">{tagAnalysis.totals.skipped}</td>
								<td className={`text-center px-3 py-3 ${
									tagAnalysis.totalAcc === '–' ? 'text-slate-400' : 'text-primary'
								}`}>{tagAnalysis.totalAcc === '–' ? '–' : `${tagAnalysis.totalAcc}%`}</td>
								<td className="px-4 py-3"></td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{/* Đáp án */}
			<div className="space-y-4">
				<div className="flex items-center gap-3 border-b border-slate-200 pb-4">
					<CheckCircle2 className="w-6 h-6 text-primary" />
					<h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Đáp án</h2>
				</div>

				<div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-3 text-sm text-amber-800 dark:text-amber-200">
					<strong>Chú ý:</strong> Khi làm lại các câu sai, điểm trung bình của bạn sẽ <strong>KHÔNG BỊ ẢNH HƯỞNG</strong>.
				</div>

				<div className="space-y-6">
					{questionsByPart.map(([partNum, items]) => (
						<div key={partNum}>
							<h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-3">
								{partNum > 0 ? `Part ${partNum}` : 'Câu hỏi'}
							</h3>
							<div className="space-y-1">
								{items.map(item => {
									const st = questionStatusById.get(item.q.id) || 'skipped';
									const userAns = getUserAnswer(item.q.id);
									const correctAns = getCorrectKey(item.q);
									const isExpanded = expandedQ === item.q.id;
									const detail = detailCache[item.q.id];
									const isLoading = detailLoading === item.q.id;

									return (
										<div key={item.q.id}>
											<div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
												isExpanded ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
											}`}>
												<span className="font-bold text-slate-500 w-8 text-right tabular-nums">{item.globalIndex}</span>
												<span className={`font-bold min-w-[20px] ${
													st === 'correct' ? 'text-green-600' :
													st === 'incorrect' ? 'text-red-500' :
													'text-slate-400'
												}`}>{userAns || '–'}</span>
												<span className="text-slate-400">:</span>
												<span className="font-bold text-slate-700 dark:text-slate-200 min-w-[20px]">{correctAns}</span>

												{st === 'correct' && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
												{st === 'incorrect' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
												{st === 'skipped' && <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}

												<button
													onClick={() => fetchDetail(item.q.id)}
													className={`ml-auto text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
														isExpanded
															? 'bg-primary text-white'
															: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
													}`}
												>
													{isLoading ? (
														<Loader2 className="w-3 h-3 animate-spin" />
													) : (
														<ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
													)}
													Chi tiết
												</button>
											</div>

											{isExpanded && (
												<div className="ml-12 mr-4 mt-1 mb-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
													{isLoading && !detail ? (
														<div className="flex items-center gap-2 text-slate-500 py-4">
															<Loader2 className="w-4 h-4 animate-spin" />
															<span className="text-sm">Đang tải...</span>
														</div>
													) : detail ? (
														<>
															{detail.sectionContext?.map((ctx, i) => (
																<div key={i} className="space-y-3">
																	{ctx.content && (
																		<p className="text-slate-700 dark:text-slate-300 leading-relaxed">{ctx.content}</p>
																	)}
																	{ctx.fileUrls?.map(url => {
																		const formatted = formatMediaUrl(url);
																		if (isAudioUrl(url)) {
																			return (
																				<div key={url} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
																					<audio controls className="h-8 w-full">
																						<source src={formatted} />
																					</audio>
																				</div>
																			);
																		}
																		if (isImageUrl(url)) {
																			return (
																				<div key={url} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
																					{/* eslint-disable-next-line @next/next/no-img-element */}
																					<img src={formatted} alt="" className="h-auto w-full max-w-md object-contain" />
																				</div>
																			);
																		}
																		return null;
																	})}
																</div>
															))}

															{detail.content && (
																<div className="text-slate-800 dark:text-slate-200 font-medium">{detail.content}</div>
															)}

															{item.q.choices?.length > 0 && (
																<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
																	{item.q.choices.map((c, i) => {
																		const letter = String.fromCharCode(65 + i);
																		const isCorrect = c.isCorrect;
																		const isUserPick = getUserAnswer(item.q.id).split(', ').includes(c.key);
																		return (
																			<div key={c.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
																				isCorrect
																					? 'bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700'
																					: isUserPick
																						? 'bg-red-50 border-red-300 dark:bg-red-900/30 dark:border-red-700'
																						: 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
																			}`}>
																				<span className={`font-bold ${
																					isCorrect ? 'text-green-600' : isUserPick ? 'text-red-500' : 'text-slate-500'
																				}`}>{letter}.</span>
																				<span className={isCorrect ? 'font-bold text-green-700 dark:text-green-400' : isUserPick ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}>
																					{c.content || c.key}
																				</span>
																			</div>
																		);
																	})}
																</div>
															)}

															{detail.explanation && (
																<div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
																	<p className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-2">Giải thích chi tiết đáp án</p>
																	<div className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">{detail.explanation}</div>
																</div>
															)}

															{detail.fileUrls?.length > 0 && (
																<div className="space-y-2">
																	{detail.fileUrls.filter(isAudioUrl).map(url => (
																		<div key={url} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
																			<audio controls className="h-8 w-full">
																				<source src={formatMediaUrl(url)} />
																			</audio>
																		</div>
																	))}
																	{detail.fileUrls.filter(isImageUrl).map(url => (
																		<div key={url} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
																			{/* eslint-disable-next-line @next/next/no-img-element */}
																			<img src={formatMediaUrl(url)} alt="" className="h-auto w-full max-w-md object-contain" />
																		</div>
																	))}
																</div>
															)}
														</>
													) : (
														<p className="text-sm text-red-500">Không thể tải chi tiết câu hỏi.</p>
													)}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
