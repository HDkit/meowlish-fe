import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import { PenTool, Loader2, CheckCircle2, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { ExamPracticeService } from '@/lib/api/services/ExamPracticeService';
import type { MinimalExamInfoDto } from '@/lib/api/models/MinimalExamInfoDto';
import type { AttemptReviewDto } from '@/lib/api/models/AttemptReviewDto';
import type { AttemptDataDto } from '@/lib/api/models/AttemptDataDto';
import type { SectionDataDto } from '@/lib/api/models/SectionDataDto';

/* ─────────────────────── Types ─────────────────────── */

interface WritingEvaluationResult {
	overall_score: number;
	sub_scores?: Record<string, number>;
	detailed_feedback?: string;
	corrected_version?: string;
	additionalData?: string;
	corrections?: Array<{
		error_type?: string;
		original_text?: string;
		corrected_text?: string;
		explanation?: string;
	}>;
}

/* ─────────────── Helpers ─────────────── */

/** Extract the first questionId from the nested sections tree */
function findFirstQuestionId(sections: SectionDataDto[]): string | null {
	for (const section of sections) {
		if (section.questions?.length > 0) {
			return section.questions[0].id;
		}
		if (section.sections?.length > 0) {
			const found = findFirstQuestionId(section.sections);
			if (found) return found;
		}
	}
	return null;
}

/**
 * Parse additionalData (JSON or plain text) into WritingEvaluationResult.
 */
function parseAdditionalData(additionalData: string): WritingEvaluationResult {
	try {
		const parsed = JSON.parse(additionalData);
		return { ...parsed, additionalData };
	} catch {
		return {
			overall_score: 0,
			detailed_feedback: additionalData,
			additionalData,
		};
	}
}

/** Find response with additionalData in AttemptReviewDto */
function extractWritingResultFromReview(reviewData: AttemptReviewDto): WritingEvaluationResult | null {
	const writingResponse = reviewData.responses?.find(
		(r) => r.additionalData && r.additionalData.trim().length > 0
	);
	if (!writingResponse?.additionalData) return null;
	return parseAdditionalData(writingResponse.additionalData);
}

/** Wait ms */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/* ─────────────── Component ─────────────── */

export function WritingTest() {
	// --- Exam selection state ---
	const [writingExams, setWritingExams] = useState<MinimalExamInfoDto[]>([]);
	const [selectedExamId, setSelectedExamId] = useState<string>('');
	const [loadingExams, setLoadingExams] = useState(true);
	const [examError, setExamError] = useState<string | null>(null);

	// --- Form state ---
	const [content, setContent] = useState<string>('');

	// --- Evaluation state ---
	const [isEvaluating, setIsEvaluating] = useState(false);
	const [evaluationStep, setEvaluationStep] = useState<string>('');
	const [results, setResults] = useState<WritingEvaluationResult | null>(null);

	// --- Selected exam info ---
	const selectedExam = writingExams.find(e => e.id === selectedExamId);

	/* ─── Fetch writing exams on mount ─── */
	const fetchWritingExams = useCallback(async () => {
		setLoadingExams(true);
		setExamError(null);
		try {
			const res = await ExamPracticeService.examPracticeGatewayControllerFindExamsV1(
				{ tags: ['Writing'] },
				undefined,
				undefined,
				50,
			);

			const data = (res as any)?.data;
			const exams: MinimalExamInfoDto[] = data?.exams ?? [];

			if (exams.length === 0) {
				setExamError('Chưa có đề Writing nào trong hệ thống. Vui lòng liên hệ quản trị viên.');
			} else {
				setWritingExams(exams);
				setSelectedExamId(exams[0].id);
			}
		} catch (err: any) {
			console.error('Error fetching writing exams:', err);
			setExamError('Không thể tải danh sách đề Writing. Vui lòng thử lại.');
		} finally {
			setLoadingExams(false);
		}
	}, []);

	useEffect(() => {
		fetchWritingExams();
	}, [fetchWritingExams]);

	/* ─── Main evaluation flow (BE API) ─── */
	const handleEvaluate = async () => {
		if (!content.trim()) {
			toast.error('Vui lòng nhập bài viết.');
			return;
		}
		if (!selectedExamId) {
			toast.error('Vui lòng chọn đề bài.');
			return;
		}

		setIsEvaluating(true);
		setResults(null);

		try {
			// Step 1: Start attempt
			setEvaluationStep('Đang tạo bài làm...');
			const attemptRes = await ExamPracticeService.examPracticeGatewayControllerAttemptV1(
				selectedExamId,
				{},
			);
			const attemptId: string = (attemptRes as any)?.data?.id;
			if (!attemptId) {
				throw new Error('Không thể tạo bài làm. Server không trả về attemptId.');
			}

			// Step 2: Get saved data to discover questionId
			setEvaluationStep('Đang tải cấu trúc đề...');
			const savedRes = await ExamPracticeService.examPracticeGatewayControllerGetAttemptSavedDataV1(attemptId);
			const savedData = (savedRes as any)?.data as AttemptDataDto | undefined;
			const questionId = savedData?.sections ? findFirstQuestionId(savedData.sections) : null;

			if (!questionId) {
				throw new Error('Không tìm thấy câu hỏi trong đề thi. Đề thi có thể chưa có nội dung.');
			}

			// Step 3: Submit the writing answer
			setEvaluationStep('Đang nộp bài viết...');
			await ExamPracticeService.examPracticeGatewayControllerAnswerV1(
				attemptId,
				questionId,
				{ answer: content.trim() },
			);

			// Step 4: End attempt (triggers BE scoring pipeline)
			setEvaluationStep('Đang nộp bài và chờ chấm điểm...');
			await ExamPracticeService.examPracticeGatewayControllerEndAttemptV1(attemptId);

			// Step 5: Poll for review (scoring may be async)
			setEvaluationStep('Đang chờ AI chấm bài...');
			let reviewResult: WritingEvaluationResult | null = null;
			const maxRetries = 12; // 12 attempts × 5s = 60s max wait

			for (let i = 0; i < maxRetries; i++) {
				await sleep(i === 0 ? 2000 : 5000); // first wait 2s, then 5s intervals

				try {
					const reviewRes = await ExamPracticeService.examPracticeGatewayControllerGetAttemptReviewV1(attemptId);
					const reviewData = (reviewRes as any)?.data as AttemptReviewDto | undefined;

					if (reviewData) {
						reviewResult = extractWritingResultFromReview(reviewData);
						if (reviewResult) break;

						// If we got review data but no additionalData yet, the scoring might still be processing
						if (reviewData.totalPoints != null && reviewData.totalPoints > 0) {
							// Has score but no detailed feedback - use basic info
							reviewResult = {
								overall_score: reviewData.totalPoints,
								detailed_feedback: 'Điểm đã được chấm. Nhận xét chi tiết có thể chưa sẵn sàng.',
							};
							break;
						}
					}
				} catch {
					// Review not ready yet, continue polling
				}

				setEvaluationStep(`Đang chờ AI chấm bài... (${i + 2}/${maxRetries})`);
			}

			if (reviewResult) {
				setResults(reviewResult);
				toast.success('Chấm bài thành công!');
			} else {
				toast.warning('Bài đã được nộp nhưng chưa nhận được kết quả. Vui lòng kiểm tra lại trong Lịch sử.');
				setResults({
					overall_score: 0,
					detailed_feedback: 'Bài đã được nộp thành công. Kết quả chấm bài đang được xử lý, vui lòng kiểm tra lại trong mục **Lịch sử làm bài**.',
				});
			}
		} catch (error: any) {
			console.error('Error evaluating writing via BE:', error);
			const message = error?.body?.error?.message || error?.message || 'Đã xảy ra lỗi khi chấm bài.';
			toast.error(message);
		} finally {
			setIsEvaluating(false);
			setEvaluationStep('');
		}
	};

	const handleReset = () => {
		setContent('');
		setResults(null);
	};

	/* ─── Loading state ─── */
	if (loadingExams) {
		return (
			<div className="w-full flex items-center justify-center py-24">
				<div className="flex flex-col items-center gap-3 text-muted-foreground">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<p className="font-medium">Đang tải danh sách đề Writing...</p>
				</div>
			</div>
		);
	}

	/* ─── Error state ─── */
	if (examError) {
		return (
			<div className="w-full max-w-xl mx-auto py-16">
				<Card className="border-destructive/30">
					<CardContent className="pt-8 pb-8 text-center space-y-4">
						<AlertCircle className="h-12 w-12 text-destructive/60 mx-auto" />
						<p className="text-foreground font-medium">{examError}</p>
						<Button variant="outline" onClick={fetchWritingExams} className="gap-2">
							<RefreshCw className="h-4 w-4" />
							Thử lại
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	/* ─── Main render ─── */
	return (
		<div className="w-full">
			<div className="max-w-7xl mx-auto space-y-8">
				{/* Main Content */}
				<Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm -mt-4">
					<div className="h-1.5 w-full bg-secondary" />
					<CardHeader className="bg-gray-50/50 pb-4 border-b border-gray-100">
						<CardTitle className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
							<PenTool className="h-6 w-6 text-secondary" />
							Phòng thi Writing
						</CardTitle>
						<CardDescription className="text-gray-500 font-medium">
							Chọn đề bài và viết bài. Hệ thống AI sẽ tự động chấm điểm và đưa nhận xét chi tiết.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Exam Selection */}
						<div className="space-y-2">
							<Label htmlFor="examSelect" className="flex items-center gap-2">
								<BookOpen className="h-4 w-4 text-primary" />
								Chọn đề bài
							</Label>
							<Select value={selectedExamId} onValueChange={setSelectedExamId}>
								<SelectTrigger id="examSelect">
									<SelectValue placeholder="Chọn đề bài Writing..." />
								</SelectTrigger>
								<SelectContent>
									{writingExams.map(exam => (
										<SelectItem key={exam.id} value={exam.id}>
											{exam.name}
											{exam.tags?.length > 0 && (
												<span className="text-muted-foreground ml-2">
													({exam.tags.join(', ')})
												</span>
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{selectedExam?.description && (
								<p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50 whitespace-pre-wrap">
									{selectedExam.description}
								</p>
							)}
						</div>

						{/* Content Input */}
						<div className="space-y-2">
							<Label htmlFor="content">Bài viết của bạn</Label>
							<Textarea
								id="content"
								placeholder="Nhập bài viết tiếng Anh tại đây..."
								value={content}
								onChange={(e) => setContent(e.target.value)}
								className="min-h-[350px] w-full"
								disabled={isEvaluating}
							/>
							<div className="flex justify-between text-xs text-muted-foreground">
								<span>{content.split(/\s+/).filter(Boolean).length} từ</span>
								<span>{content.length} ký tự</span>
							</div>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-4 flex-wrap">
							<Button
								onClick={handleEvaluate}
								disabled={isEvaluating || !content.trim() || !selectedExamId}
							>
								{isEvaluating ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										{evaluationStep || 'Đang xử lý...'}
									</>
								) : (
									<>
										<PenTool className="h-4 w-4 mr-2" />
										Nộp & Chấm bài
									</>
								)}
							</Button>
							{results && (
								<Button variant="outline" onClick={handleReset}>
									Làm lại
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Results */}
				{results && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Score & Feedback */}
						<Card className="border-2 shadow-lg">
							<CardHeader className="bg-primary/10 dark:bg-primary/20">
								<div className="flex items-center justify-between">
									<CardTitle className="text-xl">Điểm & nhận xét chung</CardTitle>
									{results.overall_score > 0 && (
										<div className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-md">
											{results.overall_score}
										</div>
									)}
								</div>
							</CardHeader>
							<CardContent className="space-y-6 pt-6">
								{/* Sub-scores */}
								{results.sub_scores && Object.keys(results.sub_scores).length > 0 && (
									<div className="space-y-3">
										<h4 className="font-semibold text-base mb-3">Điểm chi tiết:</h4>
										{Object.entries(results.sub_scores).map(([name, value]) => (
											<div key={name} className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg border border-border/50">
												<span className="text-sm font-medium text-foreground">{name}</span>
												<span className="font-bold text-lg text-primary">{value}</span>
											</div>
										))}
									</div>
								)}

								{/* Detailed Feedback */}
								{results.detailed_feedback && (
									<div className="space-y-3">
										<h4 className="font-semibold text-base">Nhận xét chi tiết</h4>
										<div className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-5 rounded-lg border border-border/50 leading-relaxed">
											{results.detailed_feedback}
										</div>
									</div>
								)}

								{/* Raw additionalData fallback */}
								{!results.detailed_feedback && results.additionalData && (
									<div className="space-y-3">
										<h4 className="font-semibold text-base flex items-center gap-2">
											<AlertCircle className="h-4 w-4 text-amber-500" />
											Nhận xét từ hệ thống
										</h4>
										<div className="text-sm text-foreground whitespace-pre-wrap bg-amber-50 dark:bg-amber-950/30 p-5 rounded-lg border border-amber-200 dark:border-amber-800 leading-relaxed">
											{results.additionalData}
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Corrections */}
						<Card className="border-2 shadow-lg">
							<CardHeader className="bg-secondary/10 dark:bg-secondary/20">
								<CardTitle className="text-xl">Bài viết chỉnh sửa & lỗi cụ thể</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6 pt-6">
								{/* Corrected Version */}
								{results.corrected_version && (
									<div className="space-y-3">
										<div className="flex items-center gap-2 text-sm font-medium">
											<span className="w-3 h-3 rounded-full bg-secondary"></span>
											<span>Phiên bản đã chỉnh sửa</span>
										</div>
										<div className="text-sm whitespace-pre-wrap bg-green-50 dark:bg-green-950/30 p-5 rounded-lg border-2 border-green-200 dark:border-green-800 max-h-[250px] overflow-y-auto leading-relaxed">
											{results.corrected_version}
										</div>
									</div>
								)}

								{/* Corrections List */}
								<div className="space-y-3">
									<h4 className="font-semibold text-base">
										Danh sách lỗi ({results.corrections?.length || 0})
									</h4>
									{results.corrections && results.corrections.length > 0 ? (
										<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
											{results.corrections.map((correction, idx) => (
												<div
													key={idx}
													className="p-4 border-2 border-dashed border-red-200 dark:border-red-800 rounded-lg space-y-3 bg-red-50/50 dark:bg-red-950/20"
												>
													<div className="flex items-center gap-2">
														<span className="w-3 h-3 rounded-full bg-red-500"></span>
														<span className="font-semibold text-sm">
															Lỗi {idx + 1} - {correction.error_type || 'Không xác định'}
														</span>
													</div>
													<div className="space-y-2 text-sm">
														<div className="flex items-start gap-2">
															<strong className="text-red-700 dark:text-red-400 min-w-[50px]">Gốc:</strong>
															<span className="text-red-600 dark:text-red-400 line-through">
																{correction.original_text || 'N/A'}
															</span>
														</div>
														<div className="flex items-start gap-2">
															<strong className="text-green-700 dark:text-green-400 min-w-[50px]">Sửa:</strong>
															<span className="text-green-600 dark:text-green-400 font-medium">
																{correction.corrected_text || 'N/A'}
															</span>
														</div>
														{correction.explanation && (
															<div className="pt-2 border-t border-border/50">
																<strong className="text-muted-foreground">Giải thích:</strong>{' '}
																<span className="text-muted-foreground">{correction.explanation}</span>
															</div>
														)}
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="text-sm text-muted-foreground flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
											<CheckCircle2 className="h-5 w-5 text-green-500" />
											<span>Không có lỗi cụ thể nào được liệt kê.</span>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}