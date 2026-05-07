'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

import { ExamPracticeService } from '@/lib/api/services/ExamPracticeService';
import type { AttemptReviewDto } from '@/lib/api/models/AttemptReviewDto';
import type { QuestionReviewDto } from '@/lib/api/models/QuestionReviewDto';
import type { SectionReviewDto } from '@/lib/api/models/SectionReviewDto';

import { Button } from './ui/button';
import { QuestionCard } from './QuestionCard';

type QuestionStatus = 'correct' | 'incorrect' | 'skipped' | 'manual';

type FlatQuestion = {
	q: QuestionReviewDto;
	part: number | null;
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

function isImageUrl(url: string) {
	return /\.(png|jpg|jpeg|webp|gif)$/i.test(url);
}

function isAudioUrl(url: string) {
	return /\.(mp3|wav|ogg|m4a)$/i.test(url);
}

function inferToeicPartByQuestionNumber(n: number): number {
	// TOEIC standard question number ranges (1..200)
	if (n >= 1 && n <= 6) return 1;
	if (n >= 7 && n <= 31) return 2;
	if (n >= 32 && n <= 70) return 3;
	if (n >= 71 && n <= 100) return 4;
	if (n >= 101 && n <= 130) return 5;
	if (n >= 131 && n <= 146) return 6;
	return 7;
}

function normalizeAssetUrl(url: string) {
	// Backend sometimes returns host:port/path without scheme.
	if (/^https?:\/\//i.test(url)) return url;
	return `https://${url}`;
}

export function TestResultDetail() {
	const { id } = useParams();
	const router = useRouter();

	const [reviewData, setReviewData] = useState<AttemptReviewDto | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [activePart, setActivePart] = useState<number>(1);

	useEffect(() => {
		const fetchReview = async () => {
			if (!id) return;
			try {
				const res = await ExamPracticeService.examPracticeGatewayControllerGetAttemptReviewV1(id as string);
				if (res.data) setReviewData(res.data as AttemptReviewDto);
			} catch (err: any) {
				console.error(err);
				setError('Không thể tải đáp án chi tiết.');
			} finally {
				setLoading(false);
			}
		};
		fetchReview();
	}, [id]);

	const flatQuestions = useMemo((): FlatQuestion[] => {
		if (!reviewData) return [];
		const out: FlatQuestion[] = [];

		const walk = (sections: SectionReviewDto[], inheritedPart: number | null) => {
			for (const s of sections || []) {
				const sectionPart = extractToeicPart(s.name) ?? extractToeicPart(s.directive) ?? inheritedPart;
				for (const q of s.questions || []) {
					const part = extractToeicPartFromTags(q.tags) ?? sectionPart;
					out.push({ q, part });
				}
				if (s.sections && s.sections.length > 0) walk(s.sections, sectionPart);
			}
		};

		walk(reviewData.sections || [], null);
		out.sort((a, b) => (a.q.order ?? 0) - (b.q.order ?? 0) || a.q.id.localeCompare(b.q.id));
		// Fallback: if part is missing, infer based on question number (TOEIC-like).
		const total = out.length;
		if (total > 0) {
			const hasAnyPart = out.some((x) => Boolean(x.part));
			if (!hasAnyPart) {
				for (let i = 0; i < out.length; i++) {
					const n = i + 1;
					if (total >= 146) out[i].part = inferToeicPartByQuestionNumber(n);
					else {
						// Generic fallback: split into 7 buckets
						const bucket = Math.min(7, Math.max(1, Math.ceil((n / total) * 7)));
						out[i].part = bucket;
					}
				}
			}
		}
		return out;
	}, [reviewData]);

	const parts = useMemo(() => {
		const set = new Set<number>();
		for (const item of flatQuestions) if (item.part) set.add(item.part);
		const arr = Array.from(set).sort((a, b) => a - b);
		// Always show 1..7 for TOEIC-like navigation
		return arr.length ? arr : [1, 2, 3, 4, 5, 6, 7];
	}, [flatQuestions]);

	useEffect(() => {
		// ensure activePart exists
		if (parts.length > 0 && !parts.includes(activePart)) setActivePart(parts[0]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [parts.join(',')]);

	const questionStatusById = useMemo(() => {
		const map = new Map<string, QuestionStatus>();
		if (!reviewData) return map;
		for (const item of flatQuestions) {
			const res = reviewData.responses?.find((r) => r.questionId === item.q.id);
			const answers = res?.answers || [];
			let status: QuestionStatus = 'skipped';
			if (answers.length > 0) {
				if (res?.isCorrect === true) status = 'correct';
				else if (res?.isCorrect === false) status = 'incorrect';
				else status = 'manual';
			}
			map.set(item.q.id, status);
		}
		return map;
	}, [flatQuestions, reviewData]);

	const activeQuestions = useMemo(() => flatQuestions.filter((x) => x.part === activePart), [activePart, flatQuestions]);

	const rightMap = useMemo(() => {
		const byPart: Record<number, Array<{ id: string; status: QuestionStatus; order: number }>> = {};
		for (const p of parts) byPart[p] = [];
		for (const item of flatQuestions) {
			if (!item.part) continue;
			byPart[item.part] ??= [];
			byPart[item.part].push({ id: item.q.id, status: questionStatusById.get(item.q.id) || 'skipped', order: item.q.order ?? 0 });
		}
		for (const p of Object.keys(byPart)) {
			byPart[Number(p)].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
		}
		return byPart;
	}, [flatQuestions, parts, questionStatusById]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
			</div>
		);
	}

	if (error || !reviewData) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center gap-4">
				<XCircle className="w-10 h-10 text-red-600" />
				<div className="text-slate-700 font-semibold">{error || 'Không có dữ liệu.'}</div>
				<Button onClick={() => router.push(`/results/${id}`)}>Quay lại</Button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			<div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Button variant="ghost" size="sm" onClick={() => router.push(`/results/${id}`)}>
							<ArrowLeft className="h-4 w-4 mr-1.5" />
							Quay lại kết quả
						</Button>
						<div className="text-sm font-extrabold text-slate-800">Đáp án chi tiết</div>
					</div>
					<div className="flex items-center gap-2 overflow-x-auto">
						{parts.map((p) => (
							<button
								key={p}
								type="button"
								onClick={() => setActivePart(p)}
								className={`px-3 py-2 rounded-xl text-sm font-bold border whitespace-nowrap ${
									activePart === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
								}`}
							>
								Part {p}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
				{/* Main column */}
				<div className="space-y-8">
					{activeQuestions.length === 0 && (
						<div className="rounded-2xl border border-slate-200 p-6 text-slate-700">
							<div className="font-extrabold mb-1">Không có câu hỏi ở Part {activePart}</div>
							<div className="text-sm text-slate-500">
								Part có thể chưa được gắn tag/name đúng. Mình đang dùng fallback theo thứ tự câu hỏi.
							</div>
						</div>
					)}
					{activeQuestions.map((item, idx) => {
						const q = item.q;
						const res = reviewData.responses?.find((r) => r.questionId === q.id);
						const userAnswers = res?.answers || [];
						const status = questionStatusById.get(q.id) || 'skipped';
						const images = (q.fileUrls || []).map(normalizeAssetUrl).filter(isImageUrl);
						const audios = (q.fileUrls || []).map(normalizeAssetUrl).filter(isAudioUrl);

						return (
							<div key={q.id} id={`q-${q.id}`} className="border-b border-slate-200 pb-8">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm">
										{idx + 1}
									</div>
									<div className="text-sm font-extrabold text-slate-800">Part {activePart}</div>
									{status === 'correct' && <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5" />Đúng</span>}
									{status === 'incorrect' && <span className="inline-flex items-center gap-1 text-xs font-extrabold text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-lg"><XCircle className="w-3.5 h-3.5" />Sai</span>}
								</div>

									{audios.length > 0 && (
									<div className="mb-4">
										<audio controls className="w-full">
											<source src={audios[0]} />
										</audio>
									</div>
								)}

								{images.length > 0 && (
									<div className="mb-4 grid grid-cols-1 gap-4">
										{images.slice(0, 3).map((u, i) => (
											<div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img src={u} alt={`q-${q.id}-img-${i}`} className="w-full h-auto object-contain" />
											</div>
										))}
									</div>
								)}

								{q.content && <div className="text-slate-900 font-semibold mb-3">{q.content}</div>}

								{q.choices?.length > 0 && (
									<div className="space-y-2">
										{q.choices.map((c, i) => {
											const isUser = userAnswers.includes(c.key);
											return (
												<div key={c.key ?? i} className={`flex items-center gap-3 p-3 rounded-xl border ${isUser ? 'border-slate-900' : 'border-slate-200'}`}>
													<div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-extrabold ${isUser ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
														{String.fromCharCode(65 + i)}
													</div>
													<div className="text-sm text-slate-800 font-semibold flex-1">{c.content || c.key}</div>
												</div>
											);
										})}
									</div>
								)}

								<div className="mt-4">
									<div className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Đáp án đúng</div>
									<div className="mt-2">
										<QuestionCard q={q} status={status} />
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Right map */}
				<div className="xl:sticky xl:top-20">
					<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
						<div className="text-sm font-extrabold text-slate-800 mb-3">Danh sách câu</div>
						<div className="space-y-3">
							{parts.map((p) => (
								<div key={p}>
									<div className="text-xs font-extrabold text-slate-500 mb-2">Part {p}</div>
									<div className="grid grid-cols-8 gap-2">
										{(rightMap[p] || []).map((q, idx) => {
											const bg =
												q.status === 'correct'
													? 'bg-emerald-100 text-emerald-800 border-emerald-200'
													: q.status === 'incorrect'
														? 'bg-red-100 text-red-800 border-red-200'
														: 'bg-slate-100 text-slate-700 border-slate-200';
											return (
												<button
													key={q.id}
													type="button"
													onClick={() => {
														setActivePart(p);
														setTimeout(() => {
															const el = document.getElementById(`q-${q.id}`);
															el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
														}, 0);
													}}
													className={`h-8 rounded-lg border text-xs font-extrabold ${bg} hover:brightness-95 transition`}
													title={`Câu ${idx + 1}`}
												>
													{idx + 1}
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
