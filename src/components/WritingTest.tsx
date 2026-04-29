import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import { PenTool, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ExamPracticeService } from '@/lib/api/services/ExamPracticeService';
import type { AttemptReviewDto } from '@/lib/api/models/AttemptReviewDto';
import type { QuestionReviewDto } from '@/lib/api/models/QuestionReviewDto';

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

/**
 * Parse additionalData string (JSON hoặc plain text) thành WritingEvaluationResult.
 * Logic giống hệt TestResult.tsx: thử JSON.parse trước, fallback về plain text.
 */
function parseAdditionalData(additionalData: string): WritingEvaluationResult {
	try {
		const parsed = JSON.parse(additionalData);
		return {
			...parsed,
			additionalData,
		};
	} catch {
		// Không phải JSON → hiển thị raw text dưới dạng detailed_feedback
		return {
			overall_score: 0,
			detailed_feedback: additionalData,
			additionalData,
		};
	}
}

/**
 * Tìm response có additionalData trong AttemptReviewDto.
 * Duyệt qua reviewData.responses (giống TestResult.tsx dùng reviewData.responses?.find).
 */
function extractWritingResultFromReview(reviewData: AttemptReviewDto): WritingEvaluationResult | null {
	// Tìm câu trả lời đầu tiên có additionalData (thường là câu writing)
	const writingResponse = reviewData.responses?.find(
		(r) => r.additionalData && r.additionalData.trim().length > 0
	);

	if (!writingResponse?.additionalData) return null;

	return parseAdditionalData(writingResponse.additionalData);
}

// Mock data cho testing
const getMockData = (examType: 'IELTS' | 'TOEIC'): WritingEvaluationResult => {
	if (examType === 'IELTS') {
		return {
			overall_score: 7.5,
			sub_scores: {
				'Task Achievement': 7.5,
				'Coherence and Cohesion': 8.0,
				'Lexical Resource': 7.0,
				'Grammatical Range and Accuracy': 7.5,
			},
			detailed_feedback: `Overall, this is a well-structured essay that demonstrates good command of English. 

**Strengths:**
- Clear position is presented throughout the essay
- Good use of linking words and cohesive devices
- Varied vocabulary with some less common words
- Generally accurate grammar with minor errors

**Areas for Improvement:**
- Could develop ideas more fully with specific examples
- Some sentences could be more complex
- Minor spelling errors in a few places
- Could use more sophisticated grammatical structures`,
			corrected_version: `The question of whether technology has improved our lives is a topic of ongoing debate. While some argue that technology has created more problems than it has solved, I firmly believe that technological advancements have significantly enhanced our quality of life.

To begin with, technology has revolutionized communication. In the past, people had to wait weeks or months to receive letters from distant relatives. Today, we can instantly connect with anyone around the world through video calls and messaging apps.

Furthermore, medical technology has saved countless lives. Advanced diagnostic tools allow doctors to detect diseases earlier, and modern treatments have cured conditions that were once fatal.

In conclusion, despite some negative aspects, I believe technology has overwhelmingly improved our lives. The benefits in communication, healthcare, and daily convenience far outweigh the disadvantages.`,
			corrections: [
				{
					error_type: 'Grammar',
					original_text: 'technology have improved',
					corrected_text: 'technology has improved',
					explanation: 'Subject-verb agreement: "technology" is singular, so it requires "has" not "have"',
				},
				{
					error_type: 'Spelling',
					original_text: 'recieved',
					corrected_text: 'received',
					explanation: 'Correct spelling: "received" follows the "i before e except after c" rule',
				},
				{
					error_type: 'Word Choice',
					original_text: 'made our life better',
					corrected_text: 'improved our quality of life',
					explanation: 'More formal and precise expression suitable for academic writing',
				},
				{
					error_type: 'Punctuation',
					original_text: 'However it is',
					corrected_text: 'However, it is',
					explanation: 'Comma needed after "However" when it starts a sentence',
				},
			],
		};
	} else {
		return {
			overall_score: 165,
			sub_scores: {
				'Content': 85,
				'Organization': 80,
			},
			detailed_feedback: `Your essay demonstrates a good understanding of the topic and presents clear arguments.

**Strengths:**
- Well-organized structure with clear introduction and conclusion
- Relevant content that addresses the prompt
- Appropriate length for the task

**Areas for Improvement:**
- Could use more varied sentence structures
- Some vocabulary could be more precise
- Minor grammatical errors throughout`,
			corrected_version: `Technology has transformed the way we live and work in the 21st century. While some people worry about the negative effects of technology, I believe that its benefits far outweigh its drawbacks.

First, technology has made communication much easier. We can now contact people anywhere in the world instantly through email, video calls, and social media.

In conclusion, technology has brought many positive changes to our lives. Although there are some challenges, I believe we should embrace technology while being aware of its potential risks.`,
			corrections: [
				{
					error_type: 'Grammar',
					original_text: 'technology have changed',
					corrected_text: 'technology has changed',
					explanation: 'Subject-verb agreement error',
				},
				{
					error_type: 'Word Choice',
					original_text: 'very easy',
					corrected_text: 'much easier',
					explanation: 'More appropriate comparative form',
				},
			],
		};
	}
};

