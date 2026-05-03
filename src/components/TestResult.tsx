'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, RefreshCw, Target, Trophy, XCircle } from 'lucide-react';

import { ExamPracticeService } from '@/lib/api/services/ExamPracticeService';
import type { AttemptReviewDto } from '@/lib/api/models/AttemptReviewDto';
import type { QuestionReviewDto } from '@/lib/api/models/QuestionReviewDto';
import type { SectionReviewDto } from '@/lib/api/models/SectionReviewDto';
import { useAppSelector } from '@/lib/store/hooks';

import { Button } from './ui/button';
import { AICard, QuestionCard } from './QuestionCard';

type QuestionStatus = 'correct' | 'incorrect' | 'skipped' | 'manual';

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

	const scoreLabel = isToeicLike ? 'Điểm TOEIC' : 'Điểm';
	const scoreValue = isToeicLike ? (toeicScore?.totalScaled ?? 0) : reviewData?.totalPoints ?? 0;
	const scoreDenom = isToeicLike ? 990 : 100;

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

	return (
		<div className="min-h-screen bg-slate-50 pb-20">
			{/* Header */}
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

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 -mt-10 relative z-20">
				{/* Part tabs + filter */}
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

				{/* Stats */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
						<div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-1 border border-slate-100">
							<Clock className="h-6 w-6" />
						</div>
						<span className="text-sm font-bold text-slate-500 uppercase">Thời gian</span>
						<span className="text-2xl font-black text-slate-800">{formatTime(timeTakenSeconds)}</span>
					</div>
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
					<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
						<div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-1 border border-slate-100">
							<AlertCircle className="h-6 w-6" />
						</div>
						<span className="text-sm font-bold text-slate-500 uppercase">Bỏ qua</span>
						<span className="text-2xl font-black text-slate-800">{stats.skipped}</span>
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
						<Target className="w-6 h-6 text-primary" />
						<h2 className="text-2xl font-extrabold text-slate-800">Đáp án chi tiết</h2>
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

								return (
									<div id={`q-${q.id}`} key={q.id} className={`bg-white rounded-2xl border-l-[6px] shadow-sm hover:shadow-md transition-shadow overflow-hidden ${theme.borderClass}`}>
										<div className={`px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${theme.bgHeaderClass} border-b border-slate-100`}>
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-slate-700">{index + 1}</div>
												<span className={`inline-flex items-center gap-1.5 font-bold uppercase text-xs px-3 py-1.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
													<theme.Icon className="w-3.5 h-3.5" />
													{statusLabel(status)}
												</span>
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
											
											{res?.additionalData && (
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
																// If not JSON, just show text
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
										const bg =
											st === 'correct'
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
												title={`Câu ${idx + 1}`}
											>
												{idx + 1}
											</button>
										);
									})}
								</div>
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

