import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Mic,
  MessageCircle,
  Clock,
  Target,
  BookOpen,
  TrendingUp,
  Volume2,
  CheckCircle2
} from 'lucide-react';
import { SpeakingSession } from './SpeakingSession';
import { SpeakingResults } from './SpeakingResults';

export type SpeakingPart = 1 | 2 | 3;

export interface SpeakingTestData {
  part: SpeakingPart;
  questions: string[];
  userAnswers: {
    question: string;
    transcript: string;
    audioBlob?: Blob;
    duration: number;
  }[];
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
}

const SPEAKING_PARTS = [
  {
    part: 1 as SpeakingPart,
    title: 'Part 1: Introduction & Interview',
    description: 'Giới thiệu bản thân và trả lời các câu hỏi về chủ đề quen thuộc',
    duration: '4-5 phút',
    questions: '10-12 câu hỏi',
    topics: ['Gia đình', 'Công việc', 'Sở thích', 'Quê hương'],
    color: 'blue'
  },
  {
    part: 2 as SpeakingPart,
    title: 'Part 2: Long Turn',
    description: 'Nói về một chủ đề trong 1-2 phút sau khi chuẩn bị 1 phút',
    duration: '3-4 phút',
    questions: '1 topic card',
    topics: ['Mô tả người/địa điểm', 'Kể về trải nghiệm', 'Giải thích ý kiến'],
    color: 'purple'
  },
  {
    part: 3 as SpeakingPart,
    title: 'Part 3: Discussion',
    description: 'Thảo luận sâu về chủ đề trong Part 2 với các câu hỏi trừu tượng',
    duration: '4-5 phút',
    questions: '5-7 câu hỏi',
    topics: ['Phân tích', 'So sánh', 'Dự đoán xu hướng', 'Đưa ra quan điểm'],
    color: 'green'
  }
];

export function SpeakingTest() {
  const [selectedPart, setSelectedPart] = useState<SpeakingPart | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [testData, setTestData] = useState<SpeakingTestData | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleStartPart = (part: SpeakingPart) => {
    setSelectedPart(part);
    setIsSessionActive(true);
    setShowResults(false);
  };

  const handleEndSession = (data: SpeakingTestData) => {
    setTestData(data);
    setIsSessionActive(false);
    setShowResults(true);
  };

  const handleBackToMenu = () => {
    setSelectedPart(null);
    setIsSessionActive(false);
    setShowResults(false);
    setTestData(null);
  };

  // Active Session View
  if (isSessionActive && selectedPart) {
    return (
      <SpeakingSession
        part={selectedPart}
        onEnd={handleEndSession}
        onCancel={handleBackToMenu}
      />
    );
  }

  // Results View
  if (showResults && testData) {
    return (
      <SpeakingResults
        data={testData}
        onBack={handleBackToMenu}
      />
    );
  }

  // Main Menu View
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: MessageCircle, title: 'Trò chuyện tự nhiên', desc: 'Với AI bản xứ' },
            { icon: Volume2, title: 'Nhận diện giọng nói', desc: 'Real-time chi tiết' },
            { icon: TrendingUp, title: 'Đánh giá phát âm', desc: 'Cải thiện tức thì' },
            { icon: CheckCircle2, title: 'Nhận xét IELTS/TOEIC', desc: 'Theo tiêu chuẩn mới' }
          ].map((feature, idx) => (
            <Card key={idx} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 rounded-2xl">
              <CardContent className="pt-6 pb-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500 font-medium">{feature.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Speaking Parts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SPEAKING_PARTS.map((part) => (
            <Card
              key={part.part}
              className="bg-white border-0 hover:shadow-xl shadow-md transition-all rounded-2xl overflow-hidden group"
            >
              <div className="h-1.5 w-full bg-primary" />
              <CardHeader className="space-y-4 bg-gray-50/50 pb-4">
                <div className="space-y-3">
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-0 text-xs font-bold px-3 py-1 uppercase tracking-wider"
                  >
                    Part {part.part}
                  </Badge>
                  <div>
                    <CardTitle className="text-xl font-extrabold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                      {part.title.split(': ')[1]}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 font-medium">
                      {part.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary/80" />
                    <span className="text-sm font-semibold text-gray-700">{part.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-gray-700">{part.questions}</span>
                  </div>
                </div>

                {/* Topics */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-secondary/80" />
                    <span className="font-bold text-sm text-gray-800">Chủ đề thường gặp:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {part.topics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 border-0">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <Button
                  onClick={() => handleStartPart(part.part)}
                  className="w-full bg-slate-900 hover:bg-primary text-white font-bold h-12 rounded-xl transition-colors"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Bắt đầu Part {part.part}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card className="bg-primary/10 border-0 shadow-sm rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary font-bold">
              <BookOpen className="h-5 w-5" />
              Hướng dẫn sử dụng phòng Speaking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Chuẩn bị trước khi nói:</h4>
                <ul className="text-sm font-medium text-gray-700 space-y-2">
                  <li className="flex gap-2 items-center"><span className="h-1.5 w-1.5 rounded-full bg-primary/80 inline-block" /> Kiểm tra microphone và cấp quyền truy cập trình duyệt</li>
                  <li className="flex gap-2 items-center"><span className="h-1.5 w-1.5 rounded-full bg-primary/80 inline-block" /> Tìm nơi yên tĩnh để luyện tập tránh tạp âm</li>
                  <li className="flex gap-2 items-center"><span className="h-1.5 w-1.5 rounded-full bg-primary/80 inline-block" /> Sẵn sàng trả lời liên tục trong 4-5 phút</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Trong khi nói:</h4>
                <ul className="text-sm font-medium text-gray-700 space-y-2">
                  <li className="flex gap-2 items-center"><span className="h-1.5 w-1.5 rounded-full bg-primary/80 inline-block" /> Nói rõ ràng, tốc độ vừa phải và tự nhiên</li>
                  <li className="flex gap-2 items-center"><span className="h-1.5 w-1.5 rounded-full bg-primary/80 inline-block" /> Trả lời đầy đủ câu, sử dụng từ nối để phát triển ý</li>
                  <li className="flex gap-2 items-center"><span className="h-1.5 w-1.5 rounded-full bg-primary/80 inline-block" /> Dùng đa dạng từ vựng và ngữ pháp để ghi điểm cao</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
