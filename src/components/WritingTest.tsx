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
import { PenTool, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface WritingEvaluationResult {
	overall_score: number;
	sub_scores?: Record<string, number>;
	detailed_feedback?: string;
	corrected_version?: string;
	corrections?: Array<{
		error_type?: string;
		original_text?: string;
		corrected_text?: string;
		explanation?: string;
	}>;
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
- Could use more sophisticated grammatical structures

**Recommendations:**
To reach Band 8+, focus on:
1. Adding more specific examples and evidence
2. Using more complex sentence structures
3. Expanding vocabulary range further
4. Proofreading for spelling and punctuation errors`,
			corrected_version: `The question of whether technology has improved our lives is a topic of ongoing debate. While some argue that technology has created more problems than it has solved, I firmly believe that technological advancements have significantly enhanced our quality of life.

To begin with, technology has revolutionized communication. In the past, people had to wait weeks or months to receive letters from distant relatives. Today, we can instantly connect with anyone around the world through video calls and messaging apps. This has brought families closer together and made long-distance relationships more manageable.

Furthermore, medical technology has saved countless lives. Advanced diagnostic tools allow doctors to detect diseases earlier, and modern treatments have cured conditions that were once fatal. For example, vaccines have eradicated diseases like smallpox and significantly reduced the spread of others.

However, it is important to acknowledge that technology also has drawbacks. Some people spend too much time on their devices, which can lead to social isolation. Additionally, privacy concerns have emerged as personal data becomes more accessible.

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
- Minor grammatical errors throughout

**Score Breakdown:**
- Content: 85/100 - Good ideas but could be more developed
- Organization: 80/100 - Clear structure but transitions could be smoother`,
			corrected_version: `Technology has transformed the way we live and work in the 21st century. While some people worry about the negative effects of technology, I believe that its benefits far outweigh its drawbacks.

First, technology has made communication much easier. We can now contact people anywhere in the world instantly through email, video calls, and social media. This has helped businesses operate globally and families stay connected.

Second, technology has improved healthcare significantly. Doctors can now diagnose diseases more accurately and treat patients more effectively. Medical research has also advanced rapidly thanks to new technologies.

However, technology does have some disadvantages. Some people spend too much time on their devices and neglect face-to-face relationships. There are also concerns about privacy and data security.

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

	const handleEvaluate = async () => {
		if (!question.trim() || !content.trim()) {
			toast.error('Vui lòng nhập đầy đủ đề bài và bài viết.');
			return;
		}

		setIsEvaluating(true);
		setResults(null);

		try {
			const API_BASE = window.location.origin;
			const response = await fetch(`${API_BASE}/writing/evaluate`, {
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
				throw new Error('Failed to evaluate writing');
			}

			const data: WritingEvaluationResult = await response.json();
			setResults(data);
			toast.success('Chấm bài thành công!');
		} catch (error) {
			console.error('Error evaluating writing:', error);
			// Fallback to mock data if API fails
			console.log('Using mock data for testing...');
			setTimeout(() => {
				const mockData = getMockData(examType);
				setResults(mockData);
				toast.success('Chấm bài thành công! (Mock data)');
			}, 1000);
		} finally {
			setIsEvaluating(false);
		}
	};

	const handleTestWithMockData = () => {
		setIsEvaluating(true);
		setResults(null);

		// Set some sample data
		if (!question.trim()) {
			setQuestion('Some people think that technology has made our lives more complicated. Others believe it has made our lives easier. Discuss both views and give your own opinion.');
		}
		if (!content.trim()) {
			setContent('Technology have improved our life in many ways. We can now communicate with people all over the world easily. Medical technology help doctors treat patients better. However, some people spend too much time on their devices. In conclusion, I think technology is good for us.');
		}

		setTimeout(() => {
			const mockData = getMockData(examType);
			setResults(mockData);
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
					<div className="h-1.5 w-full bg-gradient-to-r from-secondary to-secondary/80" />
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
								<Label htmlFor="targetScore">
									Mục tiêu điểm (tùy chọn)
								</Label>
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
							<CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20">
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
													<span className="font-bold text-lg text-primary">
														{value}
													</span>
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
							</CardContent>
						</Card>

						{/* Corrections */}
						<Card className="border-2 shadow-lg">
							<CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/5 dark:from-secondary/20 dark:to-secondary/10">
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
									<h4 className="font-semibold text-base">Danh sách lỗi ({results.corrections?.length || 0})</h4>
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

