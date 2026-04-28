import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Clock,
  Volume2,
  BookOpen,
  Target,
  Award,
  AlertCircle,
  Lightbulb,
  BarChart3,
  Play,
  Loader2,
  Save
} from 'lucide-react';
import { SpeakingTestData } from './SpeakingTest';
import { geminiService, type SpeakingContext } from '../services/geminiService';
import { sessionStorageService } from '../services/sessionStorageService';
import { toast } from 'sonner';

interface SpeakingResultsProps {
  data: SpeakingTestData;
  onBack: () => void;
}

interface Feedback {
  category: string;
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  examples: string[];
}

export function SpeakingResults({ data, onBack }: SpeakingResultsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [feedback, setFeedback] = useState<Feedback[] | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Generate AI feedback on component mount
  useEffect(() => {
    generateAIFeedback();
  }, []);

  const generateAIFeedback = async () => {
    setIsGeneratingFeedback(true);
    
    try {
      // Build context for Gemini
      const context: SpeakingContext = {
        part: data.part,
        previousQuestions: data.questions,
        userAnswers: data.userAnswers.map(ua => ua.transcript),
        sessionDuration: data.totalDuration,
        questionCount: data.userAnswers.length
      };

      // Prepare user answers with question context
      const userAnswersWithContext = data.userAnswers.map((answer, index) => ({
        question: data.questions[index] || 'No question recorded',
        answer: answer.transcript,
        duration: answer.duration
      }));

      // Generate feedback using Gemini
      const aiFeedback = await geminiService.generateFeedback(context, userAnswersWithContext);
      
      // Convert to our Feedback format
      const convertedFeedback: Feedback[] = aiFeedback.criteria.map((criterion: any) => ({
        category: criterion.name,
        score: criterion.score,
        maxScore: 9.0,
        strengths: criterion.strengths,
        improvements: criterion.improvements,
        examples: criterion.examples
      }));

      setFeedback(convertedFeedback);

      // Save session with feedback
      const savedSessionId = sessionStorageService.saveSession(data, aiFeedback);
      setSessionId(savedSessionId);
      
      toast.success('Phân tích AI hoàn tất và đã lưu kết quả');
      
    } catch (error) {
      console.error('Failed to generate AI feedback:', error);
      toast.warning('Sử dụng feedback mặc định do lỗi AI');
      
      // Fallback to mock feedback
      const mockFeedback = generateMockFeedback();
      setFeedback(mockFeedback);
      
      // Save without AI feedback
      const savedSessionId = sessionStorageService.saveSession(data);
      setSessionId(savedSessionId);
      
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  // Generate mock feedback as fallback
  const generateMockFeedback = (): Feedback[] => {
    return [
      {
        category: 'Fluency & Coherence',
        score: 7.0,
        maxScore: 9.0,
        strengths: [
          'Có khả năng duy trì cuộc trò chuyện một cách tự nhiên',
          'Sử dụng các từ nối (linking words) phù hợp',
          'Ít do dự, lưỡng lự khi nói'
        ],
        improvements: [
          'Có thể phát triển ý sâu hơn với nhiều ví dụ cụ thể',
          'Nên tránh lặp lại từ vựng quá nhiều lần',
          'Cần cải thiện khả năng tự sửa lỗi khi nói'
        ],
        examples: [
          '✓ "Well, actually..." - Sử dụng tốt từ nối',
          '✗ Có một số chỗ pause không cần thiết'
        ]
      },
      {
        category: 'Lexical Resource',
        score: 6.5,
        maxScore: 9.0,
        strengths: [
          'Sử dụng từ vựng đa dạng cho các chủ đề khác nhau',
          'Có sử dụng idioms và collocations',
          'Paraphrase tốt thay vì lặp lại từ trong câu hỏi'
        ],
        improvements: [
          'Cần mở rộng vốn từ vựng học thuật (academic vocabulary)',
          'Sử dụng less common vocabulary nhiều hơn',
          'Chú ý word form (danh từ, động từ, tính từ)'
        ],
        examples: [
          '✓ "fascinating", "significant impact"',
          '✗ Lặp từ "good" nhiều lần, nên dùng "excellent", "remarkable"'
        ]
      },
      {
        category: 'Grammatical Range & Accuracy',
        score: 6.0,
        maxScore: 9.0,
        strengths: [
          'Sử dụng đúng các thì cơ bản',
          'Có cố gắng dùng câu phức (complex sentences)',
          'Ít lỗi ngữ pháp cơ bản'
        ],
        improvements: [
          'Tăng cường sử dụng câu điều kiện (conditional sentences)',
          'Chú ý subject-verb agreement',
          'Sử dụng passive voice để đa dạng cấu trúc câu'
        ],
        examples: [
          '✓ Sử dụng present perfect tense chính xác',
          '✗ Có vài lỗi về article (a/an/the)'
        ]
      },
      {
        category: 'Pronunciation',
        score: 7.5,
        maxScore: 9.0,
        strengths: [
          'Phát âm rõ ràng, dễ hiểu',
          'Intonation tự nhiên',
          'Word stress chính xác ở hầu hết các từ'
        ],
        improvements: [
          'Chú ý phát âm các âm khó như /θ/, /ð/',
          'Cải thiện sentence stress để nghe tự nhiên hơn',
          'Luyện connected speech (liên kết âm giữa các từ)'
        ],
        examples: [
          '✓ Phát âm tốt các từ đa âm tiết',
          '✗ Một số âm cuối chưa rõ ràng'
        ]
      }
    ];
  };

  const overallScore = feedback ? (feedback.reduce((sum, f) => sum + f.score, 0) / feedback.length).toFixed(1) : '0.0';
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const avgAnswerLength = data.userAnswers.reduce((sum, a) => sum + a.duration, 0) / data.userAnswers.length;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <Badge className="bg-green-600 text-white px-4 py-2">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Hoàn thành
          </Badge>
        </div>

        {/* Overall Score Card */}
        <Card className="border-2 border-primary/30 bg-primary/10">
          <CardHeader>
            <CardTitle className="text-center text-3xl">Kết quả Part {data.part}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Score */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary text-white">
                <div>
                  <div className="text-5xl font-bold">{overallScore}</div>
                  <div className="text-sm opacity-90">/ 9.0</div>
                </div>
              </div>
              <p className="text-lg text-muted-foreground">Điểm trung bình tổng thể</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{formatTime(data.totalDuration)}</div>
                <div className="text-xs text-muted-foreground">Tổng thời gian</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <MessageSquare className="h-5 w-5 mx-auto mb-2 text-secondary" />
                <div className="text-2xl font-bold">{data.userAnswers.length}</div>
                <div className="text-xs text-muted-foreground">Số câu trả lời</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <Volume2 className="h-5 w-5 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{avgAnswerLength.toFixed(0)}s</div>
                <div className="text-xs text-muted-foreground">TB độ dài câu trả lời</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <Target className="h-5 w-5 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold">
                  {((data.userAnswers.length / (data.part === 2 ? 3 : 12)) * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Hoàn thành</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isGeneratingFeedback && (
          <Card className="border-2 border-primary/30 bg-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Đang phân tích với AI...</h3>
                  <p className="text-sm text-muted-foreground">
                    Gemini AI đang đánh giá bài nói của bạn theo tiêu chuẩn IELTS
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Results Tabs */}
        {!isGeneratingFeedback && feedback && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="feedback">
                <Lightbulb className="h-4 w-4 mr-2" />
                Nhận xét AI
              </TabsTrigger>
              <TabsTrigger value="transcript">
                <BookOpen className="h-4 w-4 mr-2" />
                Transcript
              </TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Điểm số chi tiết
                </CardTitle>
                <CardDescription>
                  Đánh giá theo 4 tiêu chí chấm điểm IELTS Speaking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {feedback?.map((item, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{item.category}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.score >= 7 ? 'Tốt' : item.score >= 6 ? 'Khá' : 'Cần cải thiện'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">{item.score}</div>
                        <div className="text-xs text-muted-foreground">/ {item.maxScore}</div>
                      </div>
                    </div>
                    <Progress value={(item.score / item.maxScore) * 100} className="h-3" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            {feedback?.map((item, idx) => (
              <Card key={idx} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{item.category}</CardTitle>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {item.score} / {item.maxScore}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Strengths */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Điểm mạnh
                    </h4>
                    <ul className="space-y-1 ml-6">
                      {item.strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-muted-foreground list-disc">
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-orange-600">
                      <TrendingUp className="h-4 w-4" />
                      Cần cải thiện
                    </h4>
                    <ul className="space-y-1 ml-6">
                      {item.improvements.map((improvement, i) => (
                        <li key={i} className="text-sm text-muted-foreground list-disc">
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Examples */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      <AlertCircle className="h-4 w-4" />
                      Ví dụ từ bài nói
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1">
                      {item.examples.map((example, i) => (
                        <p key={i} className="text-sm font-mono">
                          {example}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Overall Recommendations */}
            <Card className="border-2 border-primary/30 bg-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Khuyến nghị chung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold">Để đạt điểm cao hơn:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Luyện tập hàng ngày ít nhất 15-20 phút để cải thiện fluency</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Mở rộng vốn từ vựng theo chủ đề (topic-based vocabulary)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Ghi âm và nghe lại để tự đánh giá và sửa lỗi phát âm</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Học cách phát triển ý với PEEL method (Point, Explain, Example, Link)</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transcript Tab */}
          <TabsContent value="transcript" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Toàn bộ hội thoại
                </CardTitle>
                <CardDescription>
                  Xem lại tất cả câu hỏi và câu trả lời của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.userAnswers.map((answer, idx) => (
                  <div key={idx} className="border-2 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        {/* Question */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Câu {idx + 1}</Badge>
                            <span className="text-xs text-muted-foreground">Examiner</span>
                          </div>
                          <p className="text-sm font-medium bg-gray-50 dark:bg-gray-900 p-3 rounded">
                            {answer.question}
                          </p>
                        </div>

                        {/* Answer */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary">Câu trả lời</Badge>
                            <span className="text-xs text-muted-foreground">
                              {answer.duration}s
                            </span>
                          </div>
                          <p className="text-sm bg-primary/10 p-3 rounded">
                            {answer.transcript}
                          </p>
                        </div>
                      </div>

                      {/* Audio playback (if available) */}
                      {answer.audioBlob && (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={onBack} size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại menu
          </Button>
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            <Target className="h-4 w-4 mr-2" />
            Luyện part khác
          </Button>
        </div>
      </div>
    </div>
  );
}
