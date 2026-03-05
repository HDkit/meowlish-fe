'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import {
  Plus, ChevronDown, ChevronRight, Trash2, Save, Send,
  FileText, Layers, HelpCircle, AlertCircle, CheckCircle,
  Clock, Settings, Eye, GripVertical, X
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from './ui/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { RootState } from '@/lib/store/store';
import { addExam, updateExam, submitForApproval } from './store/examSlice';
import { addSection, updateSection } from './store/sectionSlice';
import { addQuestion, updateQuestion } from './store/questionSlice';
import { Exam, ExamStatus, Section, Question, Difficulty, Skill, TestType } from '@/types/client';

// ─── Local types ────────────────────────────────────────────────

type AnswerOption = { id: string; text: string; isCorrect: boolean };

type LocalQuestion = {
  id: string;
  sectionId: string;
  type: 'multiple-choice' | 'fill-blank' | 'essay' | 'speaking' | 'multiple-correct-answers';
  content: string;
  options: AnswerOption[];
  correctAnswer: string[];
  points: number;
  explanation: string;
};

type LocalSection = {
  id: string;
  parentId: string;   // examId or sectionId
  title: string;
  direction: string;
  difficulty: Difficulty;
  isExpanded: boolean;
  children: LocalSection[];
};

type SelectedNode =
  | { type: 'exam' }
  | { type: 'section'; id: string }
  | { type: 'question'; id: string; sectionId: string };

// ─── Helpers ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Empty: { label: 'Trống', color: 'bg-gray-100 text-gray-600' },
  InDraft: { label: 'Chờ duyệt', color: 'bg-orange-100 text-orange-700' },
  NeedsRevision: { label: 'Cần chỉnh sửa', color: 'bg-red-100 text-red-700' },
  Published: { label: 'Đã xuất bản', color: 'bg-green-100 text-green-700' },
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'Trắc nghiệm (1 đáp án)',
  'multiple-correct-answers': 'Trắc nghiệm (nhiều đáp án)',
  'fill-blank': 'Điền vào chỗ trống',
  'essay': 'Tự luận',
  'speaking': 'Nói',
};

// Generate a default section name based on nesting depth
const depthLabel = (depth: number) => {
  if (depth === 0) return 'Section';
  if (depth === 1) return 'Subsection';
  return 'Sub'.repeat(depth - 1) + 'subsection';
};


// ─── Sub-components ─────────────────────────────────────────────

function SectionTreeNode({
  node, depth, selectedNode, onSelect, onAddChild, onDelete, questionCount,
}: {
  node: LocalSection;
  depth: number;
  selectedNode: SelectedNode;
  onSelect: (n: SelectedNode) => void;
  onAddChild: (parentId: string, childDepth: number) => void;
  onDelete: (id: string) => void;
  questionCount: (sectionId: string) => number;
}) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedNode.type === 'section' && selectedNode.id === node.id;
  const qCount = questionCount(node.id);

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors
                    ${isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-gray-700'}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button onClick={() => setExpanded(e => !e)} className="shrink-0 p-0.5 text-gray-400 hover:text-gray-700">
          {node.children.length > 0
            ? (expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
            : <span className="w-3.5 inline-block" />}
        </button>
        <Layers className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        <span className="flex-1 truncate font-medium" onClick={() => onSelect({ type: 'section', id: node.id })}>
          {node.title || 'Section không tên'}
        </span>
        {qCount > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-1.5">{qCount}</span>
        )}
        {/* Always-visible action buttons — subtle gray, colored on hover */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onAddChild(node.id, depth + 1); }}
            className="p-0.5 text-gray-300 hover:text-blue-600 transition-colors"
            title={`Thêm ${depthLabel(depth + 1)}`}
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(node.id); }}
            className="p-0.5 text-gray-300 hover:text-red-500 transition-colors"
            title="Xóa section"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {expanded && node.children.map(child => (
        <SectionTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedNode={selectedNode}
          onSelect={onSelect}
          onAddChild={onAddChild}
          onDelete={onDelete}
          questionCount={questionCount}
        />
      ))}
    </div>
  );
}

