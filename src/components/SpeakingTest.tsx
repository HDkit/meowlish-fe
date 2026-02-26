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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 py-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Speaking Test
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Luyện tập kỹ năng nói với AI - Nhận phản hồi và đánh giá chi tiết theo từng part
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: MessageCircle, title: 'Trò chuyện với AI', desc: 'Tương tác tự nhiên' },
            { icon: Volume2, title: 'Nhận điểm giọng nói', desc: 'Real-time transcription' },
            { icon: TrendingUp, title: 'Câu hỏi thích ứng', desc: 'Theo ngữ cảnh' },
            { icon: CheckCircle2, title: 'Nhận xét chi tiết', desc: 'Feedback cá nhân hóa' }
          ].map((feature, idx) => (
            <Card key={idx} className="bg-white border hover:shadow-md transition-all">
              <CardContent className="pt-6 pb-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="p-3 bg-blue-50 rounded-full">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Speaking Parts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {SPEAKING_PARTS.map((part) => (
            <Card 
              key={part.part}
              className="bg-white border hover:shadow-lg transition-all"
            >
              <CardHeader className="space-y-4">
                <div className="space-y-3">
                  <Badge 
                    variant="outline" 
                    className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold px-2 py-1"
                  >
                    Part {part.part}
                  </Badge>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      {part.title.split(': ')[1]}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {part.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{part.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{part.questions}</span>
                  </div>
                </div>

                {/* Topics */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-sm text-gray-700">Chủ đề:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {part.topics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <Button 
                  onClick={() => handleStartPart(part.part)}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Bắt đầu Part {part.part}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <BookOpen className="h-5 w-5" />
              Hướng dẫn sử dụng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">Chuẩn bị:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Kiểm tra microphone và cho phép truy cập</li>
                  <li>Tìm nơi yên tĩnh để luyện tập</li>
                  <li>Sẵn sàng nói trong 4-5 phút</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">Trong khi nói:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Nói rõ ràng và tự nhiên</li>
                  <li>Trả lời đầy đủ, phát triển ý</li>
                  <li>Sử dụng từ vựng và ngữ pháp đa dạng</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
