'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ExamManagementService,
  getAccessToken,
  getRefreshToken,
} from '@/lib/api-client';
import { extractApiErrorMessage, extractEntityData, parseCommaSeparatedValues } from '@/lib/api-response';
import { useAuth } from '@/lib/hooks/useAuth';
import { AdminTagManager } from '@/components/admin/AdminTagManager';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from './ui/use-toast';
import {
  Plus, RefreshCw, Save, Trash2, ChevronRight, ChevronDown,
  Send, FilePlus2, ShieldCheck, Upload, X, ImageIcon,
  FileQuestion, Layers, GripVertical, Check, AlertTriangle,
  BookOpen, Clock, Tag, Eye,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type SelectedNode = { type: 'overview' } | { type: 'section'; id: string } | { type: 'question'; id: string };

type ExamDetails = {
  id: string; title: string; description?: string; duration: number;
  status: string; sectionIds: string[]; tags: string[];
  createdAt: string; createdBy: string; updatedAt: string;
};

type SectionDetails = {
  id: string; examId: string; parentId?: string; name?: string;
  directive: string; contentType: string; questionIds: string[];
  tags: string[]; files: Array<{ id: string; url: string }>;
};

type ChoiceDetails = { id?: string; key: string; content: string; isCorrect: boolean };

type QuestionDetails = {
  id: string; sectionId: string; content: string; explanation: string;
  points: number; type: string; tags: string[];
  files: Array<{ id: string; url: string }>; choices: ChoiceDetails[];
};

type SectionMoveState = { parentId: string; index: string; toRoot: boolean };
type QuestionMoveState = { sectionId: string; index: string };

// ─── Constants ───────────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  { value: 'multiple-choice', label: 'Một đáp án đúng' },
  { value: 'multiple-correct-answers', label: 'Nhiều đáp án đúng' },
  { value: 'fill-blank', label: 'Điền vào chỗ trống' },
  { value: 'essay', label: 'Tự luận' },
  { value: 'speaking', label: 'Nói' },
];

const REVIEW_STATUSES = [
  { value: 'InDraft', label: 'Bản nháp' },
  { value: 'Published', label: 'Xuất bản' },
  { value: 'NeedsRevision', label: 'Cần chỉnh sửa' },
];

const STATUS_COLORS: Record<string, string> = {
  InDraft: 'bg-amber-100 text-amber-700',
  Published: 'bg-emerald-100 text-emerald-700',
  NeedsRevision: 'bg-red-100 text-red-700',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildChoiceDrafts = (q: QuestionDetails): ChoiceDetails[] =>
  q.choices.length > 0
    ? q.choices.map((c) => ({ id: c.id, key: c.key, content: c.content ?? '', isCorrect: c.isCorrect }))
    : [{ key: 'A', content: '', isCorrect: false }, { key: 'B', content: '', isCorrect: false }];

const getRootSectionIds = (examId: string, sections: SectionDetails[]): string[] => {
  const ids = new Set(sections.map((s) => s.id));
  return sections.filter((s) => !s.parentId || s.parentId === examId || !ids.has(s.parentId)).map((s) => s.id);
};

const shortId = (id: string) => id.slice(0, 8);

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadFileViaPresigned(file: File): Promise<{ id: string; url: string }> {
  // 1. Xin presigned URL từ backend
  const presignRes = await ExamManagementService.examManagementGatewayControllerGetPresignedUploadUrlV1({
    requestBody: { fileName: file.name, contentType: file.type },
  });
  const { uploadUrl, fileId, publicUrl } = presignRes.data as { uploadUrl: string; fileId: string; publicUrl: string };

  // 2. Upload thẳng lên S3/GCS
  await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });

  return { id: fileId, url: publicUrl };
}

// ─── FileUploadZone ───────────────────────────────────────────────────────────

