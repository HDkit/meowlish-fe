'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import { useParams, useRouter } from 'next/navigation';
import { ExamPracticeService } from '@/lib/api-client';
import { Clock, Send, Volume2, ChevronRight, Lightbulb } from 'lucide-react';
import { TextHighlighter } from './TextHighlighter';

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



/** Audio player shown above a question group */
function AudioPlayer({ url }: { url: string }) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <Volume2 className="h-5 w-5 shrink-0 text-slate-500" />
      <audio controls className="h-8 w-full outline-none">
        <source src={url} />
        Trình duyệt không hỗ trợ audio.
      </audio>
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
          ? 'border-primary bg-primary/10 font-bold text-primary ring-1 ring-primary/30'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          isSelected ? 'border-primary bg-white' : 'border-slate-300'
        }`}
      >
        {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </div>
      <input type="radio" className="hidden" checked={isSelected} onChange={onSelect} />
      <div className="flex items-baseline gap-2.5">
        <span className={`font-black ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
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
          ? 'border-primary bg-primary/10 font-medium text-primary'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          isChecked ? 'border-primary bg-primary' : 'border-slate-300 bg-white'
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
        <span className={`font-black ${isChecked ? 'text-primary' : 'text-slate-400'}`}>
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
        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-5 font-medium text-gray-800 shadow-sm outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary"
        placeholder="Nhập câu trả lời của bạn..."
        value={answers[0] ?? ''}
        onChange={(e) => onSingleAnswer(id, e.target.value)}
      />
    );
  }

  if (type === 'Writing') {
    return (
      <textarea
        className="w-full resize-none rounded-xl border border-gray-300 bg-white p-5 font-medium text-gray-800 shadow-sm outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary"
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
  const [highlightEnabled, setHighlightEnabled] = useState(false);

  const parts = useMemo(() => {
    const uniqueParts = new Map<string, { id: string; name: string }>();
    let partCounter = 1;
    for (const q of allQuestions) {
      const root = q.ancestorSections[0];
      if (root && !uniqueParts.has(root.id)) {
        uniqueParts.set(root.id, { id: root.id, name: root.name || `Part ${partCounter++}` });
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

  // ── Resizer (kept for containerRef usage) ─────────────────────────────────

  // ── Navigation ─────────────────────────────────────────────────────────────
  const scrollToQuestion = useCallback((qId: string) => {
    setActiveQuestionId(qId);
    document.getElementById(`q-${qId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // ── Helpers for tracker ────────────────────────────────────────────────────
  const hasAnswer = useCallback(
    (qId: string) => {
      const a = answersMap[qId];
      return Array.isArray(a) && a.length > 0 && a[0] !== '';
    },
    [answersMap],
  );

  const answeredCount = allQuestions.filter((q) => hasAnswer(q.id)).length;

  // Group visibleQuestions by ownerSection — must be before any early return (Rules of Hooks)
  const questionGroups = useMemo(() => {
    const groups: Array<{ sectionId: string; section: SectionData; questions: FlatQuestion[] }> = [];
    for (const q of visibleQuestions) {
      const last = groups[groups.length - 1];
      if (last && last.sectionId === q.ownerSection.id) {
        last.questions.push(q);
      } else {
        groups.push({ sectionId: q.ownerSection.id, section: q.ownerSection, questions: [q] });
      }
    }
    return groups;
  }, [visibleQuestions]);

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-medium text-slate-500">Đang tải dữ liệu bài thi...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-row items-start gap-4 bg-slate-50 p-4 font-sans"
      ref={containerRef}
    >
      {/* ── QUESTIONS PANEL (left, natural height, page scrolls) ────────── */}
      <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header: Part tabs + Highlight toggle */}
        <div className="flex items-center border-b border-slate-100 bg-white px-4 py-2 gap-3 rounded-t-2xl">
          {/* Part tabs */}
          <div className="flex flex-1 overflow-x-auto gap-2 scrollbar-hide">
            {parts.map((part) => (
              <button
                key={part.id}
                onClick={() => {
                  setActivePartId(part.id);
                  const firstQ = allQuestions.find((q) => q.ancestorSections[0]?.id === part.id);
                  if (firstQ) {
                    setActiveQuestionId(firstQ.id);
                    setTimeout(() => {
                      document.getElementById(`q-${firstQ.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }
                }}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activePartId === part.id
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {part.name}
              </button>
            ))}
          </div>
          {/* Highlight toggle */}
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Highlight</span>
            <button
              onClick={() => setHighlightEnabled((v) => !v)}
              className={`relative h-4 w-8 cursor-pointer rounded-full transition-colors duration-200 ${highlightEnabled ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all duration-200 ${highlightEnabled ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Questions area */}
        <div id="questions-container" className="bg-white px-6 py-5">
          <div className="flex flex-col gap-6">
            {questionGroups.map((group) => {
              // Audio URL for this section group
              const groupAudioUrl = group.section.fileUrls?.find((u) =>
                u.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i),
              );
              // Image URLs attached to the section group itself
              const groupImageUrls = group.section.fileUrls?.filter((u) => isImageUrl(u)) ?? [];
              // Directive for this section group
              const hasDirective = group.section.directive?.trim();
              // If the section has images, use a split layout: images left, questions right
              const hasSectionImages = groupImageUrls.length > 0;

              return (
                <div key={group.sectionId} className="flex flex-col gap-3">
                  {/* Group audio */}
                  {groupAudioUrl && <AudioPlayer url={formatMediaUrl(groupAudioUrl)} />}

                  {/* Group directive */}
                  {hasDirective && group.section.type !== 'audio-script' && (
                    <TextHighlighter 
                      text={group.section.directive} 
                      highlightEnabled={highlightEnabled} 
                      className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-relaxed text-slate-700"
                    />
                  )}

                  {hasSectionImages ? (
                    /* ── Split layout: section image(s) LEFT, questions RIGHT ── */
                    <div className="flex gap-0 rounded-xl border border-slate-100 overflow-hidden">
                      {/* Left: images stacked vertically */}
                      <div className="w-[45%] shrink-0 border-r border-slate-100 bg-slate-50 overflow-y-auto">
                        <div className="flex flex-col">
                          {groupImageUrls.map((url) => (
                            <img
                              key={url}
                              src={formatMediaUrl(url)}
                              alt=""
                              className="w-full object-contain"
                            />
                          ))}
                        </div>
                      </div>
                      {/* Right: questions */}
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        {group.questions.map((q) => {
                          const isActive = q.id === activeQuestionId;
                          const qAnswers = answersMap[q.id] ?? [];
                          const qAudioUrls = q.fileUrls?.filter((u) => u.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i)) ?? [];

                          return (
                            <div
                              key={q.id}
                              id={`q-${q.id}`}
                              className={`rounded-xl border transition-all ${
                                isActive
                                  ? 'border-primary/30 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                  : 'border-slate-100 bg-white hover:border-primary/30'
                              }`}
                              onClick={() => setActiveQuestionId(q.id)}
                            >
                              <div className="flex gap-4 p-4">
                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black mt-0.5 ${
                                  isActive ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-600'
                                }`}>{q.globalIndex}</div>
                                <div className="flex-1">
                                  {q.content && (
                                    <TextHighlighter text={q.content} highlightEnabled={highlightEnabled} className="mb-3 text-sm font-medium leading-relaxed text-slate-800" />
                                  )}
                                  {qAudioUrls.map((url) => <audio key={url} controls src={formatMediaUrl(url)} className="w-full mb-3" />)}
                                  <QuestionInput question={q} answers={qAnswers} onSingleAnswer={handleSingleAnswer} onMultiAnswer={handleMultiAnswer} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* ── Stacked layout: questions one by one ── */
                    <div className="flex flex-col gap-4">
                      {group.questions.map((q) => {
                        const isActive = q.id === activeQuestionId;
                        const qAnswers = answersMap[q.id] ?? [];
                        const qImageUrls = q.fileUrls?.filter((u) => isImageUrl(u)) ?? [];
                        const qAudioUrls = q.fileUrls?.filter((u) => u.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i)) ?? [];
                        const hasQImage = qImageUrls.length > 0;

                        return (
                          <div
                            key={q.id}
                            id={`q-${q.id}`}
                            className={`rounded-xl border transition-all ${
                              isActive
                                ? 'border-primary/30 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                : 'border-slate-100 bg-white hover:border-primary/30'
                            }`}
                            onClick={() => setActiveQuestionId(q.id)}
                          >
                            {hasQImage ? (
                              // Per-question split: image left, choices right
                              <div className="flex gap-0">
                                <div className="w-[45%] shrink-0 overflow-hidden rounded-l-xl border-r border-slate-100 bg-slate-50">
                                  <div className="flex flex-col">
                                    {qImageUrls.map((url) => (
                                      <img key={url} src={formatMediaUrl(url)} alt="" className="w-full object-cover" />
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-1 flex-col gap-4 p-5">
                                  <div className="flex items-start gap-3">
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                      isActive
                                      ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-600'
                                    }`}>{q.globalIndex}</div>
                                    {q.content && (
                                      <TextHighlighter text={q.content} highlightEnabled={highlightEnabled} className="text-sm font-medium leading-relaxed text-slate-800" />
                                    )}
                                  </div>
                                  {qAudioUrls.map((url) => <audio key={url} controls src={formatMediaUrl(url)} className="w-full mt-1" />)}
                                  <QuestionInput question={q} answers={qAnswers} onSingleAnswer={handleSingleAnswer} onMultiAnswer={handleMultiAnswer} />
                                </div>
                              </div>
                            ) : (
                              // Normal stacked
                              <div className="flex gap-4 p-5">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black mt-0.5 ${
                                  isActive ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-600'
                                }`}>{q.globalIndex}</div>
                                <div className="flex-1">
                                  {q.content && (
                                    <TextHighlighter text={q.content} highlightEnabled={highlightEnabled} className="mb-3 text-sm font-medium leading-relaxed text-slate-800" />
                                  )}
                                  {qAudioUrls.map((url) => <audio key={url} controls src={formatMediaUrl(url)} className="w-full mb-3" />)}
                                  <QuestionInput question={q} answers={qAnswers} onSingleAnswer={handleSingleAnswer} onMultiAnswer={handleMultiAnswer} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Next Part Button */}
            {parts.findIndex((p) => p.id === activePartId) !== -1 && parts.findIndex((p) => p.id === activePartId) < parts.length - 1 && (
              <div className="mt-4 flex justify-end border-t border-slate-100 pt-5">
                <button
                  onClick={() => {
                    const currentIndex = parts.findIndex((p) => p.id === activePartId);
                    if (currentIndex !== -1 && currentIndex < parts.length - 1) {
                      const nextPart = parts[currentIndex + 1];
                      setActivePartId(nextPart.id);
                      const firstQ = allQuestions.find((q) => q.ancestorSections[0]?.id === nextPart.id);
                      if (firstQ) setActiveQuestionId(firstQ.id);
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90"
                >
                  TIẾP THEO <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TRACKER PANEL (right) ────────────────────────────────────────── */}
      <div className="flex w-72 shrink-0 flex-col gap-4">
        
        {/* Sticky Header: Timer, Submit, Progress */}
        <div className="sticky top-4 z-10 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Timer */}
          <div className="relative overflow-hidden border-b border-slate-100 bg-muted/30 p-6 text-center">
            <Clock className="absolute -right-4 -top-4 h-24 w-24 rotate-12 text-primary-foreground/80" />
            <div className="mb-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/80">
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
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-0 bg-primary font-extrabold uppercase tracking-widest text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg"
            >
              <Send className="h-4 w-4" /> Nộp bài
            </Button>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between bg-slate-50 border-t border-slate-100 px-5 py-3">
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
              {allQuestions.length} câu
            </span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              Đã làm {answeredCount}
            </span>
          </div>
        </div>

        {/* Question grid by Part (Scrolls naturally) */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
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
                            // Switch to the correct part first, then scroll after re-render
                            setActivePartId(part.id);
                            setActiveQuestionId(q.id);
                            setTimeout(() => {
                              const el = document.getElementById(`q-${q.id}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 50);
                          }}
                          className={`relative flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold shadow-sm transition-all ${
                            active
                              ? 'z-10 scale-110 border-0 bg-primary font-black text-white ring-2 ring-primary/30 ring-offset-1 shadow-md'
                              : done
                              ? 'border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
                              : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700'
                          }`}
                        >
                          {q.globalIndex}
                          {done && !active && (
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-slate-50 bg-primary/80" />
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