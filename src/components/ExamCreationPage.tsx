import { useState, useRef } from 'react';
import { Plus, ChevronDown, ChevronRight, Upload, X, Check, Save, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from './ui/use-toast';

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
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [examTitle, setExamTitle] = useState('Đề thi mới');
  const [sectionContent, setSectionContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    type: string;
    size: number;
    url: string;
  } | null>(null);
  
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

  const validateExam = () => {
    const errors: string[] = [];

    // Validate exam title
    if (!examTitle.trim()) {
      errors.push('Vui lòng nhập tên đề thi');
    }

    // Validate questions
    if (questions.length === 0) {
      errors.push('Đề thi phải có ít nhất 1 câu hỏi');
    }

    questions.forEach((question, index) => {
      // Check question content
      if (!question.content.trim()) {
        errors.push(`Câu hỏi ${index + 1}: Nội dung câu hỏi không được để trống`);
      }

      // Check if has options
      if (question.options.length < 2) {
        errors.push(`Câu hỏi ${index + 1}: Phải có ít nhất 2 phương án`);
      }

      // Check if has at least one correct answer
      const hasCorrectAnswer = question.options.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        errors.push(`Câu hỏi ${index + 1}: Phải có ít nhất 1 đáp án đúng`);
      }

      // Check if all options have content
      question.options.forEach((option, optIndex) => {
        if (!option.content.trim()) {
          errors.push(`Câu hỏi ${index + 1}, Phương án ${optIndex + 1}: Nội dung không được để trống`);
        }
      });
    });

    return errors;
  };

  const handleSave = async () => {
    // Validate before saving
    const errors = validateExam();
    
    if (errors.length > 0) {
      toast({
        title: "Lỗi khi lưu đề thi",
        description: (
          <div className="space-y-1">
            {errors.slice(0, 3).map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
            {errors.length > 3 && <div>... và {errors.length - 3} lỗi khác</div>}
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Prepare exam data
      const examData = {
        title: examTitle,
        sections: sections,
        sectionContent: sectionContent,
        uploadedFile: uploadedFile,
        questions: questions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage for now (replace with API call later)
      const savedExams = JSON.parse(localStorage.getItem('exams') || '[]');
      const examId = `exam_${Date.now()}`;
      savedExams.push({ id: examId, ...examData });
      localStorage.setItem('exams', JSON.stringify(savedExams));

      toast({
        title: "Lưu thành công!",
        description: `Đề thi "${examTitle}" đã được lưu thành công với ${questions.length} câu hỏi.`,
        variant: "default",
      });

      console.log('Exam saved:', examData);
    } catch (error) {
      toast({
        title: "Lỗi khi lưu",
        description: "Có lỗi xảy ra khi lưu đề thi. Vui lòng thử lại.",
        variant: "destructive",
      });
      console.error('Error saving exam:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File quá lớn",
        description: "Vui lòng chọn file nhỏ hơn 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Định dạng file không hợp lệ",
        variant: "destructive"
      });
      return;
    }

    // Create file URL for preview
    const fileUrl = URL.createObjectURL(file);

    setUploadedFile({
      name: file.name,
      type: file.type,
      size: file.size,
      url: fileUrl,
    });

    toast({
      title: "Upload thành công",
      description: `File "${file.name}" đã được tải lên.`,
    });
  };

  const handleRemoveFile = () => {
    if (uploadedFile?.url) {
      URL.revokeObjectURL(uploadedFile.url);
    }
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} />;
    if (type === 'application/pdf') return <FileText size={20} />;
    return <File size={20} />;
  };

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
        <div className="mb-4">
          <Label className="text-xs text-gray-500 uppercase">Tên đề thi</Label>
          <Input 
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            className="mt-1 font-semibold"
            placeholder="Nhập tên đề thi"
          />
        </div>
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
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500">
              {questions.length} câu hỏi
            </div>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save size={16} className="mr-2" />
              {isSaving ? 'Đang lưu...' : 'LƯU'}
            </Button>
          </div>
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
                  value={sectionContent}
                  onChange={(e) => setSectionContent(e.target.value)}
                />
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
              />
              
              {!uploadedFile ? (
                <Card 
                  className="p-4 h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Tải lên tập tin</p>
                  </div>
                </Card>
              ) : (
                <Card className="p-4 border border-gray-300 rounded-lg">
                  {uploadedFile.type.startsWith('image/') ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img 
                          src={uploadedFile.url} 
                          alt={uploadedFile.name}
                          className="w-full h-48 object-contain bg-gray-50 rounded"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveFile}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getFileIcon(uploadedFile.type)}
                          <span className="font-medium truncate max-w-[300px]">{uploadedFile.name}</span>
                        </div>
                        <span className="text-gray-500">{formatFileSize(uploadedFile.size)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded">
                          {getFileIcon(uploadedFile.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{uploadedFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={handleRemoveFile}
                      >
                        <X size={20} />
                      </Button>
                    </div>
                  )}
                </Card>
              )}
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
                <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                  Click vào ô tròn để đánh dấu đáp án đúng 
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white">
                    <Check size={10} />
                  </span>
                </p>
                
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
