import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ExamQuestion {
  id: number;
  title: string;
  question: string;
  type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: string;
  questionCount?: number;
}

export function ExamApproval(){
  // Mock data for exam questions
  const [exams, setExams] = useState<ExamQuestion[]>([
    {
      id: 1,
      title: "TOEIC Reading Practice Test #1",
      question: "Complete reading comprehension test with 40 questions covering parts 5, 6, and 7",
      type: "Reading",
      difficulty: "Medium",
      category: "TOEIC",
      status: "pending",
      createdBy: "John Doe",
      createdAt: "2025-12-20",
      questionCount: 40
    },
    {
      id: 2,
      title: "IELTS Speaking Part 2 - Describe a Person",
      question: "Describe a person who has influenced you. You should say: who the person is, how you know them, what they did...",
      type: "Speaking",
      difficulty: "Hard",
      category: "IELTS",
      status: "pending",
      createdBy: "Sarah Wilson",
      createdAt: "2025-12-19",
      questionCount: 3
    },
    {
      id: 3,
      title: "TOEIC Grammar Quiz - Present Tenses",
      question: "Multiple choice quiz covering Simple Present, Present Continuous, and Present Perfect",
      type: "Multiple Choice",
      difficulty: "Easy",
      category: "TOEIC",
      status: "pending",
      createdBy: "Mike Chen",
      createdAt: "2025-12-18",
      questionCount: 20
    },
    {
      id: 4,
      title: "IELTS Writing Task 1 - Letter Writing",
      question: "Write a formal letter responding to a client complaint about delayed shipment",
      type: "Writing",
      difficulty: "Medium",
      category: "IELTS",
      status: "approved",
      createdBy: "Emily Brown",
      createdAt: "2025-12-15",
      questionCount: 1
    },
    {
      id: 5,
      title: "TOEIC Listening Section - Conversations",
      question: "Listen to workplace conversations and answer comprehension questions",
      type: "Listening",
      difficulty: "Hard",
      category: "TOEIC",
      status: "pending",
      createdBy: "David Kim",
      createdAt: "2025-12-17",
      questionCount: 28
    },
    {
      id: 6,
      title: "IELTS Vocabulary Builder - Advanced Level",
      question: "Test your knowledge of advanced English vocabulary with synonyms, antonyms, and context usage",
      type: "Vocabulary",
      difficulty: "Hard",
      category: "IELTS",
      status: "pending",
      createdBy: "Lisa Taylor",
      createdAt: "2025-12-16",
      questionCount: 50
    },
    {
      id: 7,
      title: "TOEIC Speaking - Daily Situations",
      question: "Practice common dialogues for everyday situations like ordering food, asking directions, shopping",
      type: "Speaking",
      difficulty: "Easy",
      category: "TOEIC",
      status: "approved",
      createdBy: "Tom Anderson",
      createdAt: "2025-12-14",
      questionCount: 15
    },
    {
      id: 8,
      title: "IELTS Writing Task 2 - Opinion Essay",
      question: "Some people believe technology has made our lives easier. Others think it has caused more problems. Discuss both views.",
      type: "Writing",
      difficulty: "Hard",
      category: "IELTS",
      status: "rejected",
      createdBy: "Rachel Green",
      createdAt: "2025-12-13",
      questionCount: 1
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const handleApprove = (id: number) => {
    setExams(prevExams => 
      prevExams.map(exam => 
        exam.id === id ? { ...exam, status: 'approved' } : exam
      )
    );
  };

  const handleReject = (id: number) => {
    setExams(prevExams => 
      prevExams.map(exam => 
        exam.id === id ? { ...exam, status: 'rejected' } : exam
      )
    );
  };

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch(difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch(difficulty.toLowerCase()) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return difficulty;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'approved': return 'ĐÃ DUYỆT';
      case 'rejected': return 'ĐÃ TỪ CHỐI';
      case 'pending': return 'CHỜ DUYỆT';
      default: return status.toUpperCase();
    }
  };

  const filteredExams = exams.filter(exam => 
    filterStatus === 'all' ? true : exam.status === filterStatus
  );

  const statusCounts = {
    all: exams.length,
    pending: exams.filter(e => e.status === 'pending').length,
    approved: exams.filter(e => e.status === 'approved').length,
    rejected: exams.filter(e => e.status === 'rejected').length
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard phê duyệt đề thi</h1>
        <p className="text-gray-600">Xem xét và phê duyệt các đề thi được gửi lên từ người đóng góp</p>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
          <div className="text-sm text-gray-600">Tổng số đề thi</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{statusCounts.pending}</div>
          <div className="text-sm text-yellow-600">Chờ duyệt</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-2xl font-bold text-green-700">{statusCounts.approved}</div>
          <div className="text-sm text-green-600">Đã duyệt</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
          <div className="text-2xl font-bold text-red-700">{statusCounts.rejected}</div>
          <div className="text-sm text-red-600">Đã từ chối</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            filterStatus === 'all'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tất cả ({statusCounts.all})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            filterStatus === 'pending'
              ? 'border-yellow-500 text-yellow-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Chờ duyệt ({statusCounts.pending})
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            filterStatus === 'approved'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Đã duyệt ({statusCounts.approved})
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            filterStatus === 'rejected'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Đã từ chối ({statusCounts.rejected})
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Chi tiết đề thi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Độ khó</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Người tạo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExams.length > 0 ? (
                filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{exam.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <div className="text-sm font-semibold text-gray-900 mb-1">{exam.title}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{exam.question}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {exam.questionCount && `${exam.questionCount} câu hỏi • `}
                          Tạo ngày {exam.createdAt}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {exam.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyBadgeClass(exam.difficulty)}`}>
                        {getDifficultyText(exam.difficulty)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{exam.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{exam.createdBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getStatusBadgeClass(exam.status)} text-white`}>
                        {getStatusText(exam.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {exam.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleApprove(exam.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              ✓ Duyệt
                            </Button>
                            <Button 
                              onClick={() => handleReject(exam.id)}
                              variant="destructive"
                              size="sm"
                            >
                              ✗ Từ chối
                            </Button>
                          </div>
                        )}
                        {exam.status === 'approved' && (
                          <span className="text-green-600 text-xs font-medium">✓ Đã duyệt</span>
                        )}
                        {exam.status === 'rejected' && (
                          <span className="text-red-600 text-xs font-medium">✗ Đã từ chối</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium">Không tìm thấy đề thi nào{filterStatus !== 'all' ? ` ${filterStatus === 'pending' ? 'chờ duyệt' : filterStatus === 'approved' ? 'đã duyệt' : 'đã từ chối'}` : ''}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