function QuestionItem({
  question, index, selectedNode, onSelect, onDelete,
}: {
  question: LocalQuestion;
  index: number;
  selectedNode: SelectedNode;
  onSelect: (n: SelectedNode) => void;
  onDelete: (id: string) => void;
}) {
  const isSelected = selectedNode.type === 'question' && selectedNode.id === question.id;

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-colors
                ${isSelected ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-100 text-gray-600'}`}
      onClick={() => onSelect({ type: 'question', id: question.id, sectionId: question.sectionId })}
    >
      <GripVertical className="h-3.5 w-3.5 text-gray-300 shrink-0" />
      <HelpCircle className="h-3.5 w-3.5 text-purple-500 shrink-0" />
      <span className="flex-1 truncate">Q{index + 1}: {question.content.slice(0, 40) || 'Câu hỏi mới'}</span>
      <span className="text-xs text-gray-400 shrink-0">{question.points}đ</span>
      <button
        onClick={e => { e.stopPropagation(); onDelete(question.id); }}
        className="hidden group-hover:block text-gray-400 hover:text-red-500"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────

export function ExamCreationPage() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { currUser } = useAuth();

  const allSections = useSelector((s: RootState) => s.sections.list);
  const allQuestions = useSelector((s: RootState) => s.questions.list);
  const allExams = useSelector((s: RootState) => s.exams.list);

  // ── Exam metadata state ──
  const [examId, setExamId] = useState<string | null>(null);
  const currentExam = examId ? allExams.find(e => e.id === examId) ?? null : null;

  const [meta, setMeta] = useState({
    title: '',
    description: '',
    testType: TestType.IELTS as TestType,
    skill: Skill.Reading as Skill,
    difficulty: Difficulty.Intermediate as Difficulty,
    duration: 60,
  });

  // ── Load exam from ?id= query param (when coming from Exam Management) ──
  const searchParams = useSearchParams();
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (!idParam || examId) return; // already initialized
    const exam = allExams.find(e => e.id === idParam);
    if (!exam) return;
    setExamId(idParam);
    setMeta({
      title: exam.title,
      description: exam.description ?? '',
      testType: exam.testType,
      skill: exam.skill,
      difficulty: exam.difficulty,
      duration: exam.duration,
    });
    // Load existing sections for this exam
    const buildTree = (parentId: string): LocalSection[] => {
      return allSections
        .filter(s => s.parentId === parentId)
        .map(s => ({
          id: s.id,
          parentId: s.parentId,
          title: s.title ?? s.direction?.split('\n')[0].slice(0, 50) ?? 'Section',
          direction: s.direction ?? '',
          difficulty: s.difficulty,
          isExpanded: true,
          children: buildTree(s.id),
        }));
    };
    setLocalSections(buildTree(idParam));
    // Load existing questions
    const examSectionIds = allSections
      .filter(s => {
        let cur = allSections.find(x => x.id === s.id);
        let depth = 0;
        while (cur && depth < 15) {
          if (cur.parentId === idParam) return true;
          cur = allSections.find(x => x.id === cur!.parentId);
          depth++;
        }
        return false;
      })
      .map(s => s.id);
    const loadedQuestions: LocalQuestion[] = allQuestions
      .filter(q => examSectionIds.includes(q.sectionId))
      .map(q => ({
        id: q.id,
        sectionId: q.sectionId,
        type: q.type,
        content: q.content,
        options: (q.options ?? []).map((text, i) => ({
          id: `opt-${i}`,
          text,
          isCorrect: q.correctAnswer?.includes(text) ?? false,
        })),
        correctAnswer: q.correctAnswer ?? [],
        points: q.points,
        explanation: q.explanation,
      }));
    setLocalQuestions(loadedQuestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Local section/question state (mirrors Redux for the current exam) ──
  const [localSections, setLocalSections] = useState<LocalSection[]>([]);
  const [localQuestions, setLocalQuestions] = useState<LocalQuestion[]>([]);

  // ── UI state ──
  const [selectedNode, setSelectedNode] = useState<SelectedNode>({ type: 'exam' });
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // ── Derived ──
  const questionsForSection = (sectionId: string) =>
    localQuestions.filter(q => q.sectionId === sectionId);

  const questionCount = (sectionId: string) => questionsForSection(sectionId).length;

  const totalQuestions = localQuestions.length;
  const totalPoints = localQuestions.reduce((s, q) => s + q.points, 0);

  const statusCfg = currentExam
    ? STATUS_CONFIG[currentExam.status] ?? STATUS_CONFIG.Empty
    : STATUS_CONFIG.Empty;

  // ── Section helpers ──
  const addRootSection = useCallback(() => {
    const id = `s-${uuidv4().slice(0, 8)}`;
    const newSec: LocalSection = {
      id, parentId: examId ?? '__new__',
      title: `Section ${localSections.length + 1}`,
      direction: '', difficulty: Difficulty.Intermediate,
      isExpanded: true, children: [],
    };
    setLocalSections(prev => [...prev, newSec]);
    setSelectedNode({ type: 'section', id });
  }, [examId, localSections.length]);

  const addChildSection = useCallback((parentId: string, childDepth: number = 1) => {
    const id = `s-${uuidv4().slice(0, 8)}`;
    const newSec: LocalSection = {
      id, parentId,
      title: depthLabel(childDepth),
      direction: '', difficulty: Difficulty.Intermediate,
      isExpanded: true, children: [],
    };

    // Recursive insert — works at any depth in the tree
    const insertChild = (sections: LocalSection[]): LocalSection[] =>
      sections.map(s => s.id === parentId
        ? { ...s, children: [...s.children, newSec] }
        : { ...s, children: insertChild(s.children) }
      );

    setLocalSections(prev => insertChild(prev));
    setSelectedNode({ type: 'section', id });
  }, []);

  const deleteSection = useCallback((id: string) => {
    const removeFromTree = (sections: LocalSection[]): LocalSection[] =>
      sections.filter(s => s.id !== id).map(s => ({ ...s, children: removeFromTree(s.children) }));
    setLocalSections(prev => removeFromTree(prev));
    setLocalQuestions(prev => prev.filter(q => q.sectionId !== id));
    if (selectedNode.type === 'section' && selectedNode.id === id) {
      setSelectedNode({ type: 'exam' });
    }
  }, [selectedNode]);

  const updateLocalSection = useCallback((id: string, patch: Partial<LocalSection>) => {
    const applyPatch = (sections: LocalSection[]): LocalSection[] =>
      sections.map(s => s.id === id ? { ...s, ...patch } : { ...s, children: applyPatch(s.children) });
    setLocalSections(prev => applyPatch(prev));
  }, []);

  // ── Question helpers ──
  const addQuestionToSection = useCallback((sectionId: string) => {
    const id = `q-${uuidv4().slice(0, 8)}`;
    const newQ: LocalQuestion = {
      id, sectionId,
      type: 'multiple-choice',
      content: '',
      options: [
        { id: uuidv4(), text: '', isCorrect: false },
        { id: uuidv4(), text: '', isCorrect: false },
        { id: uuidv4(), text: '', isCorrect: false },
        { id: uuidv4(), text: '', isCorrect: false },
      ],
      correctAnswer: [],
      points: 1,
      explanation: '',
    };
    setLocalQuestions(prev => [...prev, newQ]);
    setSelectedNode({ type: 'question', id, sectionId });
  }, []);

  const updateLocalQuestion = useCallback((id: string, patch: Partial<LocalQuestion>) => {
    setLocalQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
  }, []);

  const deleteLocalQuestion = useCallback((id: string) => {
    setLocalQuestions(prev => prev.filter(q => q.id !== id));
    if (selectedNode.type === 'question' && selectedNode.id === id) {
      setSelectedNode({ type: 'exam' });
    }
  }, [selectedNode]);

  // ── Save draft ──
  const handleSave = async () => {
    if (!currUser) {
      toast({ title: 'Lỗi', description: 'Bạn cần đăng nhập.', variant: 'destructive' });
      return;
    }
    if (!meta.title.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng nhập tên đề thi.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 400));

    const id = examId ?? `exam-${uuidv4().slice(0, 8)}`;
    const examData: Exam = {
      id, title: meta.title, description: meta.description,
      status: currentExam?.status ?? ExamStatus.Empty,
      testType: meta.testType, skill: meta.skill, difficulty: meta.difficulty,
      duration: meta.duration,
      createdBy: currUser.id, creatorId: currUser.id,
      tagIds: [],
      createdAt: currentExam?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    if (examId) dispatch(updateExam(examData));
    else { dispatch(addExam(examData)); setExamId(id); }

    // Persist sections
    localSections.forEach(sec => {
      const flattenSections = (sections: LocalSection[], parentId: string): void => {
        sections.forEach(s => {
          const existing = allSections.find(x => x.id === s.id);
          const data: Section = {
            id: s.id, parentId: s.id === sec.id ? id : s.parentId,
            title: s.title, direction: s.direction,
            difficulty: s.difficulty, lastEditedBy: currUser.id,
          };
          if (existing) dispatch(updateSection(data));
          else dispatch(addSection(data));
          flattenSections(s.children, s.id);
        });
      };
      flattenSections([sec], id);
    });

    // Persist questions
    localQuestions.forEach(q => {
      const existing = allQuestions.find(x => x.id === q.id);
      const data: Question = {
        id: q.id, sectionId: q.sectionId, type: q.type,
        content: q.content, options: q.options.map(o => o.text),
        correctAnswer: q.options.filter(o => o.isCorrect).map(o => o.text),
        points: q.points, explanation: q.explanation,
        lastEditedBy: currUser.id, tagIds: [],
      };
      if (existing) dispatch(updateQuestion(data));
      else dispatch(addQuestion(data));
    });

    setIsSaving(false);
    toast({ title: '✅ Đã lưu nháp', description: `Đề "${meta.title}" đã được lưu.` });
  };

  // ── Submit for approval ──
  const handleSubmit = async () => {
    if (!examId) { await handleSave(); }
    if (localQuestions.length === 0) {
      toast({ title: 'Chưa đủ nội dung', description: 'Đề thi phải có ít nhất 1 câu hỏi.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 400));
    if (examId) dispatch(submitForApproval(examId));
    setIsSubmitting(false);
    setShowReview(false);
    toast({ title: '📤 Đã nộp duyệt', description: 'Đề thi đã được gửi cho Head Staff xét duyệt.' });
  };

  // ── Get currently selected section ──
  const getSection = (id: string): LocalSection | undefined => {
    const find = (sections: LocalSection[]): LocalSection | undefined => {
      for (const s of sections) {
        if (s.id === id) return s;
        const found = find(s.children);
        if (found) return found;
      }
    };
    return find(localSections);
  };

  const selectedQuestion = selectedNode.type === 'question'
    ? localQuestions.find(q => q.id === selectedNode.id)
    : null;

  const selectedSection = selectedNode.type === 'section'
    ? getSection(selectedNode.id)
    : null;

  // ─── RENDER ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white shrink-0">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-cyan-200" />
            <div>
              <h1 className="text-xl font-bold">
                {meta.title || 'Đề thi mới'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
                {currentExam?.status === ExamStatus.NeedsRevision && currentExam.rejectionReason && (
                  <span className="text-xs text-red-200">• {currentExam.rejectionReason}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReview(true)}
              className="text-white hover:bg-white/20 border border-white/30"
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Review & Nộp
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold border-0 shadow"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? 'Đang lưu...' : 'Lưu nháp'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 3-Panel Layout ── */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 88px)' }}>

        {/* ── LEFT SIDEBAR — Section Tree ── */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cấu trúc đề thi</span>
            <button
              onClick={addRootSection}
              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Thêm section"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
            {/* Root: Exam metadata node */}
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors
                                ${selectedNode.type === 'exam' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => setSelectedNode({ type: 'exam' })}
            >
              <Settings className={`h-3.5 w-3.5 shrink-0 ${selectedNode.type === 'exam' ? 'text-blue-100' : 'text-blue-500'}`} />
              <span className="flex-1 truncate font-semibold text-xs">Thông tin chung</span>
            </div>

            {/* Section tree */}
            {localSections.map(sec => (
              <div key={sec.id}>
                <SectionTreeNode
                  node={sec}
                  depth={0}
                  selectedNode={selectedNode}
                  onSelect={setSelectedNode}
                  onAddChild={addChildSection}
                  onDelete={deleteSection}
                  questionCount={questionCount}
                />
                {/* Questions under this section (leaf only) */}
                {selectedNode.type === 'section' && selectedNode.id === sec.id && sec.children.length === 0 && (
                  <div className="pl-8 py-1 space-y-0.5">
                    {questionsForSection(sec.id).map((q, i) => (
                      <QuestionItem
                        key={q.id}
                        question={q}
                        index={i}
                        selectedNode={selectedNode}
                        onSelect={setSelectedNode}
                        onDelete={deleteLocalQuestion}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {localSections.length === 0 && (
              <div className="text-center py-8 text-xs text-gray-400">
                <Layers className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                Chưa có section nào.<br />Nhấn + để thêm.
              </div>
            )}
          </div>

          {/* Stats footer */}
          <div className="border-t border-gray-100 px-3 py-2 bg-gray-50 text-xs text-gray-500 flex justify-between">
            <span>{localSections.length} section</span>
            <span>{totalQuestions} câu • {totalPoints}đ</span>
          </div>
        </div>

        {/* ── CENTER PANEL — Contextual Editor ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ─── EXAM METADATA EDITOR ─── */}
          {selectedNode.type === 'exam' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-800">Thông tin chung</h2>
              </div>

              {currentExam?.status === ExamStatus.NeedsRevision && currentExam.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Đề bị trả về — cần chỉnh sửa</p>
                    <p className="text-sm text-red-600 mt-0.5">{currentExam.rejectionReason}</p>
                  </div>
                </div>
              )}

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-5 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tên đề thi *</Label>
                    <Input
                      value={meta.title}
                      onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
                      placeholder="Ví dụ: IELTS Reading Mock Test 1"
                      className="mt-1 bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Mô tả</Label>
                    <Textarea
                      value={meta.description}
                      onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                      placeholder="Mô tả ngắn về đề thi..."
                      rows={3}
                      className="mt-1 bg-gray-50 border-gray-200 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Loại chứng chỉ</Label>
                      <Select value={meta.testType} onValueChange={v => setMeta(m => ({ ...m, testType: v as TestType }))}>
                        <SelectTrigger className="mt-1 bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-[200]">
                          <SelectItem value={TestType.IELTS}>IELTS</SelectItem>
                          <SelectItem value={TestType.TOEIC}>TOEIC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Kỹ năng</Label>
                      <Select value={meta.skill} onValueChange={v => setMeta(m => ({ ...m, skill: v as Skill }))}>
                        <SelectTrigger className="mt-1 bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-[200]">
                          <SelectItem value={Skill.Reading}>Reading</SelectItem>
                          <SelectItem value={Skill.Listening}>Listening</SelectItem>
                          <SelectItem value={Skill.Writing}>Writing</SelectItem>
                          <SelectItem value={Skill.Speaking}>Speaking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Độ khó</Label>
                      <Select value={meta.difficulty} onValueChange={v => setMeta(m => ({ ...m, difficulty: v as Difficulty }))}>
                        <SelectTrigger className="mt-1 bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-[200]">
                          <SelectItem value={Difficulty.Beginner}>Cơ bản</SelectItem>
                          <SelectItem value={Difficulty.Intermediate}>Trung bình</SelectItem>
                          <SelectItem value={Difficulty.Advanced}>Nâng cao</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Thời gian (phút)</Label>
                      <Input
                        type="number" min={1} max={300}
                        value={meta.duration}
                        onChange={e => setMeta(m => ({ ...m, duration: Number(e.target.value) }))}
                        className="mt-1 bg-gray-50 border-gray-200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center py-4 text-sm text-gray-400">
                ← Chọn một section ở sidebar để chỉnh sửa nội dung
              </div>
            </div>
          )}

          {/* ─── SECTION EDITOR ─── */}
          {selectedNode.type === 'section' && selectedSection && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Chỉnh sửa Section</h2>
                </div>
                <Button
                  size="sm"
                  onClick={() => addQuestionToSection(selectedSection.id)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Thêm câu hỏi
                </Button>
              </div>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-5 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tên section</Label>
                    <Input
                      value={selectedSection.title}
                      onChange={e => updateLocalSection(selectedSection.id, { title: e.target.value })}
                      placeholder="Ví dụ: Part 1 – Reading Comprehension"
                      className="mt-1 bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nội dung / Hướng dẫn</Label>
                    <Textarea
                      value={selectedSection.direction}
                      onChange={e => updateLocalSection(selectedSection.id, { direction: e.target.value })}
                      placeholder="Nhập hướng dẫn cho phần thi hoặc đoạn văn Reading/Listening..."
                      rows={8}
                      className="mt-1 bg-gray-50 border-gray-200 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Độ khó</Label>
                    <Select
                      value={selectedSection.difficulty}
                      onValueChange={v => updateLocalSection(selectedSection.id, { difficulty: v as Difficulty })}
                    >
                      <SelectTrigger className="mt-1 bg-gray-50 border-gray-200 w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-[200]">
                        <SelectItem value={Difficulty.Beginner}>Cơ bản</SelectItem>
                        <SelectItem value={Difficulty.Intermediate}>Trung bình</SelectItem>
                        <SelectItem value={Difficulty.Advanced}>Nâng cao</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Questions list for this section */}
              {selectedSection.children.length === 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700 text-sm">
                      Câu hỏi ({questionsForSection(selectedSection.id).length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {questionsForSection(selectedSection.id).map((q, i) => (
                      <div
                        key={q.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                          ${(selectedNode as { type: string; id?: string }).id === q.id
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        onClick={() => setSelectedNode({ type: 'question', id: q.id, sectionId: q.sectionId })}
                      >
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {q.content || '(Nội dung câu hỏi)'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {QUESTION_TYPE_LABELS[q.type]} • {q.points} điểm
                          </p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteLocalQuestion(q.id); }}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {questionsForSection(selectedSection.id).length === 0 && (
                      <div
                        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-colors"
                        onClick={() => addQuestionToSection(selectedSection.id)}
                      >
                        <HelpCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Nhấn để thêm câu hỏi đầu tiên</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedSection.children.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                  💡 Section này có {selectedSection.children.length} subsection con. Chọn subsection để thêm câu hỏi.
                </div>
              )}
            </div>
          )}

          {/* ─── QUESTION EDITOR ─── */}
          {selectedNode.type === 'question' && selectedQuestion && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-800">Chỉnh sửa câu hỏi</h2>
              </div>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-5 space-y-4">
                  {/* Type + Points */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700">Loại câu hỏi</Label>
                      <Select
                        value={selectedQuestion.type}
                        onValueChange={v => updateLocalQuestion(selectedQuestion.id, { type: v as LocalQuestion['type'], options: [] })}
                      >
                        <SelectTrigger className="mt-1 bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-[200]">
                          {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-28">
                      <Label className="text-sm font-medium text-gray-700">Điểm</Label>
                      <Input
                        type="number" min={1} max={100}
                        value={selectedQuestion.points}
                        onChange={e => updateLocalQuestion(selectedQuestion.id, { points: Number(e.target.value) })}
                        className="mt-1 bg-gray-50 border-gray-200"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nội dung câu hỏi *</Label>
                    <Textarea
                      value={selectedQuestion.content}
                      onChange={e => updateLocalQuestion(selectedQuestion.id, { content: e.target.value })}
                      placeholder="Nhập nội dung câu hỏi..."
                      rows={3}
                      className="mt-1 bg-gray-50 border-gray-200"
                    />
                  </div>

                  {/* Answers for multiple choice types */}
                  {(selectedQuestion.type === 'multiple-choice' || selectedQuestion.type === 'multiple-correct-answers') && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-gray-700">Phương án trả lời</Label>
                        <button
                          onClick={() => updateLocalQuestion(selectedQuestion.id, {
                            options: [...selectedQuestion.options, { id: uuidv4(), text: '', isCorrect: false }]
                          })}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Thêm phương án
                        </button>
                      </div>
                      <div className="space-y-2">
                        {selectedQuestion.options.map((opt, i) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const updated = selectedQuestion.options.map(o => ({
                                  ...o,
                                  isCorrect: o.id === opt.id
                                    ? !o.isCorrect
                                    : selectedQuestion.type === 'multiple-choice' ? false : o.isCorrect
                                }));
                                updateLocalQuestion(selectedQuestion.id, { options: updated });
                              }}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                                                                ${opt.isCorrect ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}
                            >
                              {opt.isCorrect && <CheckCircle className="h-4 w-4 text-white" />}
                            </button>
                            <span className="text-xs text-gray-400 w-5 shrink-0">{String.fromCharCode(65 + i)}.</span>
                            <Input
                              value={opt.text}
                              onChange={e => {
                                const updated = selectedQuestion.options.map(o =>
                                  o.id === opt.id ? { ...o, text: e.target.value } : o
                                );
                                updateLocalQuestion(selectedQuestion.id, { options: updated });
                              }}
                              placeholder={`Phương án ${String.fromCharCode(65 + i)}`}
                              className={`bg-gray-50 border-gray-200 flex-1 text-sm
                                                                ${opt.isCorrect ? 'border-green-300 bg-green-50' : ''}`}
                            />
                            {selectedQuestion.options.length > 2 && (
                              <button
                                onClick={() => updateLocalQuestion(selectedQuestion.id, {
                                  options: selectedQuestion.options.filter(o => o.id !== opt.id)
                                })}
                                className="text-gray-300 hover:text-red-500 shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {selectedQuestion.type === 'multiple-choice'
                          ? '● Chọn 1 đáp án đúng bằng cách click vào vòng tròn'
                          : '● Có thể chọn nhiều đáp án đúng'}
                      </p>
                    </div>
                  )}

                  {/* Fill blank correct answer */}
                  {selectedQuestion.type === 'fill-blank' && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Đáp án đúng</Label>
                      <Input
                        value={selectedQuestion.correctAnswer[0] ?? ''}
                        onChange={e => updateLocalQuestion(selectedQuestion.id, { correctAnswer: [e.target.value] })}
                        placeholder="Nhập đáp án chính xác..."
                        className="mt-1 bg-gray-50 border-gray-200"
                      />
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Giải thích đáp án</Label>
                    <Textarea
                      value={selectedQuestion.explanation}
                      onChange={e => updateLocalQuestion(selectedQuestion.id, { explanation: e.target.value })}
                      placeholder="Giải thích tại sao đáp án đó đúng..."
                      rows={3}
                      className="mt-1 bg-gray-50 border-gray-200 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ── REVIEW MODAL ── */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-t-2xl p-5 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Review & Nộp duyệt</h2>
                <button onClick={() => setShowReview(false)} className="text-white/80 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-blue-100 mt-1">{meta.title || 'Đề thi chưa đặt tên'}</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Section', value: localSections.length, icon: Layers, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Câu hỏi', value: totalQuestions, icon: HelpCircle, color: 'text-purple-600 bg-purple-50' },
                  { label: 'Tổng điểm', value: totalPoints, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className={`rounded-xl p-3 text-center ${color.split(' ')[1]}`}>
                    <Icon className={`h-5 w-5 mx-auto mb-1 ${color.split(' ')[0]}`} />
                    <div className={`text-xl font-bold ${color.split(' ')[0]}`}>{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              {/* Validation */}
              {(() => {
                const errors: string[] = [];
                if (!meta.title.trim()) errors.push('Chưa có tên đề thi');
                if (localSections.length === 0) errors.push('Chưa có section nào');
                if (totalQuestions === 0) errors.push('Chưa có câu hỏi nào');
                localQuestions.forEach(q => {
                  if (!q.content.trim()) errors.push(`Câu hỏi "${q.id.slice(-4)}" chưa có nội dung`);
                  if ((q.type === 'multiple-choice' || q.type === 'multiple-correct-answers') && !q.options.some(o => o.isCorrect)) {
                    errors.push(`Câu hỏi "${q.content.slice(0, 20) || q.id.slice(-4)}" chưa có đáp án đúng`);
                  }
                });

                if (errors.length > 0) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" /> Cần sửa trước khi nộp:
                      </p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {errors.map((e, i) => <li key={i}>• {e}</li>)}
                      </ul>
                    </div>
                  );
                }
                return (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    <p className="text-sm text-green-700">Đề thi sẵn sàng để nộp duyệt!</p>
                  </div>
                );
              })()}

              {/* Info */}
              <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                <Clock className="h-3.5 w-3.5 inline mr-1" />
                Sau khi nộp, đề sẽ chuyển sang trạng thái <strong>Chờ duyệt</strong>.
                Head Staff sẽ xem xét và phản hồi.
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={() => setShowReview(false)} className="flex-1">
                  Tiếp tục chỉnh sửa
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !meta.title.trim() || totalQuestions === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  {isSubmitting ? 'Đang nộp...' : 'Nộp duyệt'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