function FileUploadZone({
  files,
  onAdd,
  onRemove,
  uploading,
  setUploading,
}: {
  files: Array<{ id: string; url: string }>;
  onAdd: (f: { id: string; url: string }) => void;
  onRemove: (id: string) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const result = await uploadFileViaPresigned(file);
        onAdd(result);
      }
    } catch (err) {
      toast({ title: 'Tải ảnh thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); void handleFiles(e.dataTransfer.files); }}
      >
        <input ref={inputRef} type="file" multiple accept="image/*,audio/*" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-primary">
            <RefreshCw className="h-4 w-4 animate-spin" /> Đang tải lên...
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 text-gray-400" />
            <p className="text-sm text-gray-500">Kéo thả hoặc <span className="text-primary font-medium">chọn tệp</span></p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map((f) => (
            <div key={f.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
              {f.url ? (
                <img src={f.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <button
                type="button"
                className="absolute top-1 right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                onClick={() => onRemove(f.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SectionTree ──────────────────────────────────────────────────────────────

function SectionTreeItem({
  sectionId, depth, sections, questions, selectedNode, onSelect,
  onCreateChild, onCreateQuestion, actionLoading,
}: {
  sectionId: string; depth: number;
  sections: Record<string, SectionDetails>; questions: Record<string, QuestionDetails>;
  selectedNode: SelectedNode; onSelect: (node: SelectedNode) => void;
  onCreateChild: (parentId: string) => void; onCreateQuestion: (sectionId: string) => void;
  actionLoading: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const section = sections[sectionId];
  if (!section) return null;

  const sectionList = Object.values(sections);
  const children = sectionList.filter((s) => s.parentId === sectionId).map((s) => s.id);
  const isSelected = selectedNode.type === 'section' && selectedNode.id === sectionId;
  const qCount = section.questionIds.length;

  return (
    <div>
      {/* Section row */}
      <div
        className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors select-none ${
          isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          type="button"
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          className="flex flex-1 items-center gap-2 min-w-0 text-left"
          onClick={() => onSelect({ type: 'section', id: sectionId })}
        >
          <Layers className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
          <span className="truncate text-sm font-medium">
            {section.name || `Section ${shortId(sectionId)}`}
          </span>
          {qCount > 0 && (
            <span className="ml-auto flex-shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 font-medium">
              {qCount}
            </span>
          )}
        </button>

        {/* Quick actions */}
        <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            title="Thêm câu hỏi"
            className="rounded p-0.5 hover:bg-secondary/20 text-secondary"
            onClick={(e) => { e.stopPropagation(); onCreateQuestion(sectionId); }}
            disabled={actionLoading === `create-question-${sectionId}`}
          >
            <FileQuestion className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Thêm section con"
            className="rounded p-0.5 hover:bg-primary/20 text-primary"
            onClick={(e) => { e.stopPropagation(); onCreateChild(sectionId); }}
            disabled={actionLoading === `create-child-${sectionId}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded: questions + children */}
      {expanded && (
        <div>
          {section.questionIds.map((qId) => {
            const q = questions[qId];
            if (!q) return null;
            const isQSelected = selectedNode.type === 'question' && selectedNode.id === qId;
            return (
              <button
                key={qId}
                type="button"
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                  isQSelected ? 'bg-secondary/10 text-secondary' : 'hover:bg-gray-100 text-gray-600'
                }`}
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
                onClick={() => onSelect({ type: 'question', id: qId })}
              >
                <FileQuestion className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                <span className="truncate text-sm">
                  {q.content ? q.content.slice(0, 40) + (q.content.length > 40 ? '…' : '') : `Câu ${shortId(qId)}`}
                </span>
              </button>
            );
          })}

          {children.map((childId) => (
            <SectionTreeItem
              key={childId} sectionId={childId} depth={depth + 1}
              sections={sections} questions={questions} selectedNode={selectedNode}
              onSelect={onSelect} onCreateChild={onCreateChild} onCreateQuestion={onCreateQuestion}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const [uploadingSection, setUploadingSection] = useState(false);
  const [uploadingQuestion, setUploadingQuestion] = useState(false);

  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [examDraft, setExamDraft] = useState({ title: '', description: '', duration: '60', tagsInput: '' });

  const [sections, setSections] = useState<Record<string, SectionDetails>>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [sectionSnapshots, setSectionSnapshots] = useState<Record<string, SectionDetails>>({});
  const [questions, setQuestions] = useState<Record<string, QuestionDetails>>({});
  const [questionSnapshots, setQuestionSnapshots] = useState<Record<string, QuestionDetails>>({});
  const [sectionMoveState, setSectionMoveState] = useState<Record<string, SectionMoveState>>({});
  const [questionMoveState, setQuestionMoveState] = useState<Record<string, QuestionMoveState>>({});
  const [reviewStatus, setReviewStatus] = useState('InDraft');

  const ensureApiSession = (action = 'thực hiện thao tác') => {
    if (getAccessToken() || getRefreshToken()) return true;
    toast({ title: 'Chưa đăng nhập backend', description: `Đăng xuất rồi đăng nhập lại để ${action}.`, variant: 'destructive' });
    return false;
  };

  const loadEditorData = async (id: string) => {
    if (!ensureApiSession('tải dữ liệu')) { setLoading(false); return; }
    setLoading(true);
    try {
      const examRes = await ExamManagementService.examManagementGatewayControllerGetExamDetailsV1(id);
      const examPayload = extractEntityData<ExamDetails>(examRes);
      if (!examPayload) throw new Error('Không nhận được dữ liệu đề thi.');

      const sectionIds = examPayload.sectionIds ?? [];
      const sectionResponses = await Promise.all(sectionIds.map((sid) =>
        ExamManagementService.examManagementGatewayControllerGetSectionDetailsV1(sid)
      ));
      const loadedSections = sectionResponses
        .map((r) => extractEntityData<SectionDetails>(r))
        .filter((s): s is SectionDetails => Boolean(s));

      const questionIds = loadedSections.flatMap((s) => s.questionIds ?? []);
      const questionResponses = await Promise.all(questionIds.map((qid) =>
        ExamManagementService.examManagementGatewayControllerGetQuestionDetailsV1(qid)
      ));
      const loadedQuestions = questionResponses
        .map((r) => extractEntityData<QuestionDetails>(r))
        .filter((q): q is QuestionDetails => Boolean(q))
        .map((q) => ({ ...q, choices: buildChoiceDrafts(q) }));

      const nextSections = Object.fromEntries(loadedSections.map((s) => [s.id, s]));
      const nextQuestions = Object.fromEntries(loadedQuestions.map((q) => [q.id, q]));

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
      setSectionMoveState(Object.fromEntries(loadedSections.map((s, i) => [s.id, {
        parentId: s.parentId ?? '', index: String(i), toRoot: !s.parentId || s.parentId === examPayload.id,
      }])));
      setQuestionMoveState(Object.fromEntries(loadedQuestions.map((q, i) => [q.id, {
        sectionId: q.sectionId, index: String(i),
      }])));
    } catch (error) {
      toast({ title: 'Không tải được dữ liệu', description: extractApiErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!queryExamId) {
      setExam(null); setExamId(null);
      setExamDraft({ title: '', description: '', duration: '60', tagsInput: '' });
      setSections({}); setSectionSnapshots({}); setSectionOrder([]);
      setQuestions({}); setQuestionSnapshots({});
      setSelectedNode({ type: 'overview' });
      return;
    }
    setExamId(queryExamId);
    void loadEditorData(queryExamId);
  }, [queryExamId]);

  const sectionList = useMemo(
    () => sectionOrder.map((id) => sections[id]).filter((s): s is SectionDetails => Boolean(s)),
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

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const saveExam = async () => {
    if (!ensureApiSession('lưu đề thi')) return;
    const durationNum = Number(examDraft.duration);
    const duration = Number.isFinite(durationNum) ? Math.floor(Math.max(0, durationNum)) : 0;

    if (!examDraft.title.trim()) { toast({ title: 'Thiếu tên đề', variant: 'destructive' }); return; }
    if (duration <= 0) { toast({ title: 'Thời lượng không hợp lệ (phải > 0)', variant: 'destructive' }); return; }

    setSavingExam(true);
    try {
      if (!examId) {
        const requestBody = {
          title: String(examDraft.title.trim()),
          description: String(examDraft.description?.trim() ?? ''),
          duration: Math.floor(duration),
        };
        console.log('Creating exam with body:', requestBody);
        const res = await ExamManagementService.examManagementGatewayControllerCreateExamV1(requestBody);
        const created = extractEntityData<{ id?: string }>(res);
        if (!created?.id) throw new Error('API không trả về id đề thi.');
        setExamId(created.id);
        router.replace(`/exam-creation?id=${created.id}`);
        toast({ title: 'Đã tạo đề thi' });
        return;
      }
      const currentTags = exam?.tags ?? [];
      const nextTags = parseCommaSeparatedValues(examDraft.tagsInput);
      await ExamManagementService.examManagementGatewayControllerUpdateExamV1(
        examId,
        {
          title: String(examDraft.title.trim()),
          description: examDraft.description?.trim() || undefined,
          setDescriptionNull: !examDraft.description?.trim(),
          duration: Math.floor(duration),
          addTags: nextTags.filter((t) => !currentTags.includes(t)),
          removeTags: currentTags.filter((t) => !nextTags.includes(t)),
        }
      );
      toast({ title: 'Đã lưu đề thi' });
      await loadEditorData(examId);
    } catch (error) {
      toast({ title: 'Lưu thất bại', description: extractApiErrorMessage(error), variant: 'destructive' });
    } finally {
      setSavingExam(false);
    }
  };

  const createRootSection = async () => {
    if (!ensureApiSession('tạo section') || !examId) {
      if (!examId) toast({ title: 'Cần tạo đề trước', variant: 'destructive' });
      return;
    }
    setActionLoading('create-root-section');
    try {
      const res = await ExamManagementService.examManagementGatewayControllerCreateSectionInExamV1(
        examId, { index: rootSectionIds.length }
      );
      const created = extractEntityData<{ id?: string }>(res);
      if (!created?.id) throw new Error('API không trả về id section.');
      toast({ title: 'Đã tạo section mới' });
      await loadEditorData(examId);
      setSelectedNode({ type: 'section', id: created.id });
    } catch (error) {
      toast({ title: 'Tạo section thất bại', description: extractApiErrorMessage(error), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const createChildSection = async (parentSectionId: string) => {
    if (!ensureApiSession('tạo section con') || !examId) return;
    const childCount = sectionList.filter((s) => s.parentId === parentSectionId).length;
    setActionLoading(`create-child-${parentSectionId}`);
    try {
      const res = await ExamManagementService.examManagementGatewayControllerCreateSectionInSectionV1(
        parentSectionId, { index: childCount }
      );
      const created = extractEntityData<{ id?: string }>(res);
      if (!created?.id) throw new Error('API không trả về id section con.');
      toast({ title: 'Đã tạo section con' });
      await loadEditorData(examId);
      setSelectedNode({ type: 'section', id: created.id });
    } catch (error) {
      toast({ title: 'Tạo section con thất bại', description: extractApiErrorMessage(error), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const saveSection = async (section: SectionDetails) => {
    if (!ensureApiSession('lưu section') || !examId) return;
    const snap = sectionSnapshots[section.id] ?? section;
    setActionLoading(`save-section-${section.id}`);
    try {
      await ExamManagementService.examManagementGatewayControllerUpdateSectionV1(
        section.id,
        {
          name: section.name?.trim() || undefined,
          setNameNull: !section.name?.trim(),
          directive: section.directive,
          contentType: section.contentType,
          addTags: section.tags.filter((t) => !(snap.tags ?? []).includes(t)),
          removeTags: (snap.tags ?? []).filter((t) => !section.tags.includes(t)),
          addFiles: section.files.map((f) => f.id).filter((id) => !(snap.files ?? []).some((f) => f.id === id)),
          removeFiles: (snap.files ?? []).map((f) => f.id).filter((id) => !section.files.some((f) => f.id === id)),
        }
      );
      toast({ title: 'Đã lưu section' });
      await loadEditorData(examId);
    } catch (error) {
      toast({ title: 'Lưu section thất bại', description: extractApiErrorMessage(error), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!ensureApiSession('xóa section') || !examId) return;
    setActionLoading(`delete-section-${sectionId}`);
    try {
      await ExamManagementService.examManagementGatewayControllerDeleteSectionV1(sectionId);
      toast({ title: 'Đã xóa section' });
      setSelectedNode({ type: 'overview' });
      await loadEditorData(examId);
    } catch (error) {
      toast({ title: 'Xóa section thất bại', description: extractApiErrorMessage(error), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const createQuestion = async (sectionId: string) => {
    if (!ensureApiSession('tạo câu hỏi') || !examId) return;
    const section = sections[sectionId];
    setActionLoading(`create-question-${sectionId}`);
    try {
      const res = await ExamManagementService.examManagementGatewayControllerCreateQuestionV1(
        sectionId, { index: section?.questionIds.length ?? 0 }
      );
      const created = extractEntityData<{ id?: string }>(res);
      if (!created?.id) throw new Error('API không trả về id câu hỏi.');
      toast({ title: 'Đã tạo câu hỏi mới' });
      await loadEditorData(examId);
      setSelectedNode({ type: 'question', id: created.id });
    } catch (error) {
      toast({ title: 'Tạo câu hỏi thất bại', description: extractApiErrorMessage(error), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const saveQuestion = async (question: QuestionDetails) => {
    if (!ensureApiSession('lưu câu hỏi') || !examId) return;
    const snap = questionSnapshots[question.id] ?? question;
    const oldChoices = snap.choices ?? [];
    const nextChoices = question.choices ?? [];
    setActionLoading(`save-question-${question.id}`);
    try {
      await ExamManagementService.examManagementGatewayControllerUpdateQuestionV1(
        question.id,
        {
          content: question.content,
          explanation: question.explanation,
          points: question.points,
          type: question.type,
          addChoices: nextChoices.filter((c) => !c.id).map((c) => ({ key: c.key, content: c.content || undefined, isCorrect: c.isCorrect })),
          updateChoices: nextChoices.filter((c) => Boolean(c.id)).map((c) => {
            const prev = oldChoices.find((x) => x.id === c.id);
            return { id: c.id!, key: c.key, content: c.content || undefined, setContentNull: !c.content, isCorrect: c.isCorrect, ...(prev ?? {}) };
          }),
          deleteChoicesIds: oldChoices.filter((c) => c.id && !nextChoices.some((x) => x.id === c.id)).map((c) => c.id as string),
          addTags: question.tags.filter((t) => !(snap.tags ?? []).includes(t)),
          removeTags: (snap.tags ?? []).filter((t) => !question.tags.includes(t)),
          addFiles: question.files.map((f) => f.id).filter((id) => !(snap.files ?? []).some((f) => f.id === id)),
          removeFiles: (snap.files ?? []).map((f) => f.id).filter((id) => !question.files.some((f) => f.id === id)),
        }
      );
      toast({ title: 'Đã lưu câu hỏi' });
      await loadEditorData(examId);
    } catch (error) {
      toast({ title: 'Lưu câu hỏi thất bại', description: extractApiErrorMessage(error), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!ensureApiSession('xóa câu hỏi') || !examId) return;
    setActionLoading(`delete-question-${questionId}`);
    try {
      await ExamManagementService.examManagementGatewayControllerDeleteQuestionV1(questionId);
      toast({ title: 'Đã xóa câu hỏi' });
      setSelectedNode({ type: 'overview' });
      await loadEditorData(examId);
    } catch (error) {
      toast({ title: 'Xóa câu hỏi thất bại', description: extractApiErrorMessage(error), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const reviewExam = async () => {
    if (!ensureApiSession('duyệt đề thi') || !examId) return;
    setActionLoading('review-exam');
    try {
      await ExamManagementService.examManagementGatewayControllerReviewExamV1(
        examId, { status: reviewStatus }
      );
      toast({ title: 'Đã cập nhật trạng thái duyệt' });
      await loadEditorData(examId);
    } catch (error) {
      toast({ title: 'Duyệt thất bại', description: extractApiErrorMessage(error), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-gray-900">
              {examDraft.title || 'Đề thi mới'}
            </span>
            {exam?.status && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[exam.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {REVIEW_STATUSES.find((s) => s.value === exam.status)?.label ?? exam.status}
              </span>
            )}
            {examId && (
              <span className="text-xs text-gray-400 font-mono">#{shortId(examId)}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {examId && (
              <Button variant="ghost" size="sm" onClick={() => void loadEditorData(examId)} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button size="sm" onClick={() => void saveExam()} disabled={savingExam}>
              <Save className="h-4 w-4 mr-1.5" />
              {savingExam ? 'Đang lưu...' : examId ? 'Lưu đề' : 'Tạo đề'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 grid gap-6 xl:grid-cols-[260px_1fr]">
        {/* Left panel: tree */}
        <aside className="space-y-4">
          <Card className="border border-gray-200 shadow-none">
            <CardContent className="p-3 space-y-1">
              {/* Stats row */}
              <div className="flex items-center gap-3 px-1 py-2 mb-2 border-b border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Layers className="h-3.5 w-3.5" />
                  <span>{totalSections} section</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FileQuestion className="h-3.5 w-3.5" />
                  <span>{totalQuestions} câu</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{examDraft.duration} phút</span>
                </div>
              </div>

              {/* Overview */}
              <button
                type="button"
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  selectedNode.type === 'overview' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => setSelectedNode({ type: 'overview' })}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Thông tin đề thi
              </button>

              {/* Section tree */}
              <div className="pt-1">
                {rootSectionIds.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-gray-400 text-center">
                    {examId ? 'Chưa có section nào' : 'Tạo đề trước để thêm section'}
                  </p>
                ) : (
                  rootSectionIds.map((id) => (
                    <SectionTreeItem
                      key={id} sectionId={id} depth={0}
                      sections={sections} questions={questions}
                      selectedNode={selectedNode} onSelect={setSelectedNode}
                      onCreateChild={createChildSection} onCreateQuestion={createQuestion}
                      actionLoading={actionLoading}
                    />
                  ))
                )}
              </div>

              {/* Add root section */}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors mt-2"
                onClick={() => void createRootSection()}
                disabled={!examId || actionLoading === 'create-root-section'}
              >
                <Plus className="h-4 w-4" />
                Thêm section
              </button>
            </CardContent>
          </Card>
        </aside>

        {/* Right panel: editor */}
        <main>
          <Tabs defaultValue="editor" className="space-y-4">
            <TabsList className="bg-white border border-gray-200 rounded-xl p-1 gap-1 h-auto">
              <TabsTrigger value="editor" className="rounded-lg px-4 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none">Nội dung</TabsTrigger>
              <TabsTrigger value="tags" className="rounded-lg px-4 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none">Nhãn</TabsTrigger>
            </TabsList>

            {/* EDITOR TAB */}
            <TabsContent value="editor" className="space-y-4 mt-0">

              {/* Overview panel */}
              {selectedNode.type === 'overview' && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Thông tin đề thi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-sm">Tên đề thi <span className="text-red-500">*</span></Label>
                        <Input
                          value={examDraft.title}
                          onChange={(e) => setExamDraft((p) => ({ ...p, title: e.target.value }))}
                          placeholder="VD: TOEIC Full Test Simulation 1"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-sm">Mô tả</Label>
                        <Textarea
                          rows={3}
                          value={examDraft.description}
                          onChange={(e) => setExamDraft((p) => ({ ...p, description: e.target.value }))}
                          placeholder="Mô tả ngắn về nội dung và mục tiêu của đề thi..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Thời lượng (phút)</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            className="pl-9"
                            value={examDraft.duration}
                            onChange={(e) => setExamDraft((p) => ({ ...p, duration: e.target.value }))}
                            type="number" min="1"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Nhãn (phân cách bằng dấu phẩy)</Label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            className="pl-9"
                            value={examDraft.tagsInput}
                            onChange={(e) => setExamDraft((p) => ({ ...p, tagsInput: e.target.value }))}
                            placeholder="toeic, full-test, listening..."
                          />
                        </div>
                      </div>
                    </div>

                    {(isHeadStaff || isStaff) && examId && (
                      <div className="border-t border-gray-100 pt-4 flex items-end gap-3">
                        <div className="space-y-1.5 flex-1">
                          <Label className="text-sm flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            Trạng thái duyệt
                          </Label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm"
                            value={reviewStatus}
                            onChange={(e) => setReviewStatus(e.target.value)}
                          >
                            {REVIEW_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => void reviewExam()}
                          disabled={actionLoading === 'review-exam'}
                        >
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                          {actionLoading === 'review-exam' ? 'Đang gửi...' : 'Gửi duyệt'}
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={() => void saveExam()} disabled={savingExam}>
                        <Save className="h-4 w-4 mr-1.5" />
                        {savingExam ? 'Đang lưu...' : examId ? 'Lưu thay đổi' : 'Tạo đề thi'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Section panel */}
              {selectedSection && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        Chỉnh sửa section
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline" size="sm"
                          onClick={() => void createQuestion(selectedSection.id)}
                          disabled={actionLoading === `create-question-${selectedSection.id}`}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Thêm câu hỏi
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => void deleteSection(selectedSection.id)}
                          disabled={actionLoading === `delete-section-${selectedSection.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Tên section</Label>
                        <Input
                          value={selectedSection.name ?? ''}
                          onChange={(e) => setSections((p) => ({ ...p, [selectedSection.id]: { ...p[selectedSection.id], name: e.target.value } }))}
                          placeholder="VD: Part 1 – Photographs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Loại nội dung</Label>
                        <Input
                          value={selectedSection.contentType}
                          onChange={(e) => setSections((p) => ({ ...p, [selectedSection.id]: { ...p[selectedSection.id], contentType: e.target.value } }))}
                          placeholder="reading-passage, audio-script..."
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-sm">Hướng dẫn (directive)</Label>
                        <Textarea
                          rows={4}
                          value={selectedSection.directive}
                          onChange={(e) => setSections((p) => ({ ...p, [selectedSection.id]: { ...p[selectedSection.id], directive: e.target.value } }))}
                          placeholder="Nhập hướng dẫn hoặc nội dung bài đọc/bài nghe..."
                        />
                      </div>
                    </div>

                    {/* File upload */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Hình ảnh / Tệp đính kèm</Label>
                      <FileUploadZone
                        files={selectedSection.files}
                        onAdd={(f) => setSections((p) => ({ ...p, [selectedSection.id]: { ...p[selectedSection.id], files: [...p[selectedSection.id].files, f] } }))}
                        onRemove={(id) => setSections((p) => ({ ...p, [selectedSection.id]: { ...p[selectedSection.id], files: p[selectedSection.id].files.filter((f) => f.id !== id) } }))}
                        uploading={uploadingSection}
                        setUploading={setUploadingSection}
                      />
                    </div>

                    {/* Move section */}
                    <details className="rounded-lg border border-gray-200">
                      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        Di chuyển section
                      </summary>
                      <div className="border-t border-gray-200 px-4 py-4 grid gap-3 md:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-sm">Vị trí (index)</Label>
                          <Input
                            value={sectionMoveState[selectedSection.id]?.index ?? '0'}
                            onChange={(e) => setSectionMoveState((p) => ({ ...p, [selectedSection.id]: { ...(p[selectedSection.id] ?? { parentId: '', index: '0', toRoot: false }), index: e.target.value } }))}
                            type="number" min="0"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm">Section cha (bỏ trống nếu là gốc)</Label>
                          <Input
                            value={sectionMoveState[selectedSection.id]?.parentId ?? ''}
                            onChange={(e) => setSectionMoveState((p) => ({ ...p, [selectedSection.id]: { ...(p[selectedSection.id] ?? { parentId: '', index: '0', toRoot: false }), parentId: e.target.value } }))}
                            disabled={sectionMoveState[selectedSection.id]?.toRoot}
                            placeholder="ID section cha"
                          />
                        </div>
                        <div className="flex items-end pb-0.5">
                          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sectionMoveState[selectedSection.id]?.toRoot ?? false}
                              onChange={(e) => setSectionMoveState((p) => ({ ...p, [selectedSection.id]: { ...(p[selectedSection.id] ?? { parentId: '', index: '0', toRoot: false }), toRoot: e.target.checked } }))}
                            />
                            Đặt về gốc
                          </label>
                        </div>
                        <Button
                          variant="outline" size="sm"
                          className="md:col-span-3 w-fit"
                          onClick={async () => {
                            if (!ensureApiSession('di chuyển section') || !examId) return;
                            const ms = sectionMoveState[selectedSection.id];
                            if (!ms) return;
                            const idx = Number(ms.index);
                            if (!Number.isFinite(idx) || idx < 0) { toast({ title: 'Index không hợp lệ', variant: 'destructive' }); return; }
                            setActionLoading(`move-section-${selectedSection.id}`);
                            try {
                              await ExamManagementService.examManagementGatewayControllerMoveSectionV1(
                                selectedSection.id,
                                { index: idx, toRoot: ms.toRoot, parentId: ms.toRoot ? undefined : ms.parentId.trim() || undefined }
                              );
                              toast({ title: 'Đã di chuyển section' });
                              await loadEditorData(examId);
                            } catch (err) {
                              toast({ title: 'Di chuyển thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
                            } finally { setActionLoading(null); }
                          }}
                          disabled={actionLoading === `move-section-${selectedSection.id}`}
                        >
                          {actionLoading === `move-section-${selectedSection.id}` ? 'Đang di chuyển...' : 'Xác nhận di chuyển'}
                        </Button>
                      </div>
                    </details>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => void createChildSection(selectedSection.id)}
                        disabled={actionLoading === `create-child-${selectedSection.id}`}
                      >
                        <Layers className="h-4 w-4 mr-1.5" />
                        Thêm section con
                      </Button>
                      <Button
                        onClick={() => void saveSection(selectedSection)}
                        disabled={actionLoading === `save-section-${selectedSection.id}`}
                      >
                        <Save className="h-4 w-4 mr-1.5" />
                        {actionLoading === `save-section-${selectedSection.id}` ? 'Đang lưu...' : 'Lưu section'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Question panel */}
              {selectedQuestion && (
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileQuestion className="h-4 w-4 text-secondary" />
                        Chỉnh sửa câu hỏi
                      </CardTitle>
                      <Button
                        variant="ghost" size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => void deleteQuestion(selectedQuestion.id)}
                        disabled={actionLoading === `delete-question-${selectedQuestion.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-sm">Loại câu hỏi</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm"
                          value={selectedQuestion.type}
                          onChange={(e) => setQuestions((p) => ({ ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], type: e.target.value } }))}
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Điểm</Label>
                        <Input
                          type="number" min="0"
                          value={String(selectedQuestion.points)}
                          onChange={(e) => setQuestions((p) => ({ ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], points: Number(e.target.value) || 0 } }))}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-3">
                        <Label className="text-sm">Nội dung câu hỏi</Label>
                        <Textarea
                          rows={3}
                          value={selectedQuestion.content}
                          onChange={(e) => setQuestions((p) => ({ ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], content: e.target.value } }))}
                          placeholder="Nhập nội dung câu hỏi..."
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-3">
                        <Label className="text-sm">Giải thích đáp án</Label>
                        <Textarea
                          rows={3}
                          value={selectedQuestion.explanation}
                          onChange={(e) => setQuestions((p) => ({ ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], explanation: e.target.value } }))}
                          placeholder="Giải thích tại sao đáp án đúng..."
                        />
                      </div>
                    </div>

                    {/* File upload */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Hình ảnh đính kèm</Label>
                      <FileUploadZone
                        files={selectedQuestion.files}
                        onAdd={(f) => setQuestions((p) => ({ ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], files: [...p[selectedQuestion.id].files, f] } }))}
                        onRemove={(id) => setQuestions((p) => ({ ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], files: p[selectedQuestion.id].files.filter((f) => f.id !== id) } }))}
                        uploading={uploadingQuestion}
                        setUploading={setUploadingQuestion}
                      />
                    </div>

                    {/* Choices for MCQ */}
                    {['multiple-choice', 'multiple-correct-answers'].includes(selectedQuestion.type) && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">
                            Đáp án lựa chọn
                            <span className="ml-2 text-xs font-normal text-gray-500">
                              ({selectedQuestion.type === 'multiple-choice' ? 'Chỉ một đáp án đúng' : 'Có thể chọn nhiều'})
                            </span>
                          </Label>
                          <Button
                            type="button" variant="outline" size="sm"
                            onClick={() => setQuestions((p) => {
                              const count = p[selectedQuestion.id].choices.length;
                              return { ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], choices: [...p[selectedQuestion.id].choices, { key: String.fromCharCode(65 + count), content: '', isCorrect: false }] } };
                            })}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Thêm lựa chọn
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {selectedQuestion.choices.map((choice, idx) => (
                            <div key={`${choice.id ?? 'new'}-${idx}`} className="flex items-center gap-2">
                              {/* Key badge */}
                              <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold border ${choice.isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                {choice.key}
                              </div>
                              <Input
                                className="flex-1"
                                value={choice.content}
                                onChange={(e) => setQuestions((p) => ({ ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], choices: p[selectedQuestion.id].choices.map((c, i) => i === idx ? { ...c, content: e.target.value } : c) } }))}
                                placeholder={`Nội dung đáp án ${choice.key}`}
                              />
                              {/* Correct toggle */}
                              <button
                                type="button"
                                title={choice.isCorrect ? 'Bỏ đánh dấu đúng' : 'Đánh dấu là đúng'}
                                className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border transition-colors ${choice.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-gray-400 hover:border-emerald-300'}`}
                                onClick={() => setQuestions((p) => ({
                                  ...p,
                                  [selectedQuestion.id]: {
                                    ...p[selectedQuestion.id],
                                    choices: p[selectedQuestion.id].choices.map((c, i) => {
                                      if (selectedQuestion.type === 'multiple-choice') {
                                        return i === idx ? { ...c, isCorrect: !c.isCorrect } : { ...c, isCorrect: false };
                                      }
                                      return i === idx ? { ...c, isCorrect: !c.isCorrect } : c;
                                    }),
                                  },
                                }))}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                onClick={() => setQuestions((p) => ({ ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], choices: p[selectedQuestion.id].choices.filter((_, i) => i !== idx) } }))}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fill blank */}
                    {['fill-blank'].includes(selectedQuestion.type) && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Đáp án chấp nhận</Label>
                          <Button
                            type="button" variant="outline" size="sm"
                            onClick={() => setQuestions((p) => {
                              const count = p[selectedQuestion.id].choices.length;
                              return { ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], choices: [...p[selectedQuestion.id].choices, { key: String(count + 1), content: '', isCorrect: true }] } };
                            })}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Thêm đáp án
                          </Button>
                        </div>
                        {selectedQuestion.choices.map((choice, idx) => (
                          <div key={`${choice.id ?? 'new'}-${idx}`} className="flex items-center gap-2">
                            <Input
                              className="flex-1"
                              value={choice.content}
                              onChange={(e) => setQuestions((p) => ({ ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], choices: p[selectedQuestion.id].choices.map((c, i) => i === idx ? { ...c, content: e.target.value, isCorrect: true } : c) } }))}
                              placeholder="Đáp án chấp nhận được"
                            />
                            <button
                              type="button"
                              className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              onClick={() => setQuestions((p) => ({ ...p, [selectedQuestion.id]: { ...p[selectedQuestion.id], choices: p[selectedQuestion.id].choices.filter((_, i) => i !== idx) } }))}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Essay / Speaking */}
                    {['essay', 'speaking'].includes(selectedQuestion.type) && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Câu hỏi tự luận/nói không có đáp án cố định. Rubric chấm điểm vui lòng ghi ở phần giải thích.</span>
                      </div>
                    )}

                    {/* Move question */}
                    <details className="rounded-lg border border-gray-200">
                      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        Di chuyển câu hỏi
                      </summary>
                      <div className="border-t border-gray-200 px-4 py-4 grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-sm">Section đích (ID)</Label>
                          <Input
                            value={questionMoveState[selectedQuestion.id]?.sectionId ?? selectedQuestion.sectionId}
                            onChange={(e) => setQuestionMoveState((p) => ({ ...p, [selectedQuestion.id]: { ...(p[selectedQuestion.id] ?? { sectionId: selectedQuestion.sectionId, index: '0' }), sectionId: e.target.value } }))}
                            placeholder="ID của section đích"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm">Vị trí (index)</Label>
                          <Input
                            type="number" min="0"
                            value={questionMoveState[selectedQuestion.id]?.index ?? '0'}
                            onChange={(e) => setQuestionMoveState((p) => ({ ...p, [selectedQuestion.id]: { ...(p[selectedQuestion.id] ?? { sectionId: selectedQuestion.sectionId, index: '0' }), index: e.target.value } }))}
                          />
                        </div>
                        <Button
                          variant="outline" size="sm" className="w-fit"
                          onClick={async () => {
                            if (!ensureApiSession('di chuyển câu hỏi') || !examId) return;
                            const ms = questionMoveState[selectedQuestion.id];
                            if (!ms?.sectionId.trim()) { toast({ title: 'Cần nhập section đích', variant: 'destructive' }); return; }
                            const idx = Number(ms.index);
                            if (!Number.isFinite(idx) || idx < 0) { toast({ title: 'Index không hợp lệ', variant: 'destructive' }); return; }
                            setActionLoading(`move-question-${selectedQuestion.id}`);
                            try {
                              await ExamManagementService.examManagementGatewayControllerMoveQuestionV1(selectedQuestion.id, { sectionId: ms.sectionId.trim(), index: idx });
                              toast({ title: 'Đã di chuyển câu hỏi' });
                              await loadEditorData(examId);
                            } catch (err) {
                              toast({ title: 'Di chuyển thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
                            } finally { setActionLoading(null); }
                          }}
                          disabled={actionLoading === `move-question-${selectedQuestion.id}`}
                        >
                          {actionLoading === `move-question-${selectedQuestion.id}` ? 'Đang di chuyển...' : 'Xác nhận di chuyển'}
                        </Button>
                      </div>
                    </details>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => void saveQuestion(selectedQuestion)}
                        disabled={actionLoading === `save-question-${selectedQuestion.id}`}
                      >
                        <Save className="h-4 w-4 mr-1.5" />
                        {actionLoading === `save-question-${selectedQuestion.id}` ? 'Đang lưu...' : 'Lưu câu hỏi'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAGS TAB */}
            <TabsContent value="tags" className="mt-0">
              <AdminTagManager />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}