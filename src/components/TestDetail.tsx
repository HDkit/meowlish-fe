import React, { useMemo, useState } from 'react';
import { Section, TestType, Skill, Difficulty } from '../types/client';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from './store/main/hook';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Clock, 
  MessageSquare, 
  Users, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  Circle,
  Play,
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  Target,
  Info
} from 'lucide-react';

export function ExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return <div>Invalid Exam ID</div>;

  const examId = id;
  const exams = useAppSelector((state) => state.exams.list);
  const sections = useAppSelector((state) => state.sections.list);
  const questions = useAppSelector((state) => state.questions.list);
  const attempts = useAppSelector((state) => state.attempts.list);
  const tags = useAppSelector((state) => state.tags.list);

  const exam = exams.find((e) => e.id === examId);

  // --- Logic xử lý dữ liệu ---
  // Lấy danh sách các phần thi chính (các section có parentId là examId)
  const rootSections = useMemo(() => 
    sections.filter((sec) => sec.parentId === examId), 
  [examId, sections]);

  // Helper: đệ quy lấy tất cả child sections
  const getAllChildSections = (parentId: string): Section[] => {
    const children = sections.filter(sec => sec.parentId === parentId);
    let all: Section[] = [];
    for (const child of children) {
      all.push(child);
      all = all.concat(getAllChildSections(child.id));
    }
    return all;
  };

  // Đếm số câu hỏi trong một section (bao gồm cả nested sections)
  const countQuestionsInSection = (sectionId: string): number => {
    const allSections = [sectionId, ...getAllChildSections(sectionId).map(s => s.id)];
    return questions.filter(q => allSections.includes(q.sectionId)).length;
  };

  // Helper lấy tags cho một section cụ thể
  const getTagsForSection = (sectionId: string) => {
    const allSections = [sectionId, ...getAllChildSections(sectionId).map(s => s.id)];
    const sectionQuestions = questions.filter(q => allSections.includes(q.sectionId));
    const tagIds = new Set<string>();
    sectionQuestions.forEach(q => q.tagIds.forEach(t => tagIds.add(t)));
    return Array.from(tagIds).map(tid => tags.find(t => t.id === tid)).filter(Boolean);
  };

  // Tổng số câu hỏi trong exam
  const totalQuestions = useMemo(() => {
    const allExamSections = rootSections.flatMap(s => [s.id, ...getAllChildSections(s.id).map(sec => sec.id)]);
    return questions.filter(q => allExamSections.includes(q.sectionId)).length;
  }, [rootSections, questions, sections]);

  // Tổng quan số liệu
  const examAttempts = useMemo(() => attempts.filter((a) => a.examId === examId).length, [attempts, examId]);
  
  // --- State quản lý UI ---
  const [activeTab, setActiveTab] = useState<'practice' | 'fulltest' | 'discuss'>('practice');
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [timer, setTimer] = useState<string>(''); // Để trống là không giới hạn

  // --- Handlers ---
  const toggleSection = (secId: string) => {
    setSelectedSectionIds(prev => 
      prev.includes(secId) ? prev.filter(id => id !== secId) : [...prev, secId]
    );
  };

  const handleStart = () => {
    if (!exam) return;
    
    const sectionsToUse = activeTab === 'fulltest' ? rootSections.map(s => s.id) : selectedSectionIds;
    const timerValue = activeTab === 'fulltest' ? exam.duration : (timer ? parseInt(timer) : null);
    
    console.log('Start exam:', {
      mode: activeTab,
      sections: sectionsToUse,
      timer: timerValue
    });
    
    // TODO: Navigate to test interface
    // navigate(`/test/do/${examId}`, { state: { sections: sectionsToUse, timer: timerValue } });
  };

  // Helper functions
  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.Beginner:
        return 'bg-green-100 text-green-800 border-green-200';
      case Difficulty.Intermediate:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case Difficulty.Advanced:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyText = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.Beginner:
        return 'Cơ bản';
      case Difficulty.Intermediate:
        return 'Trung bình';
      case Difficulty.Advanced:
        return 'Nâng cao';
      default:
        return difficulty;
    }
  };

  const getSkillIcon = (skill: Skill) => {
    switch (skill) {
      case Skill.Reading:
        return BookOpen;
      case Skill.Listening:
        return Headphones;
      case Skill.Speaking:
        return Mic;
      case Skill.Writing:
        return PenTool;
      default:
        return FileText;
    }
  };

  const getTestTypeLabel = (testType: TestType) => {
    return testType === TestType.IELTS ? 'IELTS' : 'TOEIC';
  };

  const getPartName = (section: Section, index: number) => {
    // Nếu section có title trong direction hoặc có thể tạo từ id
    // Tạm thời dùng format Part {index + 1}
    return `Part ${index + 1}`;
  };

  if (!exam) return <div className="p-6 text-center text-gray-500">Không tìm thấy đề thi</div>;

  const SkillIcon = getSkillIcon(exam.skill);

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      {/* 1. Header Info: Title & Metadata */}
      <div className='space-y-4'>
        <div className='flex items-start justify-between'>
          <div className='space-y-3 flex-1'>
            <div className='flex items-center gap-3 flex-wrap'>
              <Badge variant="outline" className={`${exam.testType === TestType.IELTS ? 'border-blue-500 text-blue-700' : 'border-orange-500 text-orange-700'}`}>
                {getTestTypeLabel(exam.testType)}
              </Badge>
              <Badge variant="outline" className="border-gray-300">
                <SkillIcon className="h-3 w-3 mr-1" />
                {exam.skill.charAt(0).toUpperCase() + exam.skill.slice(1)}
              </Badge>
              <Badge className={getDifficultyColor(exam.difficulty)}>
                {getDifficultyText(exam.difficulty)}
              </Badge>
            </div>
            <h1 className='text-4xl font-bold text-gray-900'>{exam.title}</h1>
            <p className='text-gray-600 text-lg'>{exam.description}</p>
          </div>
        </div>
        
        <div className='flex items-center gap-6 text-sm text-gray-600 flex-wrap'>
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4'/>
            <span>{exam.duration} phút</span>
          </div>
          <div className='flex items-center gap-2'>
            <FileText className='h-4 w-4'/>
            <span>{rootSections.length} phần thi</span>
          </div>
          <div className='flex items-center gap-2'>
            <Target className='h-4 w-4'/>
            <span>{totalQuestions} câu hỏi</span>
          </div>
          <div className='flex items-center gap-2'>
            <Users className='h-4 w-4'/>
            <span>{examAttempts} người đã luyện</span>
          </div>
        </div>
        
        {activeTab === 'fulltest' && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800 text-sm'>
            <Info className='shrink-0 h-5 w-5 mt-0.5' />
            <p>
              <strong>Lưu ý:</strong> Để được quy đổi sang scaled score (ví dụ trên thang điểm 9.0 cho IELTS hoặc 990 cho TOEIC), 
              vui lòng chọn chế độ làm <strong>Full Test</strong> với thời gian chuẩn.
            </p>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className='border-b border-gray-200'>
        <div className='flex gap-8 text-sm font-medium'>
          <button 
            className={`pb-4 px-1 border-b-2 transition-colors ${
              activeTab === 'practice' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('practice')}
          >
            Luyện tập từng phần
          </button>
          <button 
            className={`pb-4 px-1 border-b-2 transition-colors ${
              activeTab === 'fulltest' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('fulltest')}
          >
            Làm Full Test
          </button>
          <button 
            className={`pb-4 px-1 border-b-2 transition-colors ${
              activeTab === 'discuss' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('discuss')}
          >
            Thảo luận
          </button>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <div className='space-y-6'>
        {/* Pro Tips Alert */}
        {activeTab === 'practice' && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 text-green-800 text-sm'>
            <AlertCircle className='shrink-0 h-5 w-5 mt-0.5' />
            <p>
              <strong>Mẹo luyện tập:</strong> Hình thức luyện tập từng phần và chọn mức thời gian phù hợp sẽ giúp bạn 
              tập trung vào giải đúng các câu hỏi thay vì phải chịu áp lực hoàn thành bài thi.
            </p>
          </div>
        )}

        {/* Practice Mode: Part Selection */}
        {activeTab === 'practice' && (
          <div className='space-y-6'>
            <div>
              <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                Chọn phần thi bạn muốn luyện tập
              </h3>
              
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {rootSections.map((section, index) => {
                  const sectionTags = getTagsForSection(section.id);
                  const questionCount = countQuestionsInSection(section.id);
                  const isSelected = selectedSectionIds.includes(section.id);
                  
                  return (
                    <Card 
                      key={section.id}
                      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleSection(section.id)}
                    >
                      <CardContent className='p-5'>
                        <div className='flex items-start gap-4'>
                          <div className='mt-1'>
                            {isSelected ? (
                              <CheckCircle2 className='h-6 w-6 text-blue-600' />
                            ) : (
                              <Circle className='h-6 w-6 text-gray-400' />
                            )}
                          </div>
                          <div className='flex-1 space-y-3'>
                            <div>
                              <h4 className='font-semibold text-lg text-gray-900 mb-1'>
                                {getPartName(section, index)}
                              </h4>
                              <div className='flex items-center gap-4 text-sm text-gray-600 mb-2'>
                                <span className='flex items-center gap-1'>
                                  <FileText className='h-4 w-4' />
                                  {questionCount} câu hỏi
                                </span>
                                <Badge className={getDifficultyColor(section.difficulty)} variant="outline">
                                  {getDifficultyText(section.difficulty)}
                                </Badge>
                              </div>
                            </div>
                            
                            {sectionTags.length > 0 && (
                              <div className='flex flex-wrap gap-2'>
                                {sectionTags.slice(0, 3).map(tag => (
                                  <Badge 
                                    key={tag?.id} 
                                    variant="secondary" 
                                    className="text-xs"
                                  >
                                    {tag?.name}
                                  </Badge>
                                ))}
                                {sectionTags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{sectionTags.length - 3} khác
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Timer Selection */}
            <Card className='border-gray-200'>
              <CardHeader>
                <CardTitle className='text-lg'>Cài đặt thời gian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <label className='text-sm font-medium text-gray-700 block'>
                    Giới hạn thời gian (tùy chọn)
                  </label>
                  <select 
                    className='w-full max-w-xs border border-gray-300 rounded-md p-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                    value={timer}
                    onChange={(e) => setTimer(e.target.value)}
                  >
                    <option value="">Không giới hạn thời gian</option>
                    <option value="10">10 phút</option>
                    <option value="15">15 phút</option>
                    <option value="20">20 phút</option>
                    <option value="30">30 phút</option>
                    <option value="45">45 phút</option>
                    <option value="60">60 phút</option>
                  </select>
                  <p className='text-xs text-gray-500'>
                    Để trống nếu bạn muốn làm bài không giới hạn thời gian
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Test Mode */}
        {activeTab === 'fulltest' && (
          <div className='space-y-6'>
            <Card className='border-2 border-blue-200 bg-blue-50'>
              <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                  <div className='bg-blue-100 rounded-full p-3'>
                    <FileText className='h-6 w-6 text-blue-600' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                      Chế độ Full Test
                    </h3>
                    <p className='text-gray-700 mb-4'>
                      Bạn sẽ làm tất cả <strong>{rootSections.length} phần thi</strong> với tổng cộng{' '}
                      <strong>{totalQuestions} câu hỏi</strong> trong thời gian chuẩn là{' '}
                      <strong>{exam.duration} phút</strong>.
                    </p>
                    <div className='bg-white rounded-lg p-4 space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-600'>Tổng số phần thi:</span>
                        <span className='font-semibold'>{rootSections.length} phần</span>
                      </div>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-600'>Tổng số câu hỏi:</span>
                        <span className='font-semibold'>{totalQuestions} câu</span>
                      </div>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-600'>Thời gian:</span>
                        <span className='font-semibold'>{exam.duration} phút</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Discuss Tab */}
        {activeTab === 'discuss' && (
          <Card>
            <CardHeader>
              <CardTitle>Thảo luận về đề thi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center py-12 text-gray-500'>
                <MessageSquare className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                <p>Chức năng thảo luận đang được phát triển</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Button */}
        <div className='flex items-center gap-4 pt-4'>
          <Button 
            onClick={handleStart} 
            size="lg"
            className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold'
            disabled={activeTab === 'practice' && selectedSectionIds.length === 0}
          >
            <Play className='h-5 w-5 mr-2' />
            {activeTab === 'fulltest' ? 'Bắt đầu Full Test' : 'Bắt đầu luyện tập'}
          </Button>
          {activeTab === 'practice' && selectedSectionIds.length > 0 && (
            <span className='text-sm text-gray-600'>
              Đã chọn {selectedSectionIds.length} phần thi
            </span>
          )}
        </div>
      </div>

      {/* 4. Comments Section */}
      {activeTab !== 'discuss' && (
        <div className='pt-8 border-t border-gray-200'>
          <h3 className='font-bold text-xl mb-4 text-gray-900'>Bình luận</h3>
          <div className='flex gap-2 mb-6'>
            <Input 
              placeholder='Chia sẻ cảm nghĩ của bạn về đề thi này...' 
              className='flex-1'
            />
            <Button className='bg-blue-600 hover:bg-blue-700'>Gửi</Button>
          </div>
          <div className='space-y-4'>
            <div className='text-center py-8 text-gray-400 text-sm'>
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}