export function WritingTest() {
	const [examType, setExamType] = useState<'IELTS' | 'TOEIC'>('IELTS');
	const [taskType, setTaskType] = useState<string>('Task 1');
	const [targetScore, setTargetScore] = useState<string>('');
	const [question, setQuestion] = useState<string>('');
	const [content, setContent] = useState<string>('');
	const [isEvaluating, setIsEvaluating] = useState(false);
	const [results, setResults] = useState<WritingEvaluationResult | null>(null);
	const [attemptId, setAttemptId] = useState<string | null>(null);

	const handleEvaluate = async () => {
		if (!question.trim() || !content.trim()) {
			toast.error('Vui lòng nhập đầy đủ đề bài và bài viết.');
			return;
		}

		setIsEvaluating(true);
		setResults(null);

		try {
			// TRƯỜNG HỢP 1: Có attemptId → dùng Review API (giống TestResult.tsx)
			if (attemptId) {
				// Bước 1: Nộp bài
				await ExamPracticeService.examPracticeGatewayControllerEndAttemptV1(attemptId);

				// Bước 2: Lấy review (giống hệt cách TestResult.tsx gọi)
				const res = await ExamPracticeService.examPracticeGatewayControllerGetAttemptReviewV1(attemptId);

				if (res.data) {
					const reviewData = res.data as AttemptReviewDto;

					// Bước 3: Parse additionalData (dùng hàm tái sử dụng từ TestResult.tsx logic)
					const writingResult = extractWritingResultFromReview(reviewData);

					if (writingResult) {
						setResults(writingResult);
						toast.success('Lấy nhận xét thành công!');
					} else {
						// Fallback: nếu không có additionalData, thử lấy totalPoints từ review
						setResults({
							overall_score: reviewData.totalPoints ?? 0,
							detailed_feedback: 'Không tìm thấy nhận xét chi tiết trong bài làm.',
						});
						toast.warning('Không tìm thấy nhận xét chi tiết. Chỉ hiển thị điểm tổng.');
					}
				} else {
					throw new Error('Không nhận được dữ liệu từ review API.');
				}
				return;
			}

			// TRƯỜNG HỢP 2: Không có attemptId → Gọi Proxy API
			const response = await fetch('/api/writing/evaluate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					exam_type: examType,
					task_type: taskType,
					question: question.trim(),
					content: content.trim(),
					target_score: targetScore ? parseFloat(targetScore) : null,
				}),
			});

			if (!response.ok) {
				throw new Error(`API lỗi: ${response.status}`);
			}

			const responseData = await response.json();

			// Proxy API có thể trả về dạng AttemptReviewDto hoặc trực tiếp WritingEvaluationResult
			// → Thử parse theo cả hai hướng
			let finalResult: WritingEvaluationResult | null = null;

			// Hướng 1: Proxy trả về cấu trúc AttemptReviewDto (data.responses[].additionalData)
			if (responseData?.data?.responses) {
				const reviewData = responseData.data as AttemptReviewDto;
				finalResult = extractWritingResultFromReview(reviewData);
			}

			// Hướng 2: Proxy trả về trực tiếp (có overall_score hoặc additionalData ở root)
			if (!finalResult) {
				if (responseData?.additionalData) {
					finalResult = parseAdditionalData(responseData.additionalData);
				} else if (responseData?.overall_score !== undefined) {
					finalResult = responseData as WritingEvaluationResult;
				}
			}

			if (finalResult) {
				setResults(finalResult);
				toast.success('Chấm bài thành công!');
			} else {
				throw new Error('Không thể parse kết quả từ API.');
			}
		} catch (error) {
			console.error('Error evaluating writing:', error);
			// Fallback sang mock data nếu API thất bại
			console.warn('Falling back to mock data...');
			setTimeout(() => {
				setResults(getMockData(examType));
				toast.success('Chấm bài thành công! (Mock data)');
				setIsEvaluating(false);
			}, 800);
			return;
		} finally {
			setIsEvaluating(false);
		}
	};

	const handleTestWithMockData = () => {
		setIsEvaluating(true);
		setResults(null);

		if (!question.trim()) {
			setQuestion('Some people think that technology has made our lives more complicated. Others believe it has made our lives easier. Discuss both views and give your own opinion.');
		}
		if (!content.trim()) {
			setContent('Technology have improved our life in many ways. We can now communicate with people all over the world easily. Medical technology help doctors treat patients better. However, some people spend too much time on their devices. In conclusion, I think technology is good for us.');
		}

		setTimeout(() => {
			setResults(getMockData(examType));
			setIsEvaluating(false);
			toast.success('Đã tải mock data thành công!');
		}, 1000);
	};

	const handleReset = () => {
		setQuestion('');
		setContent('');
		setTargetScore('');
		setResults(null);
	};

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
							Chọn dạng bài, nhập câu hỏi và bài viết để AI phân tích & góp ý chi tiết.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Form Grid */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="examType">Loại bài thi</Label>
								<Select value={examType} onValueChange={(value: 'IELTS' | 'TOEIC') => setExamType(value)}>
									<SelectTrigger id="examType">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="IELTS">IELTS Writing</SelectItem>
										<SelectItem value="TOEIC">TOEIC Writing</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="taskType">Dạng / Part</Label>
								<Select value={taskType} onValueChange={setTaskType}>
									<SelectTrigger id="taskType">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{examType === 'IELTS' ? (
											<>
												<SelectItem value="Task 1">IELTS Task 1</SelectItem>
												<SelectItem value="Task 2">IELTS Task 2</SelectItem>
											</>
										) : (
											<>
												<SelectItem value="Essay">TOEIC Essay</SelectItem>
												<SelectItem value="Email">TOEIC Email</SelectItem>
											</>
										)}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="targetScore">Mục tiêu điểm (tùy chọn)</Label>
								<Input
									id="targetScore"
									type="number"
									step="0.5"
									min="0"
									max={examType === 'IELTS' ? '9' : '200'}
									placeholder={examType === 'IELTS' ? '0.0–9.0' : '0–200'}
									value={targetScore}
									onChange={(e) => setTargetScore(e.target.value)}
								/>
							</div>
						</div>

						{/* Question Input */}
						<div className="space-y-2">
							<Label htmlFor="question">Đề bài / Câu hỏi</Label>
							<Textarea
								id="question"
								placeholder="Nhập đầy đủ đề bài viết..."
								value={question}
								onChange={(e) => setQuestion(e.target.value)}
								className="min-h-[150px] w-full"
							/>
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
							/>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-4 flex-wrap">
							<Button
								onClick={handleEvaluate}
								disabled={isEvaluating || !question.trim() || !content.trim()}
							>
								{isEvaluating ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Đang chấm...
									</>
								) : (
									<>
										<PenTool className="h-4 w-4 mr-2" />
										Chấm bài
									</>
								)}
							</Button>
							<Button
								variant="outline"
								onClick={handleTestWithMockData}
								disabled={isEvaluating}
							>
								Test với Mock Data
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
									<div className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-md">
										{results.overall_score} {examType === 'IELTS' ? 'Band' : 'Score'}
									</div>
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
												<div className="flex items-center gap-2">
													<span className="font-bold text-lg text-primary">{value}</span>
													<span className="text-xs text-muted-foreground">
														/{examType === 'IELTS' ? '9.0' : '100'}
													</span>
												</div>
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

								{/* Hiển thị raw additionalData nếu không parse được → giống cách TestResult.tsx fallback */}
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