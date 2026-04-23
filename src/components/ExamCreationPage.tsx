'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ExamManagementService,
  getAccessToken,
  getRefreshToken,
} from '@/lib/api-client';
import { extractApiErrorMessage, extractEntityData, parseCommaSeparatedValues } from '@/lib/api-response';
import { useAuth } from '@/lib/hooks/useAuth';
import { AdminTagManager } from '@/components/admin/AdminTagManager';
import { AdminUploadTool } from '@/components/admin/AdminUploadTool';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from './ui/use-toast';
import {
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Layers,
  HelpCircle,
  Move,
  Send,
  FilePlus2,
  ShieldCheck,
  Sparkles,
  FolderTree,
  ListChecks,
  ClipboardPen,
} from 'lucide-react';

type SelectedNode =
  | { type: 'overview' }
  | { type: 'section'; id: string }
  | { type: 'question'; id: string };

type ExamDetails = {
  id: string;
  title: string;
  description?: string;
  duration: number;
  status: string;
  sectionIds: string[];
  tags: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
};

type SectionDetails = {
  id: string;
  examId: string;
  parentId?: string;
  name?: string;
  directive: string;
  contentType: string;
  questionIds: string[];
  tags: string[];
  files: Array<{ id: string; url: string }>;
};

type ChoiceDetails = {
  id?: string;
  key: string;
  content: string;
  isCorrect: boolean;
};

type QuestionDetails = {
  id: string;
  sectionId: string;
  content: string;
  explanation: string;
  points: number;
  type: string;
  tags: string[];
  files: Array<{ id: string; url: string }>;
  choices: ChoiceDetails[];
};

type SectionMoveState = {
  parentId: string;
  index: string;
  toRoot: boolean;
};

type QuestionMoveState = {
  sectionId: string;
  index: string;
};

const QUESTION_TYPE_OPTIONS = [
  'multiple-choice',
  'multiple-correct-answers',
  'fill-blank',
  'essay',
  'speaking',
];

const REVIEW_STATUSES = ['InDraft', 'Published', 'NeedsRevision'];

const getQuestionModeLabel = (type: string) => {
  if (type === 'multiple-choice') return 'Chọn 1 đáp án đúng';
  if (type === 'multiple-correct-answers') return 'Có thể chọn nhiều đáp án đúng';
  if (type === 'fill-blank') return 'Câu hỏi điền từ';
  if (type === 'essay') return 'Câu hỏi tự luận';
  if (type === 'speaking') return 'Câu hỏi nói';
  return type;
};

const getRootSectionIds = (examId: string, sections: SectionDetails[]): string[] => {
  const sectionIds = new Set(sections.map((section) => section.id));

  return sections
    .filter((section) => !section.parentId || section.parentId === examId || !sectionIds.has(section.parentId))
    .map((section) => section.id);
};

const buildChoiceDrafts = (question: QuestionDetails): ChoiceDetails[] => {
  if (question.choices.length > 0) {
    return question.choices.map((choice) => ({
      id: choice.id,
      key: choice.key,
      content: choice.content ?? '',
      isCorrect: choice.isCorrect,
    }));
  }

  return [
    { key: 'A', content: '', isCorrect: false },
    { key: 'B', content: '', isCorrect: false },
  ];
};

const AUTHORING_STEPS = [
  '1. Xác định mục tiêu đề: Listening, Reading hay full test.',
  '2. Tạo section theo đúng cấu trúc phần thi thật trước khi thêm câu hỏi.',
  '3. Viết directive giống giọng văn exam thật: ngắn, rõ, đúng yêu cầu.',
  '4. Thêm câu hỏi theo đúng part, số lượng và độ khó tăng dần hợp lý.',
  '5. Kiểm tra đáp án, explanation và thời lượng trước khi gửi review.',
];

const REAL_EXAM_HINTS = [
  'Giữ wording trung tính, rõ nghĩa và tránh mẹo đánh đố không giống đề thật.',
  'Mỗi section nên kiểm tra một kỹ năng/mẫu câu hỏi rõ ràng, không trộn quá nhiều mục tiêu.',
  'Với đề TOEIC, nên bám số câu từng part và nhịp độ quen thuộc của full test.',
];

const TOEIC_BLUEPRINT = [
  { part: 'Part 1', focus: 'Photographs', questions: 6, sectionType: 'Listening' },
  { part: 'Part 2', focus: 'Question-Response', questions: 25, sectionType: 'Listening' },
  { part: 'Part 3', focus: 'Conversations', questions: 39, sectionType: 'Listening' },
  { part: 'Part 4', focus: 'Talks', questions: 30, sectionType: 'Listening' },
  { part: 'Part 5', focus: 'Incomplete Sentences', questions: 30, sectionType: 'Reading' },
  { part: 'Part 6', focus: 'Text Completion', questions: 16, sectionType: 'Reading' },
  { part: 'Part 7', focus: 'Reading Comprehension', questions: 54, sectionType: 'Reading' },
];

