import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
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

  // Redux Selectors (Lấy dữ liệu từ các Slice)
  const allExams = useAppSelector((state) => state.exams.list);
  const allSections = useAppSelector((state) => state.sections.list);
  const allQuestions = useAppSelector((state) => state.questions.list); // Dữ liệu từ questionSlice
  const allAttempts = useAppSelector((state) => state.attempts.list);
  const currentUser = useAppSelector((state) => state.currUser.current);

  // Local State
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);
  
  // State quản lý Attempt và Timer
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTracker, setShowTracker] = useState(true);
  
  // State quản lý câu hỏi hiện tại
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [currentSectionAncestors, setCurrentSectionAncestors] = useState<Section[]>([]);

  // --- REFS (FIX LỖI TIMER) ---
  const currentAttemptRef = useRef<Attempt | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const isSubmittingRef = useRef(false); // Cờ kiểm soát việc nộp bài

  // Sync Ref với State để Timer luôn thấy dữ liệu mới nhất
  useEffect(() => {
    currentAttemptRef.current = currentAttempt;
  }, [currentAttempt]);

  // --- 1. LOGIC XỬ LÝ DỮ LIỆU BÀI THI ---
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

  // --- 2. LOGIC KHỞI TẠO HOẶC KHÔI PHỤC ATTEMPT (FIX RETAKE) ---
  useEffect(() => {
    if (!id || !currentUser) return;
    if (currentAttempt) return; 

    // QUAN TRỌNG: Reset cờ submit để Timer chạy lại khi Retake
    isSubmittingRef.current = false;
    
    // Clear interval cũ nếu còn sót lại
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const isRetake = location.state?.retake;
    const { timer } = location.state || {};
    
    let attemptToLoad: Attempt | undefined;

    // Nếu KHÔNG phải Retake thì mới tìm bài cũ
    if (!isRetake) {
      attemptToLoad = allAttempts.find(
        (a) => a.examId === id && 
               a.userId === currentUser.id && 
               typeof a.score === 'undefined' // Chỉ load bài chưa có điểm
      );
    }

    if (attemptToLoad) {
      // --- RESUME ---
      setCurrentAttempt(attemptToLoad);
      setTimeLeft(attemptToLoad.timeLeft);
      lastSavedTimeRef.current = attemptToLoad.timeLeft;
    } else {
      // --- NEW / RETAKE ---
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

      // Reset ref thời gian để tránh Timer save nhầm
      lastSavedTimeRef.current = durationSec;

      dispatch(addAttempt(newAttempt));
      setCurrentAttempt(newAttempt);
      setTimeLeft(durationSec);

      if (orderedQuestions.length > 0) {
        setCurrentQuestionId(orderedQuestions[0].id);
      }
    }
  }, [id, currentUser, allAttempts, allExams, location.state, dispatch, currentAttempt, orderedQuestions]);

  useEffect(() => {
    if (!currentQuestionId && orderedQuestions.length > 0) {
      setCurrentQuestionId(orderedQuestions[0].id);
    }
  }, [orderedQuestions, currentQuestionId]);

  // --- 3. LOGIC TIMER ---
  useEffect(() => {
    // Chỉ chạy timer khi đã có attempt và chưa submit
    if (!currentAttemptRef.current && !currentAttempt) return;
    if (isSubmittingRef.current) return;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        // Hết giờ
        if (prevTime <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (!isSubmittingRef.current) {
            handleAutoSubmit();
          }
          return 0;
        }

        const newTime = prevTime - 1;

        // Auto save mỗi 5s
        if (newTime % 5 === 0) {
          const latestState = currentAttemptRef.current;
          if (latestState && typeof latestState.score === 'undefined') {
            dispatch(updateAttempt({
              ...latestState,
              timeLeft: newTime
            }));
            lastSavedTimeRef.current = newTime;
          }
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [dispatch, currentAttempt?.id]);

  // --- 4. HÀM CHẤM ĐIỂM (SO SÁNH VỚI QUESTION SLICE) ---
  const calculateScore = (finalChoices: { questionId: string; answerIdx: string }[]) => {
    let correctCount = 0;
    let totalPoints = 0;

    orderedQuestions.forEach((q) => {
      // q là dữ liệu từ questionSlice
      totalPoints += q.points;
      
      // Tìm câu trả lời của user
      const userChoice = finalChoices.find((c) => c.questionId === q.id);
      const userAnswer = userChoice?.answerIdx || ''; // e.g., "Option C" hoặc "Paris"

      if (q.correctAnswer && q.correctAnswer.length > 0) {
        // Case 1: Multiple Correct Answers (User chọn nhiều đáp án)
        if (q.type === 'multiple-correct-answers') {
          // User input: "Option A,Option B" -> Array
          const userArr = userAnswer.split(',').filter(Boolean).sort();
          // Slice data: ["Option A", "Option B"] -> Array
          const correctArr = [...q.correctAnswer].sort();
          
          // So sánh 2 mảng
          if (JSON.stringify(userArr) === JSON.stringify(correctArr)) {
            correctCount += q.points;
          }
        } 
        // Case 2: Essay/Speaking (Thường chấm tay, ở đây tạm thời cho 0 hoặc full nếu có điền)
        else if (q.type === 'essay' || q.type === 'speaking') {
           // Logic tạm: Nếu có điền thì tính điểm (hoặc bỏ qua chờ giáo viên chấm)
           // Hiện tại để 0 để tránh auto-grade sai.
        }
        // Case 3: Multiple Choice / Fill Blank
        else {
          // So sánh chuỗi. Vì q.correctAnswer là mảng string[], ta check xem nó có chứa đáp án user không
          // questionSlice: correctAnswer: ['Paris']
          // User: 'Paris' -> includes trả về true
          if (q.correctAnswer.includes(userAnswer)) {
            correctCount += q.points;
          }
        }
      }
    });

    // Trả về thang điểm 100
    return totalPoints > 0 ? (correctCount / totalPoints) * 100 : 0;
  };

  // --- 5. SUBMIT HANDLERS ---
  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setCurrentAttempt((prev) => {
      if (!prev) return null;

      const updatedChoices = [...prev.choices];
      const idx = updatedChoices.findIndex((c) => c.questionId === questionId);

      if (idx >= 0) {
        updatedChoices[idx] = { ...updatedChoices[idx], answerIdx: answer };
      } else {
        updatedChoices.push({ questionId, answerIdx: answer });
      }

      const newAttempt = { ...prev, choices: updatedChoices };
      
      // Update Redux ngầm để không mất dữ liệu nếu F5
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

    isSubmittingRef.current = true; // Block timer & double submit
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Tính điểm dựa trên so sánh đáp án
    const finalScore = calculateScore(finalAttempt.choices);

    const completedAttempt: Attempt = {
      ...finalAttempt,
      timeLeft: isAuto ? 0 : timeLeft,
      score: finalScore, // Set điểm số -> Đánh dấu hoàn thành
    };

    dispatch(updateAttempt(completedAttempt));
    navigate(`/results/${completedAttempt.id}`);
  };

  const handleSubmit = () => performSubmit(false);
  const handleAutoSubmit = () => performSubmit(true);

  // --- UI HELPER ---
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
    if (!currentQuestionId) return;
    const q = questions.find((item) => item.id === currentQuestionId);
    if (q) {
      setCurrentSectionAncestors(getAncestors(q.sectionId));
    }
  }, [currentQuestionId, questions, getAncestors]);

  const goToNext = () => {
    const idx = orderedQuestions.findIndex((q) => q.id === currentQuestionId);
    if (idx < orderedQuestions.length - 1) setCurrentQuestionId(orderedQuestions[idx + 1].id);
  };

  const goToPrev = () => {
    const idx = orderedQuestions.findIndex((q) => q.id === currentQuestionId);
    if (idx > 0) setCurrentQuestionId(orderedQuestions[idx - 1].id);
  };

  // --- RENDER ---
  return (
    <div className='h-screen w-full bg-gray-50 relative flex flex-col'>
      {/* Header */}
      <div className='bg-gray-100 px-4 py-3 font-semibold flex justify-between items-center border-b shrink-0'>
        <Button variant='outline' onClick={() => setShowTracker((v) => !v)}>
          {showTracker ? 'Hide' : 'Show'} Tracker
        </Button>
        <div className={`text-xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-black'}`}>
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
        <Button variant='destructive' onClick={handleSubmit}>
          Submit Test
        </Button>
      </div>

      <div className='flex-1 flex flex-row overflow-hidden'>
        {/* Question Tracker */}
        <motion.div
          initial={{ x: '-100%', width: 0 }}
          animate={{ x: showTracker ? 0 : '-100%', width: showTracker ? '16rem' : 0 }}
          transition={{ type: 'tween', duration: 0.3 }}
          className='bg-white border-r overflow-y-auto shadow-lg shrink-0'
        >
          <div className='p-4 w-64'>
            <h2 className='font-semibold text-lg mb-3'>Question Tracker</h2>
            <div className='grid grid-cols-4 gap-2'>
              {orderedQuestions.map((q, i) => {
                const ans = getCurrentAnswer(q.id);
                const hasAnswer = ans && ans.length > 0;
                return (
                  <Button
                    key={q.id}
                    variant={currentQuestionId === q.id ? 'default' : 'ghost'}
                    onClick={() => setCurrentQuestionId(q.id)}
                    className={`h-10 w-full p-0 relative ${
                      hasAnswer ? 'bg-green-100 hover:bg-green-200 text-green-800' : ''
                    } ${currentQuestionId === q.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {i + 1}
                    {hasAnswer && <span className='absolute top-0 right-1 text-xs font-bold'>✓</span>}
                  </Button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className='flex-1 flex h-full overflow-hidden'>
          {/* Left: Directive */}
          <div className='w-1/2 p-6 border-r overflow-y-auto bg-gray-50'>
            <h2 className='font-semibold mb-4 text-xl sticky top-0 bg-gray-50 pb-2 border-b'>Reading Text / Directive</h2>
            {currentSectionAncestors.map((section) => (
              section.direction ? (
                <div key={section.id} className="mb-6">
                  <div className='text-gray-700 leading-relaxed text-justify whitespace-pre-wrap'>
                    {section.direction}
                  </div>
                  <hr className='border-t border-gray-300 my-4' />
                </div>
              ) : null
            ))}
          </div>

          {/* Right: Questions */}
          <div className='w-1/2 p-6 overflow-y-auto bg-white flex flex-col'>
            <div className='flex-1 space-y-6'>
              {orderedQuestions
                .filter((q) => {
                  const activeSectionId = currentSectionAncestors[currentSectionAncestors.length - 1]?.id;
                  return q.sectionId === activeSectionId;
                })
                .map((q, index) => {
                   const realIndex = orderedQuestions.findIndex(oq => oq.id === q.id) + 1;
                   return (
                    <div
                      key={q.id}
                      id={`question-${q.id}`}
                      className={`p-4 border rounded-lg shadow-sm transition-all ${
                        q.id === currentQuestionId ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-gray-200'
                      }`}
                      onClick={() => setCurrentQuestionId(q.id)}
                    >
                      <div className='flex gap-2 mb-3'>
                        <span className='font-bold text-blue-600 min-w-[24px]'>Q{realIndex}:</span>
                        <span className='font-medium text-gray-800'>{q.content}</span>
                      </div>
  
                      <div className='ml-8'>
                        {/* Multiple Choice */}
                        {q.type === 'multiple-choice' && q.options && (
                          <div className='space-y-2'>
                            {q.options.map((op, idx) => (
                              <label key={idx} className='flex items-start gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors'>
                                <input
                                  type='radio'
                                  name={q.id}
                                  value={op}
                                  checked={getCurrentAnswer(q.id) === op}
                                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                  className='mt-1 cursor-pointer w-4 h-4 text-blue-600'
                                />
                                <span className="text-gray-700">{op}</span>
                              </label>
                            ))}
                          </div>
                        )}
  
                        {/* Fill Blank / Essay */}
                        {(q.type === 'essay' || q.type === 'fill-blank') && (
                          <textarea
                            value={getCurrentAnswer(q.id)}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className='border border-gray-300 rounded-md p-3 w-full min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:outline-none'
                            placeholder='Type your answer here...'
                          />
                        )}
  
                        {/* Multiple Correct Answers */}
                        {q.type === 'multiple-correct-answers' && q.options && (
                          <div className='space-y-2'>
                            {q.options.map((op, idx) => {
                              const currentAnswers = getCurrentAnswer(q.id).split(',').filter(Boolean);
                              return (
                                <label key={idx} className='flex items-start gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors'>
                                  <input
                                    type='checkbox'
                                    value={op}
                                    checked={currentAnswers.includes(op)}
                                    onChange={(e) => {
                                      const newAnswers = e.target.checked
                                        ? [...currentAnswers, op]
                                        : currentAnswers.filter((ans) => ans !== op);
                                      handleAnswerChange(q.id, newAnswers.join(','));
                                    }}
                                    className='mt-1 cursor-pointer w-4 h-4 text-blue-600 rounded'
                                  />
                                  <span className="text-gray-700">{op}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Navigation buttons */}
            <div className='flex justify-between mt-8 pt-4 border-t sticky bottom-0 bg-white'>
              <Button
                onClick={goToPrev}
                disabled={orderedQuestions.findIndex((q) => q.id === currentQuestionId) === 0}
                variant='outline'
                className="w-32"
              >
                ← Previous
              </Button>
              <Button
                onClick={goToNext}
                disabled={orderedQuestions.findIndex((q) => q.id === currentQuestionId) === orderedQuestions.length - 1}
                className="w-32 bg-blue-600 hover:bg-blue-700"
              >
                Next →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}