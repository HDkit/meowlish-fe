import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Upload, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

type Section = {
  id: string;
  name: string;
  isExpanded: boolean;
  children: Section[];
};

type Question = {
  id: string;
  content: string;
  type: 'single' | 'multiple' | 'text';
  points: number;
  options: {
    id: string;
    content: string;
    isCorrect: boolean;
    feedback?: string; // Thêm feedback cho từng option
  }[];
  feedback: {
    correct: string;
    incorrect: string;
  };
};

export function ExamCreationPage() {
  const [sections, setSections] = useState<Section[]>([
    {
      id: '1',
      name: 'Section 1',
      isExpanded: true,
      children: [
        { id: '1-1', name: 'Subsection 1.1', isExpanded: false, children: [] },
        { id: '1-2', name: 'Subsection 1.2', isExpanded: false, children: [] },
      ],
    },
    {
      id: '2',
      name: 'Section 2',
      isExpanded: false,
      children: [],
    },
  ]);

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      content: '',
      type: 'single',
      points: 0,
      options: [
        { id: '1-1', content: 'Phương án 1', isCorrect: true, feedback: '' },
        { id: '1-2', content: 'Phương án 2', isCorrect: false, feedback: '' },
      ],
      feedback: { correct: '', incorrect: '' },
    },
  ]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedOptionForFeedback, setSelectedOptionForFeedback] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    const updateSections = (sections: Section[]): Section[] => {
      return sections.map(section => {
        if (section.id === id) {
          return { ...section, isExpanded: !section.isExpanded };
        }
        if (section.children.length > 0) {
          return { ...section, children: updateSections(section.children) };
        }
        return section;
      });
    };
    setSections(updateSections(sections));
  };

  const addOption = () => {
    const newQuestions = [...questions];
    const newOptionId = `${currentQuestion + 1}-${newQuestions[currentQuestion].options.length + 1}`;
    newQuestions[currentQuestion].options.push({
      id: newOptionId,
      content: `Phương án ${newQuestions[currentQuestion].options.length + 1}`,
      isCorrect: false,
      feedback: '',
    });
    setQuestions(newQuestions);
  };

  const toggleOptionCorrect = (optionId: string) => {
    const newQuestions = [...questions];
    const question = newQuestions[currentQuestion];
    
    question.options = question.options.map(option => {
      if (question.type === 'single') {
        return {
          ...option,
          isCorrect: option.id === optionId,
        };
      } else {
        return option.id === optionId 
          ? { ...option, isCorrect: !option.isCorrect }
          : option;
      }
    });
    
    setQuestions(newQuestions);
  };

  const renderSection = (section: Section, level = 0) => (
    <div key={section.id} className="ml-4">
      <div 
        className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${selectedSection === section.id ? 'bg-blue-100' : ''}`}
        onClick={() => setSelectedSection(section.id)}
      >
        {section.children.length > 0 ? (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
            className="mr-1 text-gray-500 hover:text-gray-700"
          >
            {section.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : <div className="w-5"></div>}
        <span className="text-sm">{section.name}</span>
      </div>
      {section.isExpanded && section.children.length > 0 && (
        <div className="ml-4">
          {section.children.map(child => renderSection(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="font-semibold text-lg mb-4">Tên đề thi</h2>
        <div className="space-y-1">
          {sections.map(section => renderSection(section))}
        </div>
        <Button variant="ghost" size="sm" className="mt-2 text-blue-600">
          <Plus size={16} className="mr-1" /> Thêm section
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Tạo đề thi</h1>
          <Button>LƯU</Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Section Content */}
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4">Nội dung Section</h2>
            <div className="space-y-4 mb-4">
              <div>
                <Textarea 
                  placeholder="Nhập nội dung section"
                  className="mt-1"
                  rows={6}
                />
              </div>
              <Card className="p-4 h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Tải lên tập tin</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Question Content */}
          <div>
            <h2 className="text-lg font-medium mb-4">Nội dung câu hỏi</h2>
            <div className="space-y-4">
              <div>
                <Label>Câu hỏi</Label>
                <Textarea 
                  placeholder="Nhập nội dung câu hỏi"
                  className="mt-1"
                  value={questions[currentQuestion].content}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[currentQuestion].content = e.target.value;
                    setQuestions(newQuestions);
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Các phương án</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={addOption}
                  >
                    <Plus size={16} className="mr-1" /> Thêm phương án
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {questions[currentQuestion].options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <div 
                        className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer ${
                          option.isCorrect 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => toggleOptionCorrect(option.id)}
                      >
                        {option.isCorrect && <Check size={12} />}
                      </div>
                      <Input 
                        value={option.content}
                        onChange={(e) => {
                          const newQuestions = [...questions];
                          const optionIndex = newQuestions[currentQuestion].options.findIndex(o => o.id === option.id);
                          if (optionIndex !== -1) {
                            newQuestions[currentQuestion].options[optionIndex].content = e.target.value;
                            setQuestions(newQuestions);
                          }
                        }}
                        className="flex-1"
                        placeholder="Nhập phương án"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-500 hover:text-red-500"
                        onClick={() => {
                          const newQuestions = [...questions];
                          newQuestions[currentQuestion].options = newQuestions[currentQuestion].options.filter(
                            o => o.id !== option.id
                          );
                          setQuestions(newQuestions);
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>

              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const newQuestion: Question = {
                      id: `${questions.length + 1}`,
                      content: '',
                      type: 'single',
                      points: 0,
                      options: [
                        { id: `${questions.length + 1}-1`, content: 'Phương án 1', isCorrect: true, feedback: '' },
                        { id: `${questions.length + 1}-2`, content: 'Phương án 2', isCorrect: false, feedback: '' },
                      ],
                      feedback: { correct: '', incorrect: '' },
                    };
                    setQuestions([...questions, newQuestion]);
                    setCurrentQuestion(questions.length);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} className="mr-1" /> Thêm câu hỏi
                </Button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Câu hỏi {currentQuestion + 1} / {questions.length}
                  </span>
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={currentQuestion === 0}
                      onClick={() => setCurrentQuestion(currentQuestion - 1)}
                    >
                      Trước
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={currentQuestion === questions.length - 1}
                      onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-white">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Phản hồi cho câu trả lời</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedOptionForFeedback(null);
                  }}
                  className="hover:bg-gray-100"
                >
                  <X size={20} />
                </Button>
              </div>
              
              {selectedOptionForFeedback ? (
                // Feedback cho một option cụ thể
                <div>
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Phương án:</p>
                    <p className="font-medium">
                      {questions[currentQuestion].options.find(o => o.id === selectedOptionForFeedback)?.content}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Phản hồi khi chọn phương án này</Label>
                      <p className="text-sm text-gray-500 mb-2">Người làm bài sẽ thấy phản hồi này khi chọn phương án</p>
                      <Textarea 
                        placeholder="Ví dụ: Rất tiếc, đây không phải là câu trả lời đúng. Hãy thử lại!"
                        rows={4}
                        value={questions[currentQuestion].options.find(o => o.id === selectedOptionForFeedback)?.feedback || ''}
                        onChange={(e) => {
                          const newQuestions = [...questions];
                          const optionIndex = newQuestions[currentQuestion].options.findIndex(
                            o => o.id === selectedOptionForFeedback
                          );
                          if (optionIndex !== -1) {
                            newQuestions[currentQuestion].options[optionIndex].feedback = e.target.value;
                            setQuestions(newQuestions);
                          }
                        }}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Feedback chung cho câu hỏi
                <Tabs defaultValue="incorrect" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="incorrect" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                      Câu trả lời sai
                    </TabsTrigger>
                    <TabsTrigger value="correct" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
                      Câu trả lời đúng
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="incorrect" className="space-y-3">
                    <div>
                      <Label className="text-base font-medium">Phản hồi cho câu trả lời sai</Label>
                      <p className="text-sm text-gray-500 mb-2">Hiển thị khi người dùng chọn đáp án sai</p>
                      <Textarea 
                        placeholder="Ví dụ: Rất tiếc, câu trả lời của bạn chưa chính xác. Hãy xem lại lý thuyết và thử lại nhé!"
                        rows={4}
                        value={questions[currentQuestion].feedback.incorrect}
                        onChange={(e) => {
                          const newQuestions = [...questions];
                          newQuestions[currentQuestion].feedback.incorrect = e.target.value;
                          setQuestions(newQuestions);
                        }}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="correct" className="space-y-3">
                    <div>
                      <Label className="text-base font-medium">Phản hồi cho câu trả lời đúng</Label>
                      <p className="text-sm text-gray-500 mb-2">Hiển thị khi người dùng chọn đáp án đúng</p>
                      <Textarea 
                        placeholder="Ví dụ: Chính xác! Bạn đã trả lời đúng. Tiếp tục phát huy nhé!"
                        rows={4}
                        value={questions[currentQuestion].feedback.correct}
                        onChange={(e) => {
                          const newQuestions = [...questions];
                          newQuestions[currentQuestion].feedback.correct = e.target.value;
                          setQuestions(newQuestions);
                        }}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedOptionForFeedback(null);
                  }}
                  className="px-6"
                >
                  Hủy
                </Button>
                <Button 
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedOptionForFeedback(null);
                  }}
                  className="px-6 bg-blue-600 hover:bg-blue-700"
                >
                  Lưu phản hồi
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ExamCreationPage;
