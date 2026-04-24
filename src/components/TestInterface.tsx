'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import { useParams, useRouter } from 'next/navigation';
import { ExamPracticeService } from '@/lib/api-client';
import { Clock, Send, Lightbulb, Volume2, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Mirrors ChoiceDataDto from API — no isCorrect exposed to test takers */
type ChoiceData = {
  key: string;
  content?: string;
};

/** Mirrors QuestionDataDto from API */
type QuestionData = {
  id: string;
  type: 'MCQ' | 'MCQ_MULTI' | 'Fill' | 'FillAny' | 'Writing';
  content: string;
  order: number;
  fileUrls: string[];
  choices: ChoiceData[];
  // UI-only fields populated during flatten
  sectionId: string;
  globalIndex: number; // 1-based across entire exam
};

/**
 * Mirrors SectionDataDto from API.
 * contentType drives rendering:
 *  - 'SECTION'        → has child sections, no direct questions
 *  - 'QUESTION'       → has direct questions (leaf section)
 *  - 'instructions'   → directive is a short banner, no questions
 *  - 'audio-script'   → directive hidden during exam, shown in review
 *  - 'group'          → short directive label above a question cluster
 *  (The API stores whatever string the admin entered in contentType / section.type)
 */
type SectionData = {
  id: string;
  name?: string;
  directive: string;
  type: string;   // contentType — 'SECTION' | 'QUESTION' | 'instructions' | 'audio-script' | 'group'
  order: number;
  fileUrls: string[];
  questions: QuestionData[];
  sections: SectionData[];
  // UI-only fields populated during flatten
  parentId?: string;
  depth: number;
};

/** Flat index used by components */
type FlatQuestion = QuestionData & {
  /** The deepest section that directly owns this question */
  ownerSection: SectionData;
  /** All ancestor sections from root down to ownerSection */
  ancestorSections: SectionData[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Walk the nested SectionDataDto tree and produce two flat arrays:
 *  - flatSections: every section with parentId + depth set
 *  - flatQuestions: every question with ownerSection + ancestor chain
 * Questions are ordered globally by section order then question order.
 */
function flattenAttemptData(
  rootSections: SectionData[],
  parentId?: string,
  ancestorChain: SectionData[] = [],
  depth = 0,
  globalCounter = { n: 0 },
): { flatSections: SectionData[]; flatQuestions: FlatQuestion[] } {
  const flatSections: SectionData[] = [];
  const flatQuestions: FlatQuestion[] = [];

  const sorted = [...rootSections].sort((a, b) => a.order - b.order);

  for (const sec of sorted) {
    // Annotate section
    sec.parentId = parentId;
    sec.depth = depth;
    flatSections.push(sec);

    const chain = [...ancestorChain, sec];

    // Direct questions in this section
    const sortedQ = [...(sec.questions || [])].sort((a, b) => a.order - b.order);
    for (const q of sortedQ) {
      globalCounter.n += 1;
      flatQuestions.push({
        ...q,
        sectionId: sec.id,
        globalIndex: globalCounter.n,
        ownerSection: sec,
        ancestorSections: chain,
      });
    }

    // Recurse into child sections
    if (sec.sections?.length) {
      const child = flattenAttemptData(sec.sections, sec.id, chain, depth + 1, globalCounter);
      flatSections.push(...child.flatSections);
      flatQuestions.push(...child.flatQuestions);
    }
  }

  return { flatSections, flatQuestions };
}

/**
 * Given a question, return all sections that should be visible in the passage panel.
 * Rules:
 *  - All ancestor sections with a non-empty directive are shown, EXCEPT audio-script.
 *  - Sections with contentType SECTION and no directive are skipped (they're just structural).
 */
function getPassageSections(q: FlatQuestion): SectionData[] {
  return q.ancestorSections.filter(
    (s) => s.type !== 'audio-script' && s.directive?.trim(),
  );
}

function formatMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://${url}`;
}

/**
 * Return the audio URL (if any) attached to any ancestor section of the given question.
 * IELTS convention: audio lives on the Part-level section, not per-question.
 */
function getSectionAudioUrl(q: FlatQuestion): string | null {
  for (const s of q.ancestorSections) {
    const url = s.fileUrls?.find(
      (u) => u.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i),
    );
    if (url) return formatMediaUrl(url);
  }
  return null;
}

function isImageUrl(url: string): boolean {
  return !!url.match(/\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i);
}

/**
 * Format seconds → mm:ss or h:mm:ss
 */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Renders HTML directive content safely */
function DirectiveContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={className}
      // directive is stored as HTML — render it as such
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Audio player shown in passage panel when a section has audio */
function AudioPlayer({ url }: { url: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <Volume2 className="h-5 w-5 shrink-0 text-slate-500" />
      <audio controls className="h-8 w-full outline-none">
        <source src={url} />
        Trình duyệt không hỗ trợ audio.
      </audio>
    </div>
  );
}

/** Passage panel: renders section directives for the current question context */
function PassagePanel({
  activeQuestion,
  highlightEnabled,
  onToggleHighlight,
}: {
  activeQuestion: FlatQuestion | null;
  highlightEnabled: boolean;
  onToggleHighlight: () => void;
}) {
  const audioUrl = activeQuestion ? getSectionAudioUrl(activeQuestion) : null;
  const passageSections = activeQuestion ? getPassageSections(activeQuestion) : [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-5 shadow-sm">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Highlight</span>
          <button
            onClick={onToggleHighlight}
            className={`relative h-4 w-8 cursor-pointer rounded-full transition-colors duration-200 ${highlightEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all duration-200 ${highlightEnabled ? 'right-0.5' : 'left-0.5'}`}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!activeQuestion && (
          <p className="text-sm text-slate-400">Chọn câu hỏi để xem nội dung bài thi.</p>
        )}

        {/* Audio player (Part-level, e.g. IELTS Listening) */}
        {audioUrl && <AudioPlayer url={audioUrl} />}

        {passageSections.map((section) => {
          // Short instructions banner (e.g. "Complete the form below")
          if (section.type === 'instructions' || section.type === 'group') {
            return (
              <div
                key={section.id}
                className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800"
              >
                <DirectiveContent html={section.directive} />
              </div>
            );
          }

          // Full passage / reading text (contentType QUESTION or reading-passage)
          return (
            <div key={section.id} className="mb-10">
              {section.name && (
                <h2 className="mb-4 text-2xl font-extrabold leading-tight text-slate-800">
                  {section.name}
                </h2>
              )}
              <div className="font-serif text-lg leading-7 text-gray-800">
                <DirectiveContent html={section.directive} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Single MCQ radio option */
function MCQOption({
  choice,
  isSelected,
  onSelect,
}: {
  choice: ChoiceData;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-sm ${
        isSelected
          ? 'border-blue-500 bg-blue-50/80 font-bold text-blue-900 ring-1 ring-blue-200'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          isSelected ? 'border-blue-600 bg-white' : 'border-slate-300'
        }`}
      >
        {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
      </div>
      <input type="radio" className="hidden" checked={isSelected} onChange={onSelect} />
      <div className="flex items-baseline gap-2.5">
        <span className={`font-black ${isSelected ? 'text-blue-700' : 'text-slate-400'}`}>
          {choice.key}.
        </span>
        <span className="leading-relaxed text-slate-700">{choice.content}</span>
      </div>
    </label>
  );
}

/** Single MCQ_MULTI checkbox option */
function MCQMultiOption({
  choice,
  isChecked,
  onToggle,
}: {
  choice: ChoiceData;
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
        isChecked
          ? 'border-blue-500 bg-blue-100 font-medium text-blue-900'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          isChecked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
        }`}
      >
        {isChecked && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <input type="checkbox" className="hidden" checked={isChecked} onChange={(e) => onToggle(e.target.checked)} />
      <div className="flex items-baseline gap-2.5">
        <span className={`font-black ${isChecked ? 'text-blue-700' : 'text-slate-400'}`}>
          {choice.key}.
        </span>
        <span className="leading-relaxed text-slate-700">{choice.content}</span>
      </div>
    </label>
  );
}

/** Renders the correct input widget for a given question type */
function QuestionInput({
  question,
  answers,
  onSingleAnswer,
  onMultiAnswer,
}: {
  question: FlatQuestion;
  answers: string[];
  onSingleAnswer: (qId: string, value: string) => void;
  onMultiAnswer: (qId: string, key: string, checked: boolean) => void;
}) {
  const { id, type, choices } = question;

  if (type === 'MCQ') {
    return (
      <div className="flex flex-col gap-3">
        {choices.map((c) => (
          <MCQOption
            key={c.key}
            choice={c}
            isSelected={answers[0] === c.key}
            onSelect={() => onSingleAnswer(id, c.key)}
          />
        ))}
      </div>
    );
  }

  if (type === 'MCQ_MULTI') {
    return (
      <div className="flex flex-col gap-3">
        {choices.map((c) => (
          <MCQMultiOption
            key={c.key}
            choice={c}
            isChecked={answers.includes(c.key)}
            onToggle={(checked) => onMultiAnswer(id, c.key, checked)}
          />
        ))}
      </div>
    );
  }

  if (type === 'Fill' || type === 'FillAny') {
    return (
      <input
        type="text"
        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-5 font-medium text-gray-800 shadow-sm outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        placeholder="Nhập câu trả lời của bạn..."
        value={answers[0] ?? ''}
        onChange={(e) => onSingleAnswer(id, e.target.value)}
      />
    );
  }

  if (type === 'Writing') {
    return (
      <textarea
        className="w-full resize-none rounded-xl border border-gray-300 bg-white p-5 font-medium text-gray-800 shadow-sm outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        placeholder="Viết câu trả lời của bạn ở đây..."
        rows={8}
        value={answers[0] ?? ''}
        onChange={(e) => onSingleAnswer(id, e.target.value)}
      />
    );
  }

  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TestInterface() {
  const params = useParams();
  const attemptId =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : '';
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [serverAttemptData, setServerAttemptData] = useState<any>(null);

  /** All questions in global display order (flat) */
  const [allQuestions, setAllQuestions] = useState<FlatQuestion[]>([]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [activePartId, setActivePartId] = useState<string | null>(null);

  const parts = useMemo(() => {
    const uniqueParts = new Map<string, { id: string; name: string }>();
    let partCounter = 1;
    for (const q of allQuestions) {
      const root = q.ancestorSections[0];
      if (root && !uniqueParts.has(root.id)) {
        uniqueParts.set(root.id, { id: root.id, name: root.name || `Phần ${partCounter++}` });
      }
    }
    return Array.from(uniqueParts.values());
  }, [allQuestions]);

  /**
   * answersMap[questionId] = string[]
   * Matches AttemptResponse.answers from the API exactly.
   * MCQ        → ["B"]
   * MCQ_MULTI  → ["A", "C"]
   * Fill/FillAny/Writing → ["user typed text"]
   */
  const [answersMap, setAnswersMap] = useState<Record<string, string[]>>({});

  // Layout
  const [leftWidth, setLeftWidth] = useState(45);
  const [isResizing, setIsResizing] = useState(false);
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);
  /** Per-answer debounce: key = `${questionId}:${answerValue}` */
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeQuestion = allQuestions.find((q) => q.id === activeQuestionId) ?? null;

  /** Questions visible in the main panel = all questions belonging to activePartId */
  const visibleQuestions = activePartId
    ? allQuestions.filter((q) => q.ancestorSections[0]?.id === activePartId)
    : [];

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!attemptId) return;
    (async () => {
      try {
        setLoading(true);
        const response =
          await ExamPracticeService.examPracticeGatewayControllerGetAttemptSavedDataV1(attemptId);
        const data = response.data as any; // AttemptDataDto
        if (!data) return;
        setServerAttemptData(data);

        // Flatten nested SectionDataDto tree
        const { flatQuestions } = flattenAttemptData(data.sections ?? []);
        setAllQuestions(flatQuestions);
        if (flatQuestions.length > 0) {
          setActiveQuestionId(flatQuestions[0].id);
          setActivePartId(flatQuestions[0].ancestorSections[0]?.id || null);
        }

        // Timer — durationLimit is in SECONDS per AttemptDataDto
        if (data.durationLimit > 0) {
          const elapsedSec = (Date.now() - new Date(data.startedAt).getTime()) / 1000;
          setTimeLeft(Math.max(0, Math.floor(data.durationLimit - elapsedSec)));
        } else {
          setTimeLeft(Infinity); // Unlimited
        }

        // Restore saved answers — answers is string[] per ResponseDataDto
        const map: Record<string, string[]> = {};
        (data.responses ?? []).forEach((r: any) => {
          map[r.questionId] = r.answers ?? [];
        });
        setAnswersMap(map);
      } catch (err) {
        console.error('Failed to load attempt:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!serverAttemptData || serverAttemptData.durationLimit <= 0) return;
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerIntervalRef.current!);
          if (!isSubmittingRef.current) performSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerIntervalRef.current!);
  }, [serverAttemptData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ─────────────────────────────────────────────────────────────────
  const performSubmit = useCallback(
    async (isAuto: boolean) => {
      if (isSubmittingRef.current || !attemptId) return;
      isSubmittingRef.current = true;
      clearInterval(timerIntervalRef.current!);
      Object.values(debounceTimersRef.current).forEach(clearTimeout);
      debounceTimersRef.current = {};
      try {
        await ExamPracticeService.examPracticeGatewayControllerEndAttemptV1(attemptId);
        router.push(`/results/${attemptId}`);
      } catch (err) {
        console.error('Submit failed:', err);
        if (isAuto) router.push(`/results/${attemptId}`);
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [attemptId, router],
  );

  // ── Answer API calls ───────────────────────────────────────────────────────
  /**
   * Debounced wrapper for POST /answers/{questionId} or DELETE /answers/{questionId}.
   * Key includes the answer value so concurrent add/remove of different values
   * don't cancel each other's timers.
   */
  const debouncedApi = useCallback(
    (questionId: string, answer: string, del: boolean) => {
      const key = `${questionId}:${answer}:${del ? 'd' : 'a'}`;
      clearTimeout(debounceTimersRef.current[key]);
      debounceTimersRef.current[key] = setTimeout(async () => {
        if (!attemptId || isSubmittingRef.current) return;
        try {
          if (del) {
            await ExamPracticeService.examPracticeGatewayControllerRemoveAnswerV1(
              attemptId, questionId, { answer },
            );
          } else {
            await ExamPracticeService.examPracticeGatewayControllerAnswerV1(
              attemptId, questionId, { answer },
            );
          }
        } catch (err: any) {
          if (err?.status === 403 || err?.body?.statusCode === 403) return;
          console.error('Answer API error:', err);
        }
      }, 800);
    },
    [attemptId],
  );

  /**
   * For MCQ, Fill, FillAny, Writing — replaces the entire answer array with a single value.
   * Sends POST { answer: value } once. If old value exists, sends DELETE first.
   */
  const handleSingleAnswer = useCallback(
    (questionId: string, value: string) => {
      setAnswersMap((prev) => {
        const old = prev[questionId]?.[0];
        // Debounce DELETE of old value if it changed
        if (old !== undefined && old !== value && old !== '') {
          debouncedApi(questionId, old, true);
        }
        // Debounce POST of new value
        if (value !== '') debouncedApi(questionId, value, false);
        return { ...prev, [questionId]: value !== '' ? [value] : [] };
      });
    },
    [debouncedApi],
  );

  /**
   * For MCQ_MULTI — toggles a single key in the answers array.
   * Sends POST { answer: key } or DELETE { answer: key }.
   */
  const handleMultiAnswer = useCallback(
    (questionId: string, key: string, checked: boolean) => {
      setAnswersMap((prev) => {
        const current = prev[questionId] ?? [];
        const next = checked ? [...current, key] : current.filter((k) => k !== key);
        debouncedApi(questionId, key, !checked);
        return { ...prev, [questionId]: next };
      });
    },
    [debouncedApi],
  );

  // ── Navigation ─────────────────────────────────────────────────────────────
  const scrollToQuestion = useCallback((qId: string) => {
    setActiveQuestionId(qId);
    document.getElementById(`q-${qId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // ── Resizer ────────────────────────────────────────────────────────────────
  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const trackerW = 320;
      const usable = containerRef.current.clientWidth - trackerW;
      const pct = (e.clientX / usable) * 100;
      if (pct > 20 && pct < 75) setLeftWidth(pct);
    },
    [isResizing],
  );
  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // ── Helpers for tracker ────────────────────────────────────────────────────
  const hasAnswer = useCallback(
    (qId: string) => {
      const a = answersMap[qId];
      return Array.isArray(a) && a.length > 0 && a[0] !== '';
    },
    [answersMap],
  );

  const answeredCount = allQuestions.filter((q) => hasAnswer(q.id)).length;

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="font-medium text-slate-500">Đang tải dữ liệu bài thi...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="inset-0 flex flex-row gap-4 overflow-hidden bg-slate-50 p-4 font-sans"
      ref={containerRef}
    >
      {/* ── PASSAGE PANEL (left) ─────────────────────────────────────────── */}
      <div style={{ width: `${leftWidth}%` }} className="h-full shrink-0">
        <PassagePanel
          activeQuestion={activeQuestion}
          highlightEnabled={highlightEnabled}
          onToggleHighlight={() => setHighlightEnabled((v) => !v)}
        />
      </div>

      {/* ── RESIZER ──────────────────────────────────────────────────────── */}
      <div
        className="z-30 flex w-1 shrink-0 cursor-col-resize items-center justify-center rounded opacity-50 transition-colors hover:bg-blue-400"
        onMouseDown={startResizing}
      >
        <div className="h-8 w-1 rounded-full bg-gray-400" />
      </div>

      {/* ── QUESTIONS PANEL (center) ──────────────────────────────────────── */}
      <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header (Study4-style Tab Bar) */}
        <div className="sticky top-0 z-10 flex flex-col border-b border-slate-100 bg-white shadow-sm shrink-0">
          <div className="flex overflow-x-auto px-4 py-3 gap-2 scrollbar-hide">
            {parts.map((part) => (
              <button
                key={part.id}
                onClick={() => {
                  setActivePartId(part.id);
                  const firstQ = allQuestions.find((q) => q.ancestorSections[0]?.id === part.id);
                  if (firstQ) {
                    setActiveQuestionId(firstQ.id);
                    document.getElementById('questions-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activePartId === part.id
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {part.name}
              </button>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div id="questions-container" className="flex-1 overflow-y-auto bg-white p-6 scroll-smooth">
          <div className="space-y-6">
            {visibleQuestions.map((q) => {
              const isActive = q.id === activeQuestionId;
              const qAnswers = answersMap[q.id] ?? [];

              return (
                <div
                  key={q.id}
                  id={`q-${q.id}`}
                  className={`flex gap-5 rounded-xl border p-6 transition-all hover:border-blue-100 hover:bg-slate-50/50 ${
                    isActive
                      ? 'border-blue-200 bg-blue-50/30 shadow-sm ring-1 ring-blue-500/20'
                      : 'border-transparent'
                  }`}
                  onClick={() => setActiveQuestionId(q.id)}
                >
                  {/* Question number (global index) */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-sm ${
                      isActive
                        ? 'border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {q.globalIndex}
                  </div>

                  <div className="flex-1">
                    {/* Question content is also HTML */}
                    <div
                      className="mb-4 text-[1.05rem] font-semibold leading-relaxed text-slate-800"
                      dangerouslySetInnerHTML={{ __html: q.content }}
                    />

                    {/* Files attached directly to the question (e.g. image for that question) */}
                    {q.fileUrls?.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {q.fileUrls.map((url) =>
                          isImageUrl(url) ? (
                            <img
                              key={url}
                              src={formatMediaUrl(url)}
                              alt=""
                              className="max-h-48 rounded-lg border border-slate-200 object-contain"
                            />
                          ) : url.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i) ? (
                            <audio key={url} controls src={formatMediaUrl(url)} className="w-full max-w-sm mt-2" />
                          ) : null,
                        )}
                      </div>
                    )}

                    {/* Answer input */}
                    <QuestionInput
                      question={q}
                      answers={qAnswers}
                      onSingleAnswer={handleSingleAnswer}
                      onMultiAnswer={handleMultiAnswer}
                    />
                  </div>
                </div>
              );
            })}

            {/* Next Part Button */}
            {parts.findIndex((p) => p.id === activePartId) !== -1 && parts.findIndex((p) => p.id === activePartId) < parts.length - 1 && (
              <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
                <button
                  onClick={() => {
                    const currentIndex = parts.findIndex((p) => p.id === activePartId);
                    if (currentIndex !== -1 && currentIndex < parts.length - 1) {
                      const nextPart = parts[currentIndex + 1];
                      setActivePartId(nextPart.id);
                      const firstQ = allQuestions.find((q) => q.ancestorSections[0]?.id === nextPart.id);
                      if (firstQ) setActiveQuestionId(firstQ.id);
                      document.getElementById('questions-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-blue-600 border border-blue-200 shadow-sm transition-all hover:bg-blue-50"
                >
                  TIẾP THEO <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TRACKER PANEL (right) ─────────────────────────────────────────── */}
      <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Timer */}
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-blue-50/50 to-white p-6 text-center">
          <Clock className="absolute -right-4 -top-4 h-24 w-24 rotate-12 text-blue-100" />
          <div className="mb-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600/80">
            <Clock className="h-3.5 w-3.5" />
            Thời gian còn lại
          </div>
          <div
            className={`mt-2 font-mono text-5xl font-black tabular-nums tracking-wider drop-shadow-sm ${
              timeLeft < 300 && timeLeft !== Infinity ? 'animate-pulse text-rose-600' : 'text-slate-800'
            }`}
          >
            {timeLeft === Infinity ? '∞' : formatTime(timeLeft)}
          </div>
        </div>

        {/* Submit */}
        <div className="bg-white p-5">
          <Button
            onClick={() => performSubmit(false)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-r from-blue-600 to-indigo-600 font-extrabold uppercase tracking-widest text-white shadow-md transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg"
          >
            <Send className="h-4 w-4" /> Nộp bài
          </Button>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 pb-3 pt-1">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            {allQuestions.length} câu
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600">
            Đã làm {answeredCount}
          </span>
        </div>

        {/* Question grid by Part */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 px-5 py-5">
          <div className="flex flex-col gap-6">
            {parts.map((part) => {
              const partQuestions = allQuestions.filter(q => q.ancestorSections[0]?.id === part.id);
              if (partQuestions.length === 0) return null;
              
              return (
                <div key={part.id}>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                    {part.name}
                  </h3>
                  <div className="grid grid-cols-5 gap-2.5">
                    {partQuestions.map((q) => {
                      const done = hasAnswer(q.id);
                      const active = q.id === activeQuestionId;
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setActivePartId(part.id);
                            scrollToQuestion(q.id);
                          }}
                          className={`relative flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold shadow-sm transition-all ${
                            active
                              ? 'z-10 scale-110 border-0 bg-gradient-to-br from-blue-500 to-indigo-600 font-black text-white ring-2 ring-blue-300 ring-offset-1 shadow-md'
                              : done
                              ? 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700'
                          }`}
                        >
                          {q.globalIndex}
                          {done && !active && (
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-slate-50 bg-blue-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}