export function ExamCreationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isHeadStaff, isStaff } = useAuth();

  const queryExamId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [savingExam, setSavingExam] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode>({ type: 'overview' });
  const [examId, setExamId] = useState<string | null>(queryExamId);

  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [examDraft, setExamDraft] = useState({
    title: '',
    description: '',
    duration: '60',
    tagsInput: '',
  });

  const [sections, setSections] = useState<Record<string, SectionDetails>>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [sectionSnapshots, setSectionSnapshots] = useState<Record<string, SectionDetails>>({});
  const [questions, setQuestions] = useState<Record<string, QuestionDetails>>({});
  const [questionSnapshots, setQuestionSnapshots] = useState<Record<string, QuestionDetails>>({});

  const [sectionMoveState, setSectionMoveState] = useState<Record<string, SectionMoveState>>({});
  const [questionMoveState, setQuestionMoveState] = useState<Record<string, QuestionMoveState>>({});
  const [reviewStatus, setReviewStatus] = useState('InDraft');

  const ensureApiSession = (actionLabel = 'thao tác với editor admin') => {
    if (getAccessToken() || getRefreshToken()) {
      return true;
    }

    toast({
      title: 'Thiếu phiên backend',
      description: `Hãy đăng xuất rồi đăng nhập lại để lấy token backend trước khi ${actionLabel}.`,
      variant: 'destructive',
    });
    return false;
  };

  const loadEditorData = async (id: string) => {
    if (!ensureApiSession('tải dữ liệu đề thi')) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const examResponse = await ExamManagementService.examManagementGatewayControllerGetExamDetailsV1({ id });
      const examPayload = extractEntityData<ExamDetails>(examResponse);

      if (!examPayload) {
        throw new Error('Không nhận được dữ liệu đề thi.');
      }

      const sectionIds = examPayload.sectionIds ?? [];
      const sectionResponses = await Promise.all(
        sectionIds.map((sectionId) =>
          ExamManagementService.examManagementGatewayControllerGetSectionDetailsV1({ id: sectionId })
        )
      );

      const loadedSections = sectionResponses
        .map((response) => extractEntityData<SectionDetails>(response))
        .filter((section): section is SectionDetails => Boolean(section));

      const questionIds = loadedSections.flatMap((section) => section.questionIds ?? []);
      const questionResponses = await Promise.all(
        questionIds.map((questionId) =>
          ExamManagementService.examManagementGatewayControllerGetQuestionDetailsV1({ id: questionId })
        )
      );

      const loadedQuestions = questionResponses
        .map((response) => extractEntityData<QuestionDetails>(response))
        .filter((question): question is QuestionDetails => Boolean(question))
        .map((question) => ({
          ...question,
          choices: buildChoiceDrafts(question),
        }));

      const nextSections = Object.fromEntries(loadedSections.map((section) => [section.id, section]));
      const nextQuestions = Object.fromEntries(loadedQuestions.map((question) => [question.id, question]));

      setExam(examPayload);
      setExamDraft({
        title: examPayload.title ?? '',
        description: examPayload.description ?? '',
        duration: String(examPayload.duration ?? 60),
        tagsInput: (examPayload.tags ?? []).join(', '),
      });
      setSections(nextSections);
      setSectionSnapshots(nextSections);
      setSectionOrder(sectionIds);
      setQuestions(nextQuestions);
      setQuestionSnapshots(nextQuestions);
      setReviewStatus(examPayload.status === 'Published' ? 'Published' : 'InDraft');

      setSectionMoveState(
        Object.fromEntries(
          loadedSections.map((section, index) => [
            section.id,
            {
              parentId: section.parentId ?? '',
              index: String(index),
              toRoot: !section.parentId || section.parentId === examPayload.id,
            },
          ])
        )
      );

      setQuestionMoveState(
        Object.fromEntries(
          loadedQuestions.map((question, index) => [
            question.id,
            {
              sectionId: question.sectionId,
              index: String(index),
            },
          ])
        )
      );
    } catch (error) {
      toast({
        title: 'Không tải được editor',
        description: extractApiErrorMessage(error, 'Không thể tải dữ liệu đề thi từ API.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!queryExamId) {
      setExam(null);
      setExamId(null);
      setExamDraft({ title: '', description: '', duration: '60', tagsInput: '' });
      setSections({});
      setSectionSnapshots({});
      setSectionOrder([]);
      setQuestions({});
      setQuestionSnapshots({});
      setSelectedNode({ type: 'overview' });
      return;
    }

    setExamId(queryExamId);
    void loadEditorData(queryExamId);
  }, [queryExamId]);

  const sectionList = useMemo(
    () => sectionOrder.map((sectionId) => sections[sectionId]).filter((section): section is SectionDetails => Boolean(section)),
    [sectionOrder, sections]
  );

  const rootSectionIds = useMemo(
    () => (examId ? getRootSectionIds(examId, sectionList) : []),
    [examId, sectionList]
  );

  const selectedSection = selectedNode.type === 'section' ? sections[selectedNode.id] ?? null : null;
  const selectedQuestion = selectedNode.type === 'question' ? questions[selectedNode.id] ?? null : null;
  const totalQuestions = Object.keys(questions).length;
  const totalSections = sectionList.length;
  const blueprintCoverage = totalQuestions > 0 ? Math.min(100, Math.round((totalQuestions / 200) * 100)) : 0;

  const applyToeicPreset = () => {
    setExamDraft((prev) => ({
      ...prev,
      title: prev.title || 'TOEIC Full Test Simulation',
      description:
        'TOEIC Listening & Reading mock test modeled after common Study4-style full tests: 7 parts, 200 questions, realistic timing and section flow.',
      duration: '120',
      tagsInput: prev.tagsInput || 'toeic, full-test, listening, reading',
    }));

    toast({
      title: 'Đã áp dụng preset TOEIC',
      description: 'Màn hình đã điền sẵn tiêu đề, mô tả và thời lượng cho một full test TOEIC.',
    });
  };

  const saveExam = async () => {
    if (!ensureApiSession(examId ? 'lưu đề thi' : 'tạo đề thi')) {
      return;
    }

    const duration = Number(examDraft.duration);

    if (!examDraft.title.trim()) {
      toast({ title: 'Thiếu tên đề', description: 'Vui lòng nhập tên đề thi.', variant: 'destructive' });
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      toast({ title: 'Duration không hợp lệ', description: 'Duration phải là số dương.', variant: 'destructive' });
      return;
    }

    setSavingExam(true);
    try {
      if (!examId) {
        const createResponse = await ExamManagementService.examManagementGatewayControllerCreateExamV1({
          requestBody: {
            title: examDraft.title.trim(),
            description: examDraft.description.trim(),
            duration,
          },
        });

        const created = extractEntityData<{ id?: string }>(createResponse);
        const createdExamId = created?.id;

        if (!createdExamId) {
          throw new Error('API không trả về id đề thi.');
        }

        setExamId(createdExamId);
        router.replace(`/exam-creation?id=${createdExamId}`);
        toast({ title: 'Đã tạo đề thi', description: `Đề mới có id: ${createdExamId}` });
        return;
      }

      const currentTags = exam?.tags ?? [];
      const nextTags = parseCommaSeparatedValues(examDraft.tagsInput);

      await ExamManagementService.examManagementGatewayControllerUpdateExamV1({
        id: examId,
        requestBody: {
          title: examDraft.title.trim(),
          description: examDraft.description.trim() || undefined,
          setDescriptionNull: !examDraft.description.trim(),
          duration,
          addTags: nextTags.filter((tag) => !currentTags.includes(tag)),
          removeTags: currentTags.filter((tag) => !nextTags.includes(tag)),
        },
      });

      toast({ title: 'Đã lưu đề thi', description: 'Thông tin đề thi đã được cập nhật.' });
      await loadEditorData(examId);
    } catch (error) {
      toast({
        title: 'Lưu đề thi thất bại',
        description: extractApiErrorMessage(error, 'Không thể lưu thông tin đề thi.'),
        variant: 'destructive',
      });
    } finally {
      setSavingExam(false);
    }
  };

  const createRootSection = async () => {
    if (!ensureApiSession('tạo section')) {
      return;
    }

    if (!examId) {
      toast({ title: 'Cần tạo đề trước', description: 'Hãy lưu đề thi để lấy id trước khi tạo section.', variant: 'destructive' });
      return;
    }

    setActionLoading('create-root-section');
    try {
      const response = await ExamManagementService.examManagementGatewayControllerCreateSectionInExamV1({
        id: examId,
        requestBody: { index: rootSectionIds.length },
      });

      const created = extractEntityData<{ id?: string }>(response);
      if (!created?.id) {
        throw new Error('API không trả về id section.');
      }

      toast({ title: 'Đã tạo section', description: `Section id: ${created.id}` });
      await loadEditorData(examId);
      setSelectedNode({ type: 'section', id: created.id });
    } catch (error) {
      toast({
        title: 'Tạo section thất bại',
        description: extractApiErrorMessage(error, 'Không thể tạo section mới.'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const createChildSection = async (parentSectionId: string) => {
    if (!ensureApiSession('tạo subsection')) {
      return;
    }

    if (!examId) {
      return;
    }

    const childrenCount = sectionList.filter((section) => section.parentId === parentSectionId).length;

    setActionLoading(`create-child-${parentSectionId}`);
    try {
      const response = await ExamManagementService.examManagementGatewayControllerCreateSectionInSectionV1({
        id: parentSectionId,
        requestBody: { index: childrenCount },
      });

      const created = extractEntityData<{ id?: string }>(response);
      if (!created?.id) {
        throw new Error('API không trả về id section con.');
      }

      toast({ title: 'Đã tạo subsection', description: `Section id: ${created.id}` });
      await loadEditorData(examId);
      setSelectedNode({ type: 'section', id: created.id });
    } catch (error) {
      toast({
        title: 'Tạo subsection thất bại',
        description: extractApiErrorMessage(error, 'Không thể tạo subsection mới.'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const saveSection = async (section: SectionDetails) => {
    if (!ensureApiSession('lưu section')) {
      return;
    }

    if (!examId) {
      return;
    }

    const snapshot = sectionSnapshots[section.id] ?? section;

    setActionLoading(`save-section-${section.id}`);
    try {
      await ExamManagementService.examManagementGatewayControllerUpdateSectionV1({
        id: section.id,
        requestBody: {
          name: section.name?.trim() || undefined,
          setNameNull: !section.name?.trim(),
          directive: section.directive,
          contentType: section.contentType,
          addTags: section.tags.filter((tag) => !(snapshot.tags ?? []).includes(tag)),
          removeTags: (snapshot.tags ?? []).filter((tag) => !section.tags.includes(tag)),
          addFiles: section.files.map((file) => file.id).filter((id) => !(snapshot.files ?? []).some((file) => file.id === id)),
          removeFiles: (snapshot.files ?? []).map((file) => file.id).filter((id) => !section.files.some((file) => file.id === id)),
        },
      });

      toast({ title: 'Đã lưu section', description: `Section ${section.name || section.id} đã được cập nhật.` });
      await loadEditorData(examId);
    } catch (error) {
      toast({
        title: 'Lưu section thất bại',
        description: extractApiErrorMessage(error, 'Không thể cập nhật section.'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!ensureApiSession('xóa section')) {
      return;
    }

    if (!examId) {
      return;
    }

    setActionLoading(`delete-section-${sectionId}`);
    try {
      await ExamManagementService.examManagementGatewayControllerDeleteSectionV1({ id: sectionId });
      toast({ title: 'Đã xóa section', description: `Section ${sectionId} đã được xóa.` });
      setSelectedNode({ type: 'overview' });
      await loadEditorData(examId);
    } catch (error) {
      toast({
        title: 'Xóa section thất bại',
        description: extractApiErrorMessage(error, 'Không thể xóa section này.'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const moveSection = async (sectionId: string) => {
    if (!ensureApiSession('di chuyển section')) {
      return;
    }

    if (!examId) {
      return;
    }

    const moveState = sectionMoveState[sectionId];
    if (!moveState) {
      return;
    }

    const index = Number(moveState.index);
    if (!Number.isFinite(index) || index < 0) {
      toast({ title: 'Index không hợp lệ', description: 'Index của section phải >= 0.', variant: 'destructive' });
      return;
    }

    setActionLoading(`move-section-${sectionId}`);
    try {
      await ExamManagementService.examManagementGatewayControllerMoveSectionV1({
        id: sectionId,
        requestBody: {
          index,
          toRoot: moveState.toRoot,
          parentId: moveState.toRoot ? undefined : moveState.parentId.trim() || undefined,
        },
      });

      toast({ title: 'Đã di chuyển section', description: `Section ${sectionId} đã được cập nhật vị trí.` });
      await loadEditorData(examId);
    } catch (error) {
      toast({
        title: 'Move section thất bại',
        description: extractApiErrorMessage(error, 'Không thể di chuyển section.'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const createQuestion = async (sectionId: string) => {
    if (!ensureApiSession('tạo câu hỏi')) {
      return;
    }

    if (!examId) {
      return;
    }

    const section = sections[sectionId];
    const index = section?.questionIds.length ?? 0;

    setActionLoading(`create-question-${sectionId}`);
    try {
      const response = await ExamManagementService.examManagementGatewayControllerCreateQuestionV1({
        id: sectionId,
        requestBody: { index },
      });

      const created = extractEntityData<{ id?: string }>(response);
      if (!created?.id) {
        throw new Error('API không trả về id câu hỏi.');
      }

      toast({ title: 'Đã tạo câu hỏi', description: `Question id: ${created.id}` });
      await loadEditorData(examId);
      setSelectedNode({ type: 'question', id: created.id });
    } catch (error) {
      toast({
        title: 'Tạo câu hỏi thất bại',
        description: extractApiErrorMessage(error, 'Không thể tạo câu hỏi mới.'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const saveQuestion = async (question: QuestionDetails) => {
    if (!ensureApiSession('lưu câu hỏi')) {
      return;
    }

    if (!examId) {
      return;
    }

    const snapshot = questionSnapshots[question.id] ?? question;
    const oldChoices = snapshot.choices ?? [];
    const nextChoices = question.choices ?? [];

    setActionLoading(`save-question-${question.id}`);
    try {
      await ExamManagementService.examManagementGatewayControllerUpdateQuestionV1({
        id: question.id,
        requestBody: {
          content: question.content,
          explanation: question.explanation,
          points: question.points,
          type: question.type,
          addChoices: nextChoices
            .filter((choice) => !choice.id)
            .map((choice) => ({
              key: choice.key,
              content: choice.content || undefined,
              isCorrect: choice.isCorrect,
            })),
          updateChoices: nextChoices
            .filter((choice) => Boolean(choice.id))
            .map((choice) => {
              const previousChoice = oldChoices.find((item) => item.id === choice.id);
              return {
                id: choice.id!,
                key: choice.key,
                content: choice.content || undefined,
                setContentNull: !choice.content,
                isCorrect: choice.isCorrect,
                ...(previousChoice ?? {}),
              };
            }),
          deleteChoicesIds: oldChoices
            .filter((choice) => choice.id && !nextChoices.some((item) => item.id === choice.id))
            .map((choice) => choice.id as string),
          addTags: question.tags.filter((tag) => !(snapshot.tags ?? []).includes(tag)),
          removeTags: (snapshot.tags ?? []).filter((tag) => !question.tags.includes(tag)),
          addFiles: question.files.map((file) => file.id).filter((id) => !(snapshot.files ?? []).some((file) => file.id === id)),
          removeFiles: (snapshot.files ?? []).map((file) => file.id).filter((id) => !question.files.some((file) => file.id === id)),
        },
      });

      toast({ title: 'Đã lưu câu hỏi', description: `Question ${question.id} đã được cập nhật.` });
      await loadEditorData(examId);
    } catch (error) {
      toast({
        title: 'Lưu câu hỏi thất bại',
        description: extractApiErrorMessage(error, 'Không thể cập nhật câu hỏi.'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!ensureApiSession('xóa câu hỏi')) {
      return;
    }

    if (!examId) {
      return;
    }

    setActionLoading(`delete-question-${questionId}`);
    try {
      await ExamManagementService.examManagementGatewayControllerDeleteQuestionV1({ id: questionId });
      toast({ title: 'Đã xóa câu hỏi', description: `Question ${questionId} đã được xóa.` });
      setSelectedNode({ type: 'overview' });
      await loadEditorData(examId);
    } catch (error) {
      toast({
        title: 'Xóa câu hỏi thất bại',
        description: extractApiErrorMessage(error, 'Không thể xóa câu hỏi.'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const moveQuestion = async (questionId: string) => {
    if (!ensureApiSession('di chuyển câu hỏi')) {
      return;
    }

    if (!examId) {
      return;
    }

    const moveState = questionMoveState[questionId];
    if (!moveState?.sectionId.trim()) {
      toast({ title: 'Thiếu section đích', description: 'Cần nhập section id đích để move question.', variant: 'destructive' });
      return;
    }

    const index = Number(moveState.index);
    if (!Number.isFinite(index) || index < 0) {
      toast({ title: 'Index không hợp lệ', description: 'Index của question phải >= 0.', variant: 'destructive' });
      return;
    }

    setActionLoading(`move-question-${questionId}`);
    try {
      await ExamManagementService.examManagementGatewayControllerMoveQuestionV1({
        id: questionId,
        requestBody: {
          sectionId: moveState.sectionId.trim(),
          index,
        },
      });

      toast({ title: 'Đã di chuyển câu hỏi', description: `Question ${questionId} đã được cập nhật vị trí.` });
      await loadEditorData(examId);
    } catch (error) {
      toast({
        title: 'Move question thất bại',
        description: extractApiErrorMessage(error, 'Không thể di chuyển câu hỏi.'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const reviewExam = async () => {
    if (!ensureApiSession('review đề thi')) {
      return;
    }

    if (!examId) {
      return;
    }

    setActionLoading('review-exam');
    try {
      await ExamManagementService.examManagementGatewayControllerReviewExamV1({
        id: examId,
        requestBody: {
          status: reviewStatus,
        },
      });

      toast({ title: 'Đã gửi review action', description: `Trạng thái mới: ${reviewStatus}` });
      await loadEditorData(examId);
    } catch (error) {
      toast({
        title: 'Review exam thất bại',
        description: extractApiErrorMessage(error, 'Không thể cập nhật trạng thái review của đề thi.'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const renderSectionTree = (sectionId: string, depth = 0) => {
    const section = sections[sectionId];
    if (!section) {
      return null;
    }

    const children = sectionList
      .filter((item) => item.parentId === sectionId)
      .map((child) => child.id);
    const isSelected = selectedNode.type === 'section' && selectedNode.id === sectionId;
    const descendantQuestionCount = section.questionIds.length + children.reduce((sum, childId) => {
      const childSection = sections[childId];
      return sum + (childSection?.questionIds.length ?? 0);
    }, 0);

    return (
      <div key={sectionId} className="space-y-2">
        <div
          className={`relative rounded-2xl border px-3 py-3 text-sm cursor-pointer transition-all ${
            isSelected
              ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-900 shadow-sm'
              : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50'
          }`}
          style={{ marginLeft: depth * 18 }}
          onClick={() => setSelectedNode({ type: 'section', id: sectionId })}
        >
          {depth > 0 && (
            <div className="absolute -left-3 top-0 bottom-0 w-px bg-gradient-to-b from-blue-100 via-slate-200 to-transparent" />
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  Level {depth + 1}
                </span>
                <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                  {children.length} child
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  {descendantQuestionCount} question
                </span>
              </div>
              <p className="mt-2 font-semibold truncate">{section.name || `Section ${section.id.slice(0, 8)}`}</p>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                {section.directive || 'Chưa có directive. Hãy thêm hướng dẫn hoặc nội dung cho section này.'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="rounded-full bg-gray-100 px-2 py-0.5">id: {section.id.slice(0, 8)}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5">
                  parent: {section.parentId ? section.parentId.slice(0, 8) : 'root'}
                </span>
                {section.tags.length > 0 && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                    {section.tags.length} tag
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 rounded-xl px-2 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                onClick={(event) => {
                  event.stopPropagation();
                  void createChildSection(sectionId);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {section.questionIds.map((questionId) => {
          const question = questions[questionId];
          if (!question) {
            return null;
          }

          return (
            <button
              key={questionId}
              type="button"
              className={`block w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                selectedNode.type === 'question' && selectedNode.id === questionId
                  ? 'border-purple-300 bg-purple-50 text-purple-900'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              style={{ marginLeft: (depth + 1) * 16 }}
              onClick={() => setSelectedNode({ type: 'question', id: questionId })}
            >
              <p className="font-medium truncate">{question.content || `Question ${question.id.slice(0, 8)}`}</p>
              <p className="text-xs text-gray-500">
                {question.type} · {question.points} điểm
              </p>
            </button>
          );
        })}

        {children.map((childId) => renderSectionTree(childId, depth + 1))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_26%),linear-gradient(110deg,#1d4ed8_0%,#0891b2_48%,#0f766e_100%)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,0,0,0.1)_100%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Exam Editor</h1>
              <p className="mt-1 text-sm text-blue-100">
                Editor này dùng API thật cho exam, section, question, tags và presigned upload.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="border border-white/25 text-white hover:bg-white/15"
                onClick={applyToeicPreset}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                TOEIC preset
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => examId && void loadEditorData(examId)} disabled={!examId || loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Reload
              </Button>
              <Button className="bg-white text-blue-700 hover:bg-blue-50" onClick={() => void saveExam()} disabled={savingExam}>
                <Save className="h-4 w-4 mr-2" />
                {savingExam ? 'Đang lưu...' : examId ? 'Lưu đề thi' : 'Tạo đề thi'}
              </Button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Target Format</p>
              <p className="mt-2 text-2xl font-semibold">TOEIC L&R</p>
              <p className="mt-1 text-sm text-blue-100">7 parts · 200 questions · 120 minutes</p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Current Coverage</p>
              <p className="mt-2 text-2xl font-semibold">{totalQuestions}/200</p>
              <p className="mt-1 text-sm text-blue-100">{blueprintCoverage}% of a full-test blueprint</p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Build Flow</p>
              <p className="mt-2 text-base font-semibold">Exam info → Sections → Questions → Review</p>
              <p className="mt-1 text-sm text-blue-100">Create the structure first, then fill each part like a real exam.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-blue-600" />
                Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => void createRootSection()} disabled={!examId || actionLoading === 'create-root-section'}>
                <FilePlus2 className="h-4 w-4 mr-2" />
                Thêm root section
              </Button>

              {!examId && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  Cần tạo đề thi trước khi thêm section hoặc question.
                </div>
              )}

              <div className="space-y-3">
                {rootSectionIds.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có section nào.</p>
                ) : (
                  rootSectionIds.map((sectionId) => renderSectionTree(sectionId))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Exam ID</p>
                <p className="font-mono text-sm text-gray-900 break-all">{examId ?? 'Chưa có'}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                <p className="text-sm font-medium text-gray-900">{exam?.status ?? 'Draft local'}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Sections / Questions</p>
                <p className="text-sm font-medium text-gray-900">{totalSections} / {totalQuestions}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs uppercase tracking-wide text-blue-600">TOEIC Target</p>
                <p className="text-sm font-medium text-blue-900">Listen 100 + Read 100</p>
                <p className="mt-1 text-xs text-blue-700">Keep the familiar pacing of a full test: Parts 1-4 then Parts 5-7.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="editor" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-transparent p-0 gap-3">
            <TabsTrigger value="editor" className="rounded-2xl border border-gray-200 bg-white py-3 data-[state=active]:border-blue-200 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Editor</TabsTrigger>
            <TabsTrigger value="tags" className="rounded-2xl border border-gray-200 bg-white py-3 data-[state=active]:border-blue-200 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Tags</TabsTrigger>
            <TabsTrigger value="uploads" className="rounded-2xl border border-gray-200 bg-white py-3 data-[state=active]:border-blue-200 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Uploads</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardPen className="h-5 w-5 text-blue-600" />
                    Authoring Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {AUTHORING_STEPS.map((step) => (
                    <div key={step} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                      {step}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListChecks className="h-5 w-5 text-emerald-600" />
                    Real-Test Blueprint
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {TOEIC_BLUEPRINT.map((item) => (
                      <div key={item.part} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.part}</p>
                            <p className="mt-1 text-xs text-slate-600">{item.focus}</p>
                          </div>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm">
                            {item.questions} Q
                          </span>
                        </div>
                        <p className="mt-3 text-xs uppercase tracking-wide text-emerald-700">{item.sectionType}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <Sparkles className="h-4 w-4" />
                      Quality notes
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-amber-800">
                      {REAL_EXAM_HINTS.map((hint) => (
                        <p key={hint}>{hint}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderTree className="h-5 w-5 text-blue-600" />
                  Exam Info
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Title</Label>
                  <Input value={examDraft.title} onChange={(event) => setExamDraft((prev) => ({ ...prev, title: event.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={4}
                    value={examDraft.description}
                    onChange={(event) => setExamDraft((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input value={examDraft.duration} onChange={(event) => setExamDraft((prev) => ({ ...prev, duration: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tag ids (comma separated)</Label>
                  <Input
                    value={examDraft.tagsInput}
                    onChange={(event) => setExamDraft((prev) => ({ ...prev, tagsInput: event.target.value }))}
                    placeholder="tag-id-1, tag-id-2"
                  />
                </div>
              </CardContent>
            </Card>

            {(isHeadStaff || isStaff) && examId && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    Review / Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-[220px_auto] md:items-end">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                      value={reviewStatus}
                      onChange={(event) => setReviewStatus(event.target.value)}
                    >
                      {REVIEW_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={() => void reviewExam()} disabled={actionLoading === 'review-exam'}>
                    <Send className="h-4 w-4 mr-2" />
                    {actionLoading === 'review-exam' ? 'Đang gửi...' : 'Gửi review action'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedNode.type === 'overview' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                    Start with exam metadata first: title, duration, and global tags.
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                    Build the structure by parts before writing questions, especially for a full TOEIC test.
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                    Keep the order familiar: listening flow first, then reading flow, and review at the end.
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedSection && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FolderTree className="h-5 w-5 text-blue-600" />
                    Section Detail
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void createQuestion(selectedSection.id)} disabled={actionLoading === `create-question-${selectedSection.id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add question
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => void deleteSection(selectedSection.id)} disabled={actionLoading === `delete-section-${selectedSection.id}`}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={selectedSection.name ?? ''}
                        onChange={(event) =>
                          setSections((prev) => ({
                            ...prev,
                            [selectedSection.id]: { ...prev[selectedSection.id], name: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content Type</Label>
                      <Input
                        value={selectedSection.contentType}
                        onChange={(event) =>
                          setSections((prev) => ({
                            ...prev,
                            [selectedSection.id]: { ...prev[selectedSection.id], contentType: event.target.value },
                          }))
                        }
                        placeholder="reading-passage, instructions, audio-script..."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Directive</Label>
                      <Textarea
                        rows={6}
                        value={selectedSection.directive}
                        onChange={(event) =>
                          setSections((prev) => ({
                            ...prev,
                            [selectedSection.id]: { ...prev[selectedSection.id], directive: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tag ids</Label>
                      <Input
                        value={selectedSection.tags.join(', ')}
                        onChange={(event) =>
                          setSections((prev) => ({
                            ...prev,
                            [selectedSection.id]: { ...prev[selectedSection.id], tags: parseCommaSeparatedValues(event.target.value) },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>File ids</Label>
                      <Input
                        value={selectedSection.files.map((file) => file.id).join(', ')}
                        onChange={(event) =>
                          setSections((prev) => ({
                            ...prev,
                            [selectedSection.id]: {
                              ...prev[selectedSection.id],
                              files: parseCommaSeparatedValues(event.target.value).map((id) => ({ id, url: '' })),
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Move className="h-4 w-4 text-blue-600" />
                      <h3 className="font-medium text-gray-900">Move Section</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Index</Label>
                        <Input
                          value={sectionMoveState[selectedSection.id]?.index ?? '0'}
                          onChange={(event) =>
                            setSectionMoveState((prev) => ({
                              ...prev,
                              [selectedSection.id]: {
                                ...(prev[selectedSection.id] ?? { parentId: '', index: '0', toRoot: false }),
                                index: event.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Parent section id</Label>
                        <Input
                          value={sectionMoveState[selectedSection.id]?.parentId ?? ''}
                          onChange={(event) =>
                            setSectionMoveState((prev) => ({
                              ...prev,
                              [selectedSection.id]: {
                                ...(prev[selectedSection.id] ?? { parentId: '', index: '0', toRoot: false }),
                                parentId: event.target.value,
                              },
                            }))
                          }
                          disabled={sectionMoveState[selectedSection.id]?.toRoot}
                        />
                      </div>
                      <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={sectionMoveState[selectedSection.id]?.toRoot ?? false}
                          onChange={(event) =>
                            setSectionMoveState((prev) => ({
                              ...prev,
                              [selectedSection.id]: {
                                ...(prev[selectedSection.id] ?? { parentId: '', index: '0', toRoot: false }),
                                toRoot: event.target.checked,
                              },
                            }))
                          }
                        />
                        Move to root
                      </label>
                    </div>
                    <Button variant="outline" onClick={() => void moveSection(selectedSection.id)} disabled={actionLoading === `move-section-${selectedSection.id}`}>
                      {actionLoading === `move-section-${selectedSection.id}` ? 'Đang move...' : 'Move section'}
                    </Button>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => void saveSection(selectedSection)} disabled={actionLoading === `save-section-${selectedSection.id}`}>
                      <Save className="h-4 w-4 mr-2" />
                      {actionLoading === `save-section-${selectedSection.id}` ? 'Đang lưu...' : 'Lưu section'}
                    </Button>
                    <Button variant="outline" onClick={() => void createChildSection(selectedSection.id)} disabled={actionLoading === `create-child-${selectedSection.id}`}>
                      <Layers className="h-4 w-4 mr-2" />
                      Add child section
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedQuestion && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HelpCircle className="h-5 w-5 text-purple-600" />
                    Question Detail
                  </CardTitle>
                  <Button variant="destructive" size="sm" onClick={() => void deleteQuestion(selectedQuestion.id)} disabled={actionLoading === `delete-question-${selectedQuestion.id}`}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Question Type</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                        value={selectedQuestion.type}
                        onChange={(event) =>
                          setQuestions((prev) => ({
                            ...prev,
                            [selectedQuestion.id]: { ...prev[selectedQuestion.id], type: event.target.value },
                          }))
                        }
                      >
                        {QUESTION_TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Points</Label>
                      <Input
                        value={String(selectedQuestion.points)}
                        onChange={(event) =>
                          setQuestions((prev) => ({
                            ...prev,
                            [selectedQuestion.id]: { ...prev[selectedQuestion.id], points: Number(event.target.value) || 0 },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Content</Label>
                      <Textarea
                        rows={4}
                        value={selectedQuestion.content}
                        onChange={(event) =>
                          setQuestions((prev) => ({
                            ...prev,
                            [selectedQuestion.id]: { ...prev[selectedQuestion.id], content: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Explanation</Label>
                      <Textarea
                        rows={4}
                        value={selectedQuestion.explanation}
                        onChange={(event) =>
                          setQuestions((prev) => ({
                            ...prev,
                            [selectedQuestion.id]: { ...prev[selectedQuestion.id], explanation: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tag ids</Label>
                      <Input
                        value={selectedQuestion.tags.join(', ')}
                        onChange={(event) =>
                          setQuestions((prev) => ({
                            ...prev,
                            [selectedQuestion.id]: { ...prev[selectedQuestion.id], tags: parseCommaSeparatedValues(event.target.value) },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>File ids</Label>
                      <Input
                        value={selectedQuestion.files.map((file) => file.id).join(', ')}
                        onChange={(event) =>
                          setQuestions((prev) => ({
                            ...prev,
                            [selectedQuestion.id]: {
                              ...prev[selectedQuestion.id],
                              files: parseCommaSeparatedValues(event.target.value).map((id) => ({ id, url: '' })),
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-purple-600" />
                          <h3 className="font-medium text-gray-900">Choices</h3>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Mode: {getQuestionModeLabel(selectedQuestion.type)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setQuestions((prev) => {
                            const choiceCount = prev[selectedQuestion.id].choices.length;
                            const nextKey = String.fromCharCode(65 + choiceCount);
                            return {
                              ...prev,
                              [selectedQuestion.id]: {
                                ...prev[selectedQuestion.id],
                                choices: [...prev[selectedQuestion.id].choices, { key: nextKey, content: '', isCorrect: false }],
                              },
                            };
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add choice
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {selectedQuestion.choices.map((choice, index) => (
                        <div key={`${choice.id ?? 'new'}-${index}`} className="grid gap-3 rounded-xl border border-gray-200 bg-white p-3 md:grid-cols-[80px_minmax(0,1fr)_120px_auto]">
                          <Input
                            value={choice.key}
                            onChange={(event) =>
                              setQuestions((prev) => ({
                                ...prev,
                                [selectedQuestion.id]: {
                                  ...prev[selectedQuestion.id],
                                  choices: prev[selectedQuestion.id].choices.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, key: event.target.value } : item
                                  ),
                                },
                              }))
                            }
                          />
                          <Input
                            value={choice.content}
                            onChange={(event) =>
                              setQuestions((prev) => ({
                                ...prev,
                                [selectedQuestion.id]: {
                                  ...prev[selectedQuestion.id],
                                  choices: prev[selectedQuestion.id].choices.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, content: event.target.value } : item
                                  ),
                                },
                              }))
                            }
                            placeholder="Choice content"
                          />
                          <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              checked={choice.isCorrect}
                              onChange={(event) =>
                                setQuestions((prev) => ({
                                  ...prev,
                                  [selectedQuestion.id]: {
                                    ...prev[selectedQuestion.id],
                                    choices: prev[selectedQuestion.id].choices.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, isCorrect: event.target.checked } : item
                                    ),
                                  },
                                }))
                              }
                            />
                            Correct
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setQuestions((prev) => ({
                                ...prev,
                                [selectedQuestion.id]: {
                                  ...prev[selectedQuestion.id],
                                  choices: prev[selectedQuestion.id].choices.filter((_, itemIndex) => itemIndex !== index),
                                },
                              }))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Move className="h-4 w-4 text-blue-600" />
                      <h3 className="font-medium text-gray-900">Move Question</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Target section id</Label>
                        <Input
                          value={questionMoveState[selectedQuestion.id]?.sectionId ?? selectedQuestion.sectionId}
                          onChange={(event) =>
                            setQuestionMoveState((prev) => ({
                              ...prev,
                              [selectedQuestion.id]: {
                                ...(prev[selectedQuestion.id] ?? { sectionId: selectedQuestion.sectionId, index: '0' }),
                                sectionId: event.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Index</Label>
                        <Input
                          value={questionMoveState[selectedQuestion.id]?.index ?? '0'}
                          onChange={(event) =>
                            setQuestionMoveState((prev) => ({
                              ...prev,
                              [selectedQuestion.id]: {
                                ...(prev[selectedQuestion.id] ?? { sectionId: selectedQuestion.sectionId, index: '0' }),
                                index: event.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => void moveQuestion(selectedQuestion.id)} disabled={actionLoading === `move-question-${selectedQuestion.id}`}>
                      {actionLoading === `move-question-${selectedQuestion.id}` ? 'Đang move...' : 'Move question'}
                    </Button>
                  </div>

                  <Button onClick={() => void saveQuestion(selectedQuestion)} disabled={actionLoading === `save-question-${selectedQuestion.id}`}>
                    <Save className="h-4 w-4 mr-2" />
                    {actionLoading === `save-question-${selectedQuestion.id}` ? 'Đang lưu...' : 'Lưu question'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tags">
            <AdminTagManager />
          </TabsContent>

          <TabsContent value="uploads">
            <AdminUploadTool />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
