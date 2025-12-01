import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Question, Section, Attempt } from '../types/client';
import { useAppSelector, useAppDispatch } from './store/main/hook';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { addAttempt, updateAttempt } from './store/attemptSlice';

export function TestInterface() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // --- REDUX SELECTORS ---
  const allExams = useAppSelector((state) => state.exams.list);
  const allSections = useAppSelector((state) => state.sections.list);
  const allQuestions = useAppSelector((state) => state.questions.list);
  const allAttempts = useAppSelector((state) => state.attempts.list);
  const currentUser = useAppSelector((state) => state.currUser.current);

  // --- LOCAL STATE ---
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);
  
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [currentSectionAncestors, setCurrentSectionAncestors] = useState<Section[]>([]);

  // State Resizer
  const [leftWidth, setLeftWidth] = useState(45);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- REFS ---
  const currentAttemptRef = useRef<Attempt | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);
  const lastSavedTimeRef = useRef<number>(0);

  useEffect(() => {
    currentAttemptRef.current = currentAttempt;
  }, [currentAttempt]);

  // --- 1. DATA LOGIC ---
  useEffect(() => {
    const collectSections = (rootId: string, all: Section[]): Section[] => {
      const result: Section[] = [];
      const walk = (pid: string) => {
        const children = all.filter((s) => s.parentId === pid);
        for (const c of children) {
          result.push(c);
          walk(c.id);
        }
      };
      walk(rootId);
      return result;
    };

    if (!id) return;
    const nestedSections = collectSections(id, allSections);
    setSections(nestedSections);
    const secIds = new Set(nestedSections.map((s) => s.id));
    setQuestions(allQuestions.filter((q) => secIds.has(q.sectionId)));
  }, [id, allSections, allQuestions]);

  const buildOrderedQuestions = useCallback(() => {
    const map: Record<string, Section[]> = {};
    sections.forEach((s) => {
      if (!map[s.parentId]) map[s.parentId] = [];
      map[s.parentId].push(s);
    });

    const orderSections = (pid: string): string[] => {
      let res: string[] = [];
      for (const s of map[pid] || []) {
        res.push(s.id);
        res = res.concat(orderSections(s.id));
      }
      return res;
    };

    const orderedSectionIds = orderSections(id!);
    const finalQuestions: Question[] = [];
    for (const sid of orderedSectionIds) {
      finalQuestions.push(...questions.filter((q) => q.sectionId === sid));
    }
    return finalQuestions;
  }, [sections, questions, id]);

  useEffect(() => {
    setOrderedQuestions(buildOrderedQuestions());
  }, [buildOrderedQuestions]);

  // --- 2. INITIALIZATION ---
  useEffect(() => {
    if (!id || !currentUser) return;
    if (currentAttempt) return; 

    isSubmittingRef.current = false;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const isRetake = location.state?.retake;
    const { timer } = location.state || {};
    
    let attemptToLoad: Attempt | undefined;

    if (!isRetake) {
      attemptToLoad = allAttempts.find(
        (a) => a.examId === id && a.userId === currentUser.id && typeof a.score === 'undefined'
      );
    }

    if (attemptToLoad) {
      setCurrentAttempt(attemptToLoad);
      setTimeLeft(attemptToLoad.timeLeft);
      lastSavedTimeRef.current = attemptToLoad.timeLeft;
    } else {
      const exam = allExams.find((e) => e.id === id);
      if (!exam) return;

      const durationSec = (timer || exam.duration) * 60;
      const newAttempt: Attempt = {
        id: 'attempt_' + Date.now(),
        userId: currentUser.id,
        examId: id,
        startTime: Date.now(),
        timeLeft: durationSec,
        isPaused: false,
        score: undefined, 
        choices: [],
      };

      lastSavedTimeRef.current = durationSec;
      dispatch(addAttempt(newAttempt));
      setCurrentAttempt(newAttempt);
      setTimeLeft(durationSec);

      if (orderedQuestions.length > 0) {
        setCurrentQuestionId(orderedQuestions[0].id);
      }
    }
  }, [id, currentUser, allAttempts, allExams, location.state, dispatch, currentAttempt, orderedQuestions]);

  // --- 3. TIMER ---
  useEffect(() => {
    if (!currentAttempt && !currentAttemptRef.current) return;
    if (isSubmittingRef.current) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (!isSubmittingRef.current) handleAutoSubmit();
          return 0;
        }
        const newTime = prevTime - 1;
        if (newTime % 5 === 0) {
          const latestState = currentAttemptRef.current;
          if (latestState && typeof latestState.score === 'undefined') {
            dispatch(updateAttempt({ ...latestState, timeLeft: newTime }));
            lastSavedTimeRef.current = newTime;
          }
        }
        return newTime;
      });
    }, 1000);

    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [dispatch, currentAttempt?.id]);

  // --- 4. HANDLERS ---
  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setCurrentAttempt((prev) => {
      if (!prev) return null;
      const updatedChoices = [...prev.choices];
      const idx = updatedChoices.findIndex((c) => c.questionId === questionId);
      if (idx >= 0) updatedChoices[idx] = { ...updatedChoices[idx], answerIdx: answer };
      else updatedChoices.push({ questionId, answerIdx: answer });

      const newAttempt = { ...prev, choices: updatedChoices };
      dispatch(updateAttempt(newAttempt));
      return newAttempt;
    });
  }, [dispatch]);

  const getCurrentAnswer = useCallback((qId: string) => {
    const attempt = currentAttempt || currentAttemptRef.current;
    return attempt?.choices.find((c) => c.questionId === qId)?.answerIdx || '';
  }, [currentAttempt]);

  const performSubmit = (isAuto: boolean) => {
    if (isSubmittingRef.current) return;
    const finalAttempt = currentAttemptRef.current;
    if (!finalAttempt) return;

    isSubmittingRef.current = true;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    let correctCount = 0;
    let totalPoints = 0;
    orderedQuestions.forEach(q => {
        totalPoints += q.points;
        const userChoice = finalAttempt.choices.find(c => c.questionId === q.id);
        const userAnswer = userChoice?.answerIdx || '';
        if (q.correctAnswer && q.correctAnswer.length > 0) {
            if (q.type === 'multiple-correct-answers') {
                const userArr = userAnswer.split(',').filter(Boolean).sort();
                const correctArr = [...q.correctAnswer].sort();
                if (JSON.stringify(userArr) === JSON.stringify(correctArr)) correctCount += q.points;
            } else {
                if (q.correctAnswer.includes(userAnswer)) correctCount += q.points;
            }
        }
    });

    const finalScore = totalPoints > 0 ? (correctCount / totalPoints) * 100 : 0;
    const completedAttempt: Attempt = {
      ...finalAttempt,
      timeLeft: isAuto ? 0 : timeLeft,
      score: finalScore,
    };
    dispatch(updateAttempt(completedAttempt));
    navigate(`/results/${completedAttempt.id}`);
  };

  const handleSubmit = () => performSubmit(false);
  const handleAutoSubmit = () => performSubmit(true);

  const scrollToQuestion = (qId: string) => {
    setCurrentQuestionId(qId);
    const element = document.getElementById(`question-${qId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getAncestors = useCallback((pId: string): Section[] => {
    const ancestors: Section[] = [];
    let current = sections.find((s) => s.id === pId);
    while (current) {
      ancestors.unshift(current);
      current = sections.find((s) => s.id === current?.parentId);
    }
    return ancestors;
  }, [sections]);

  useEffect(() => {
    if (!currentQuestionId && orderedQuestions.length > 0) {
       if(!currentQuestionId) setCurrentQuestionId(orderedQuestions[0].id);
    }
    if (currentQuestionId) {
        const q = questions.find((item) => item.id === currentQuestionId);
        if (q) setCurrentSectionAncestors(getAncestors(q.sectionId));
    }
  }, [currentQuestionId, questions, getAncestors, orderedQuestions]);

  // --- RESIZER LOGIC ---
  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
        const trackerWidth = 340; 
        const containerWidth = containerRef.current.clientWidth - trackerWidth;
        const newLeftWidth = (e.clientX / containerWidth) * 100;
        if (newLeftWidth > 20 && newLeftWidth < 80) setLeftWidth(newLeftWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // --- RENDER ---
  return (
    <div className='fixed inset-0 flex flex-row bg-gray-100 font-sans overflow-hidden p-3 gap-3' ref={containerRef}>
      
      {/* --- KHỐI 1: PASSAGE (TRÁI) --- */}
      <div 
        style={{ width: `${leftWidth}%` }} 
        className='h-full flex flex-col bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 shrink-0'
      >
         {/* Passage Header */}
         <div className='h-12 border-b bg-gray-50 flex items-center justify-between px-4 shrink-0'>
            {/* Hiển thị tiêu đề Section hiện tại */}
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Passage 1
            </span>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Highlight mode</span>
                <div className="w-8 h-4 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                </div>
            </div>
         </div>
         
         {/* Passage Content */}
         <div className='flex-1 overflow-y-auto p-6 scroll-smooth'>
            {currentSectionAncestors.map((section) => {
                if (!section.direction) return null;
                
                // Tách dòng đầu tiên làm tiêu đề lớn (nếu có)
                const lines = section.direction.split('\n');
                const title = lines[0];
                const content = lines.slice(1).join('\n');

                return (
                    <div key={section.id} className="mb-8">
                        {/* Title - Hiển thị to, đậm giống ảnh mẫu */}
                        <h2 className='text-2xl font-bold text-gray-900 mb-4 leading-tight'>
                            {title}
                        </h2>
                        {/* Nội dung bài đọc */}
                        <div className='text-gray-800 leading-7 text-justify whitespace-pre-wrap font-serif text-lg'>
                            {content}
                        </div>
                    </div>
                );
            })}
         </div>
      </div>

      {/* RESIZER HANDLE */}
      <div
        className='w-1 hover:bg-blue-400 cursor-col-resize z-30 transition-colors flex items-center justify-center shrink-0 rounded opacity-50'
        onMouseDown={startResizing}
      >
        <div className="h-8 w-1 bg-gray-400 rounded-full"></div>
      </div>

      {/* --- KHỐI 2: QUESTIONS (GIỮA) --- */}
      <div className='flex-1 h-full flex flex-col bg-white rounded-xl shadow-md overflow-hidden border border-gray-200'>
         {/* Questions Header */}
         <div className='h-12 border-b bg-gray-50 px-4 flex items-center shrink-0 justify-between'>
             <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Questions</h2>
         </div>

         {/* Questions Content */}
         <div className='flex-1 overflow-y-auto p-6 bg-white'>
            {currentSectionAncestors.length > 0 && currentSectionAncestors[0].parentId !== 'root' && (
                 <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100 mb-6">
                    <p className="font-semibold text-blue-800 italic text-sm mb-1">Instructions:</p>
                    <p className="text-sm text-blue-900">Read the passage and answer the questions below.</p>
                 </div>
            )}

            <div className='space-y-6'>
                {orderedQuestions.map((q, index) => {
                    const realIndex = index + 1;
                    return (
                        <div 
                            key={q.id} 
                            id={`question-${q.id}`} 
                            className={`flex gap-4 p-5 rounded-lg border transition-all ${
                                q.id === currentQuestionId 
                                ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-100 shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setCurrentQuestionId(q.id)}
                        >
                            {/* Số thứ tự câu hỏi */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-1 shadow-sm ${
                                q.id === currentQuestionId ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {realIndex}
                            </div>

                            <div className="flex-1 pt-1">
                                {/* Nội dung câu hỏi */}
                                <p className="text-gray-900 font-medium mb-3 text-base">{q.content}</p>
                                
                                <div className="mt-2">
                                    {/* --- 1. MULTIPLE CHOICE (Dạng A, B, C, D) --- */}
                                    {q.type === 'multiple-choice' && q.options && (
                                        <div className="flex flex-col gap-3">
                                            {q.options.map((op, idx) => {
                                                const charLabel = String.fromCharCode(65 + idx); // A, B, C...
                                                const isSelected = getCurrentAnswer(q.id) === op;
                                                return (
                                                    <label 
                                                        key={idx} 
                                                        className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${
                                                            isSelected 
                                                                ? 'bg-blue-100 border-blue-500 text-blue-900 font-medium' 
                                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                                            isSelected ? 'border-blue-600 bg-white' : 'border-gray-400'
                                                        }`}>
                                                            {isSelected && <div className="w-3 h-3 bg-blue-600 rounded-full"></div>}
                                                        </div>
                                                        <input 
                                                            type="radio" 
                                                            name={q.id} 
                                                            value={op}
                                                            checked={isSelected}
                                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                            className="hidden" // Ẩn radio mặc định
                                                        />
                                                        <span className="font-bold text-gray-500 w-4">{charLabel}.</span>
                                                        <span>{op}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* --- 2. CHECKBOXES (Multiple Correct) --- */}
                                    {q.type === 'multiple-correct-answers' && q.options && (
                                        <div className="flex flex-col gap-3">
                                            {q.options.map((op, idx) => {
                                                const currentAnswers = getCurrentAnswer(q.id).split(',').filter(Boolean);
                                                const isChecked = currentAnswers.includes(op);
                                                const charLabel = String.fromCharCode(65 + idx);
                                                return (
                                                    <label 
                                                        key={idx} 
                                                        className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${
                                                            isChecked
                                                                ? 'bg-blue-100 border-blue-500 text-blue-900 font-medium' 
                                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <input 
                                                            type="checkbox" 
                                                            value={op}
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                const newAnswers = e.target.checked 
                                                                    ? [...currentAnswers, op]
                                                                    : currentAnswers.filter(ans => ans !== op);
                                                                handleAnswerChange(q.id, newAnswers.join(','));
                                                            }}
                                                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                        />
                                                        <span className="font-bold text-gray-500 w-4">{charLabel}.</span>
                                                        <span>{op}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* --- 3. TEXT INPUT (Fill Blank / Essay) --- */}
                                    {(q.type === 'fill-blank' || q.type === 'essay' || q.type === 'speaking') && (
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                className="border border-gray-300 rounded w-full h-11 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm text-gray-800 placeholder:text-gray-400"
                                                placeholder="Type your answer here..."
                                                value={getCurrentAnswer(q.id)}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
         </div>
      </div>

      {/* --- KHỐI 3: TRACKER (PHẢI) --- */}
      <div className='w-80 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col shrink-0 overflow-hidden'>
          
          {/* Header Cố định (TIMER) */}
          <div className="bg-white shrink-0 z-10 shadow-sm">
              <div className='p-6 border-b border-gray-100 text-center bg-gray-50/30'>
                  <div className="text-xs text-gray-500 uppercase font-bold mb-2 tracking-wider">Thời gian còn lại</div>
                  <div className={`text-4xl font-bold font-mono tracking-widest ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                      {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </div>
              </div>

              <div className="p-4">
                  <Button 
                    variant='default' 
                    onClick={handleSubmit} 
                    className="w-full bg-white text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white font-bold h-11 uppercase tracking-wide shadow-sm transition-all"
                  >
                      Nộp bài
                  </Button>
                  <div className="mt-3 text-xs text-center text-gray-400 hover:text-blue-500 cursor-pointer hover:underline font-medium transition-colors">
                      Khôi phục/lưu bài làm &gt;
                  </div>
              </div>

              <div className="px-4 py-2 bg-yellow-50 mx-4 rounded border border-yellow-100 text-xs text-yellow-700 mb-4 font-medium flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <span>Click số thứ tự để chuyển câu.</span>
              </div>

              <div className="px-4 pb-2 border-b border-gray-100 bg-gray-50/50 pt-2 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 text-sm">Question Map</h3>
                  <span className="text-xs text-gray-400 font-semibold">{orderedQuestions.length} câu</span>
              </div>
          </div>

          {/* Grid Scrollable */}
          <div className='flex-1 overflow-y-auto px-4 py-4 bg-gray-50/30'>
              <div className='grid grid-cols-5 gap-2'>
                  {orderedQuestions.map((q, i) => {
                      const hasAnswer = getCurrentAnswer(q.id) !== '';
                      const isActive = currentQuestionId === q.id;
                      
                      return (
                          <button
                              key={q.id}
                              onClick={() => scrollToQuestion(q.id)}
                              className={`
                                  h-9 w-full rounded border text-xs font-bold transition-all shadow-sm
                                  ${isActive 
                                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200 transform scale-105 z-10' 
                                      : hasAnswer 
                                          ? 'bg-white text-blue-600 border-blue-300' 
                                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600'
                                  }
                              `}
                          >
                              {i + 1}
                          </button>
                      );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
}