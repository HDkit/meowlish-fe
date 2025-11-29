// import React, { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// import { Button } from './ui/button';
// import { Badge } from './ui/badge';
// import { Progress } from './ui/progress';
// import { Separator } from './ui/separator';
// import {
//   Trophy,
//   Target,
//   TrendingUp,
//   CheckCircle,
//   XCircle,
//   Clock,
//   Brain,
//   BookOpen,
//   RotateCcw,
//   ArrowRight,
//   ArrowLeft,
//   ChevronLeft,
//   ChevronRight,
//   Pause,
//   MoreHorizontal,
//   ChevronDown,
//   ChevronUp,
//   Flag,
//   AlertCircle,
//   ListChecks,
//   Check
// } from 'lucide-react';
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
// import { Label } from './ui/label';
// import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
// import { Input } from './ui/input';
// import {
//   ResizableHandle,
//   ResizablePanel,
//   ResizablePanelGroup,
// } from "./ui/resizable";
// import { ScrollArea } from './ui/scroll-area';

// type ViewMode = 'overview' | 'question-list' | 'detailed-review';

// interface ResultsViewProps {
//   results: {
//     session: any;
//     accuracy: number;
//     estimatedScore: number;
//     correctAnswers: number;
//     totalQuestions: number;
//     recommendations: string[];
//   };
//   onBackToDashboard: () => void;
//   onRetakeTest: () => void;
// }

// // Question sections for grouping (matching TestInterface)
// const questionSections = [
//   {
//     id: 'section-1',
//     passageId: 'passage-1',
//     questionRange: '1-8',
//     title: 'Questions 1–8',
//     instruction: 'Look at the following theories (Questions 1-8) and the list of researchers below.\n\nMatch each theory with the correct researcher(s), A-F.\n\nNB You may use any letter more than once.',
//     type: 'matching',
//     options: [
//       'A Jim Bowler',
//       'B Alan Thorne',
//       'C Tim Flannery',
//       'D Rainer Grün',
//       'E Richard Roberts and Tim Flannery',
//       'F Judith Field and Richard Fullager'
//     ]
//   },
//   {
//     id: 'section-2',
//     passageId: 'passage-1',
//     questionRange: '9-13',
//     title: 'Questions 9–13',
//     instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
//     type: 'fill-blank'
//   },
//   {
//     id: 'section-3',
//     passageId: 'passage-2',
//     questionRange: '14-19',
//     title: 'Questions 14–19',
//     instruction: 'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
//     type: 'true-false'
//   },
//   {
//     id: 'section-4',
//     passageId: 'passage-2',
//     questionRange: '20-26',
//     title: 'Questions 20–26',
//     instruction: 'Choose the correct letter, A, B, C or D.',
//     type: 'multiple-choice'
//   },
//   {
//     id: 'section-5',
//     passageId: 'passage-3',
//     questionRange: '27-30',
//     title: 'Questions 27–30',
//     instruction: 'Look at the following claims (Questions 27-30) and the list of options below.\n\nMatch each claim with the correct option, A-G.\n\nNB You may use any letter more than once.',
//     type: 'matching',
//     options: [
//       'A People overwork changes that happen during eye movements',
//       'B At times, we fail to notice something because we choose to deceive ourselves',
//       'C Retaining every image and memory would hinder our ability to function effectively',
//       'D Sometimes, people overlook the significance of a crucial figure in a scene',
//       'E We misunderstand what we see because we rely on our imagination',
//       'F We don\'t have complete control over what captures our attention',
//       'G Imagining a scene and physically being there impact our visual processes in similar ways'
//     ]
//   },
//   {
//     id: 'section-6',
//     passageId: 'passage-3',
//     questionRange: '31-35',
//     title: 'Questions 31–35',
//     instruction: 'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
//     type: 'true-false'
//   },
//   {
//     id: 'section-7',
//     passageId: 'passage-3',
//     questionRange: '36-40',
//     title: 'Questions 36–40',
//     instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
//     type: 'fill-blank'
//   }
// ];

// // Mock passages data (should match TestInterface)
// const mockPassages = [
//   {
//     id: 'passage-1',
//     number: 1,
//     title: 'Mungo Lady and Mungo Man',
//     subtitle: 'Controversies in Australian Prehistory',
//     content: `Fifty thousand years ago, a lush landscape greeted the first Australians moving towards the south-east of the continent. Temperatures were cooler than now. Megafauna – giant prehistoric animals such as the marsupial lions and the rhinoceros-sized diprotodon – were abundant. Freshwater lakes in areas of western New South Wales (NSW) were brimming with fish. But climate change was coming. By 40,000 years ago, water levels had started to drop.

// A study of the sediments and graves of Lake Mungo, a dry lake bed in western NSW, has uncovered the muddy layers deposited as the lake began to dry up. Forty thousand years ago, families took refuge at the lake from the encroaching desert, leaving artifacts such as stone tools, which researchers used to determine that the first wanderers came to the area between 46,000 and 50,000 years ago. By 20,000 years ago, the lake had become the dry, dusty hole it is today. This area was first examined by the University of Melbourne archeologist Professor Jim Bowler in 1969. He was searching for ancient lakes and came across the remains of a woman who had been buried there, ceremony around 42,000 years ago and was later excavated. In 1974, he found a second set of remains, Mungo Man, buried 300 metres away. Bowler's comprehensive study of different sediment layers has concluded that both graves are 40,000 years old.`,
//     questionRange: '1-13'
//   },
//   {
//     id: 'passage-2',
//     number: 2,
//     title: 'The Development of Museums',
//     subtitle: '',
//     content: `The word 'museum' comes from the Greek mouseion, which in ancient times was a temple dedicated to the muses – the nine goddesses who presided over the arts and sciences. The first institution that resembled a modern museum was the Museum of Alexandria, founded in Egypt in the third century BCE. This was a research center that housed scholars and contained a library and collections of objects. However, it was not open to the public.

// The modern concept of a public museum – a place where collections of objects are preserved and displayed for public viewing – emerged during the Renaissance in Europe. Royal and aristocratic families began to collect rare and interesting objects, which they displayed in 'cabinets of curiosities.' The oldest public museum is the Capitoline Museums in Rome, established in 1471 when Pope Sixtus IV donated a collection of ancient bronze statues to the people of Rome.

// In the 17th and 18th centuries, many private collections were opened to the public. The Ashmolean Museum at Oxford University, founded in 1683, was one of the first museums to be purpose-built and open to the general public. The British Museum, established in 1753, was the first national public museum in the world. Its foundation reflected the Enlightenment ideals of making knowledge and culture accessible to all people, not just the wealthy elite.`,
//     questionRange: '9-20'
//   },
//   {
//     id: 'passage-3',
//     number: 3,
//     title: 'Artificial Intelligence in Healthcare',
//     subtitle: '',
//     content: `Artificial intelligence (AI) is revolutionizing healthcare in ways that seemed impossible just a decade ago. From diagnosing diseases to personalizing treatment plans, AI systems are becoming indispensable tools for medical professionals worldwide. Machine learning algorithms can now analyze medical images with accuracy that matches or exceeds human experts, identifying patterns that might be invisible to the human eye.

// One of the most promising applications of AI in healthcare is in the field of radiology. Deep learning systems have been trained on millions of medical images to detect conditions such as cancer, tuberculosis, and diabetic retinopathy. These systems can process images in seconds, providing rapid preliminary diagnoses that help doctors prioritize urgent cases. In some instances, AI has demonstrated the ability to identify early-stage cancers that human radiologists might miss.

// However, the integration of AI into healthcare is not without challenges. Concerns about data privacy, the potential for algorithmic bias, and the need for human oversight remain significant. Medical professionals emphasize that AI should be viewed as a tool to augment, rather than replace, human expertise. The most effective approach combines the pattern-recognition capabilities of AI with the contextual understanding and empathy that only human doctors can provide.`,
//     questionRange: '21-40'
//   }
// ];

// interface PassageAccordionProps {
//   passageId: string;
//   pIndex: number;
//   passageQuestions: any[];
//   session: any;
//   onViewDetail: (questionIndex: number) => void;
// }

// function PassageAccordion({ passageId, pIndex, passageQuestions, session, onViewDetail }: PassageAccordionProps) {
//   const [isOpen, setIsOpen] = useState(true);

//   return (
//     <Card>
//       <div
//         className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <h3 className="font-semibold">PASSAGE {pIndex + 1}</h3>
//         {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
//       </div>

//       {isOpen && (
//         <div className="border-t">
//           {passageQuestions.map((question: any, qIndex: number) => {
//             const answer = session.answers.find((a: any) => a.questionId === question.id);
//             const isCorrect = answer?.isCorrect;
//             const hasAnswer = answer?.userAnswer;
//             const answerText = hasAnswer ? answer.userAnswer : '—';

//             // Determine color based on answer status
//             let answerColor = 'text-gray-400'; // skipped
//             if (hasAnswer) {
//               answerColor = isCorrect ? 'text-green-600' : 'text-red-600';
//             }

//             return (
//               <div key={question.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30">
//                 <div className="flex items-center gap-3">
//                   <span className="text-sm">Câu số {question.questionNumber}:</span>
//                   <span className={`font-bold ${answerColor}`}>
//                     {answerText}
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="bg-orange-500 hover:bg-orange-600 text-white h-8 w-8"
//                     onClick={() => {
//                       const questionIndex = session.questions.indexOf(question);
//                       onViewDetail(questionIndex);
//                     }}
//                   >
//                     <ArrowRight className="h-4 w-4" />
//                   </Button>
//                   <Button variant="ghost" size="icon" className="h-8 w-8">
//                     <MoreHorizontal className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </Card>
//   );
// }

// export function ResultsView({ results, onBackToDashboard, onRetakeTest }: ResultsViewProps) {
//   const { session, accuracy, estimatedScore, correctAnswers, totalQuestions, recommendations } = results;
//   const [viewMode, setViewMode] = useState<ViewMode>('overview');
//   const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

//   const getScoreColor = (accuracy: number) => {
//     if (accuracy >= 80) return 'text-green-600';
//     if (accuracy >= 60) return 'text-yellow-600';
//     return 'text-red-600';
//   };

//   const getPerformanceLevel = (accuracy: number) => {
//     if (accuracy >= 80) return { level: 'Excellent', color: 'bg-green-100 text-green-800' };
//     if (accuracy >= 60) return { level: 'Good', color: 'bg-yellow-100 text-yellow-800' };
//     return { level: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
//   };

//   const performance = getPerformanceLevel(accuracy);

//   // Calculate statistics
//   const wrongAnswers = session.answers.filter((a: any) => !a.isCorrect && a.userAnswer).length;
//   const skippedAnswers = totalQuestions - session.answers.filter((a: any) => a.userAnswer).length;

//   // Group questions by passage
//   const questionsByPassage = session.questions.reduce((acc: any, q: any, index: number) => {
//     // Determine passage based on question number or index
//     let passageId = q.passageId;
//     if (!passageId) {
//       const qNum = q.questionNumber || index + 1;
//       if (qNum <= 13) passageId = 'passage-1';
//       else if (qNum <= 20) passageId = 'passage-2';
//       else passageId = 'passage-3';
//     }
//     if (!acc[passageId]) acc[passageId] = [];
//     acc[passageId].push(q);
//     return acc;
//   }, {});

//   // Overview View
//   const renderOverview = () => (
//     <div className="max-w-5xl mx-auto p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center gap-4">
//         <Button variant="ghost" size="icon" onClick={onBackToDashboard}>
//           <ChevronLeft className="h-5 w-5" />
//         </Button>
//         <h1 className="text-xl">REAL TESTS / [VOL 6] IELTS Reading Test 1</h1>
//       </div>

//       <div className="grid md:grid-cols-2 gap-6">
//         {/* Left Side - Info */}
//         <div className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Phân kiểm tra</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-3 gap-4">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Phân thi</p>
//                   <p className="font-medium">[VOL 6] IELTS Reading Test 1</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Trắc nghiệm</p>
//                   <p className="font-medium">{correctAnswers}/{totalQuestions}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Tổng điểm</p>
//                   <p className="font-medium">{estimatedScore.toFixed(1)}</p>
//                 </div>
//               </div>

//               <Button variant="outline" className="w-full justify-start" onClick={onRetakeTest}>
//                 Thử lại bài kiểm tra <ArrowRight className="ml-2 h-4 w-4" />
//               </Button>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Chi tiết bài thi</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-3 gap-4 mb-6">
//                 <div className="text-center">
//                   <div className="w-16 h-16 rounded-full bg-green-500 mx-auto flex items-center justify-center mb-2">
//                     <CheckCircle className="h-8 w-8 text-white" />
//                   </div>
//                   <p className="text-sm text-green-600">Trả lời đúng</p>
//                   <p className="font-medium">{correctAnswers} Câu</p>
//                 </div>
//                 <div className="text-center">
//                   <div className="w-16 h-16 rounded-full bg-red-500 mx-auto flex items-center justify-center mb-2">
//                     <XCircle className="h-8 w-8 text-white" />
//                   </div>
//                   <p className="text-sm text-red-600">Trả lời sai</p>
//                   <p className="font-medium">{wrongAnswers} Câu</p>
//                 </div>
//                 <div className="text-center">
//                   <div className="w-16 h-16 rounded-full bg-orange-500 mx-auto flex items-center justify-center mb-2">
//                     <Pause className="h-8 w-8 text-white" />
//                   </div>
//                   <p className="text-sm text-orange-600">Đã bỏ qua</p>
//                   <p className="font-medium">{skippedAnswers} Câu</p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4 text-sm">
//                 <div className="flex items-center gap-2">
//                   <BookOpen className="h-4 w-4" />
//                   <div>
//                     <p className="text-muted-foreground">Kết quả làm bài</p>
//                     <p className="font-medium">{correctAnswers}/{totalQuestions} Câu</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Clock className="h-4 w-4" />
//                   <div>
//                     <p className="text-muted-foreground">Thời gian làm bài</p>
//                     <p className="font-medium">{Math.round((Date.now() - new Date(session.startTime).getTime()) / 60000)} phút</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Target className="h-4 w-4" />
//                   <div>
//                     <p className="text-muted-foreground">Độ chính xác</p>
//                     <p className="font-medium">{Math.round(accuracy)}%</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <CheckCircle className="h-4 w-4" />
//                   <div>
//                     <p className="text-muted-foreground">Câu đúng</p>
//                     <p className="font-medium">{correctAnswers} / {totalQuestions} Câu</p>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Right Side - Score Circle */}
//         <div className="flex items-center justify-center">
//           <div className="relative w-64 h-64">
//             <svg className="w-full h-full transform -rotate-90">
//               <circle
//                 cx="128"
//                 cy="128"
//                 r="100"
//                 stroke="#e5e7eb"
//                 strokeWidth="24"
//                 fill="none"
//               />
//               <circle
//                 cx="128"
//                 cy="128"
//                 r="100"
//                 stroke={accuracy >= 60 ? '#22c55e' : accuracy >= 40 ? '#eab308' : '#ef4444'}
//                 strokeWidth="24"
//                 fill="none"
//                 strokeDasharray={`${(accuracy / 100) * 628} 628`}
//                 strokeLinecap="round"
//               />
//             </svg>
//             <div className="absolute inset-0 flex items-center justify-center">
//               <div className="text-center">
//                 <div className="text-6xl font-bold text-yellow-500">{estimatedScore.toFixed(1)}</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Continue Button */}
//       <div className="flex justify-end">
//         <Button
//           onClick={() => setViewMode('question-list')}
//           className="bg-yellow-500 hover:bg-yellow-600 text-white px-8"
//         >
//           Tiếp tục
//         </Button>
//       </div>
//     </div>
//   );

//   // Question List View
//   const renderQuestionList = () => {
//     const passages = Object.keys(questionsByPassage).sort();

//     return (
//       <div className="max-w-4xl mx-auto p-6 space-y-6">
//         <h2 className="text-2xl font-semibold">Danh sách câu hỏi</h2>

//         <div className="space-y-4">
//           {passages.map((passageId, pIndex) => {
//             const passageQuestions = questionsByPassage[passageId];

//             return (
//               <PassageAccordion
//                 key={passageId}
//                 passageId={passageId}
//                 pIndex={pIndex}
//                 passageQuestions={passageQuestions}
//                 session={session}
//                 onViewDetail={(questionIndex: number) => {
//                   setSelectedQuestionIndex(questionIndex);
//                   setViewMode('detailed-review');
//                 }}
//               />
//             );
//           })}
//         </div>

//         <div className="flex items-center justify-between pt-4">
//           <Button variant="outline" onClick={() => setViewMode('overview')}>
//             Trở lại
//           </Button>
//           <Button
//             variant="outline"
//             onClick={() => {
//               setSelectedQuestionIndex(0);
//               setViewMode('detailed-review');
//             }}
//           >
//             Xem chi tiết
//           </Button>
//         </div>
//       </div>
//     );
//   };

//   // Detailed Review View (like test interface but showing answers)
//   const renderDetailedReview = () => {
//     const currentQuestion = session.questions[selectedQuestionIndex];
//     const currentAnswer = session.answers.find((a: any) => a.questionId === currentQuestion.id);

//     // Find passage for current question
//     const currentPassageId = currentQuestion.passageId;
//     const currentPassageData = mockPassages.find((p: any) => p.id === currentPassageId);

//     // Find current passage index for navigation
//     const currentPassageIndex = mockPassages.findIndex((p: any) => p.id === currentPassageId) || 0;
//     const passageQuestions = session.questions.filter((q: any) => q.passageId === currentPassageId);
//     const currentQuestionIndexInPassage = passageQuestions.findIndex((q: any) => q.id === currentQuestion.id);

//     // Get current section information
//     const getCurrentSection = () => {
//       if (!currentQuestion) return null;
//       const questionNumber = currentQuestion.questionNumber || (selectedQuestionIndex + 1);
//       return questionSections.find(section => {
//         const [start, end] = section.questionRange.split('-').map(Number);
//         return questionNumber >= start && questionNumber <= end;
//       });
//     };

//     const currentSection = getCurrentSection();

//     // Group questions for footer display
//     const passages = Object.keys(questionsByPassage);

//     return (
//       <TooltipProvider>
//         <div className="fixed inset-0 flex flex-col bg-background">
//         {/* Enhanced Header */}
//         <div className="border-b bg-white dark:bg-gray-950 shadow-sm">
//           {/* Top Bar */}
//           <div className="px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
//             <div className="flex items-center gap-2 sm:gap-4 min-w-0">
//               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shrink-0">
//                 <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
//               </div>
//               <div className="min-w-0">
//                 <div className="flex items-center gap-2">
//                   <h1 className="font-semibold text-sm sm:text-base truncate">
//                     <span className="hidden sm:inline">[VOL 6] IELTS Reading Test 1</span>
//                     <span className="sm:hidden">IELTS Reading T1</span>
//                   </h1>
//                   <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
//                     Review
//                   </Badge>
//                 </div>
//                 <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
//                   <span className="flex items-center gap-1">
//                     <CheckCircle className="h-3 w-3" />
//                     {correctAnswers}/{totalQuestions}
//                   </span>
//                   <span className="hidden sm:inline">•</span>
//                   <span className="hidden sm:inline">3 passages</span>
//                 </div>
//               </div>
//             </div>

//             {/* Score Display */}
//             <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800 transition-colors shrink-0">
//               <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
//               <div>
//                 <div className="text-xs text-muted-foreground hidden sm:block">Final Score</div>
//                 <div className="font-mono text-sm sm:text-base font-bold text-green-600">
//                   {estimatedScore.toFixed(1)}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Progress Bar */}
//           <div className="px-3 sm:px-6 pb-2 sm:pb-3">
//             <div className="flex items-center gap-2 sm:gap-3">
//               <Progress value={accuracy} className="flex-1 h-1.5 sm:h-2" />
//               <span className="text-xs text-muted-foreground min-w-[45px] sm:min-w-[60px] text-right">
//                 {Math.round(accuracy)}%
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Main Content - Split View */}
//         <div className="flex-1 overflow-hidden">
//           <ResizablePanelGroup direction="horizontal">
//             {/* Left Panel - Passage */}
//             <ResizablePanel defaultSize={50} minSize={30}>
//               <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
//                 {/* Passage Header with Gradient */}
//                 <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 sm:px-6 py-4 sm:py-5 shadow-lg">
//                   <div className="flex items-center justify-between mb-2 gap-2">
//                     <h2 className="uppercase tracking-wider font-semibold flex items-center gap-2 text-sm sm:text-base">
//                       <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-sm sm:text-base">
//                         {currentPassageData?.number}
//                       </div>
//                       <span className="hidden sm:inline">PASSAGE {currentPassageData?.number}</span>
//                       <span className="sm:hidden">P{currentPassageData?.number}</span>
//                     </h2>
//                     <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs px-2 py-0.5">
//                       {currentPassageData?.questionRange}
//                     </Badge>
//                   </div>
//                   {currentPassageData?.title && (
//                     <div>
//                       <h3 className="font-semibold text-base sm:text-lg line-clamp-2">{currentPassageData.title}</h3>
//                       {currentPassageData.subtitle && (
//                         <p className="text-xs sm:text-sm text-white/80 mt-1 italic line-clamp-1">{currentPassageData.subtitle}</p>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Passage Content */}
//                 <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
//                   <div className="max-w-3xl space-y-3 sm:space-y-4 pr-2 sm:pr-3">
//                     <div className="prose dark:prose-invert max-w-none prose-sm sm:prose-base">
//                       {currentPassageData?.content.split('\n\n').map((paragraph: string, index: number) => (
//                         <p key={index} className="text-justify leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
//                           {paragraph}
//                         </p>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Passage Overview */}
//                 <div className="border-t bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4 overflow-x-auto">
//                   <div className="flex items-center gap-2 sm:gap-3 min-w-max">
//                     {mockPassages.map((passage, pIndex) => {
//                       const passageQs = session.questions.filter(q => q.passageId === passage.id);
//                       const answeredCount = session.answers.filter(a => passageQs.some(q => q.id === a.questionId && a.userAnswer)).length;
//                       const isActive = pIndex === currentPassageIndex;

//                       return (
//                         <Button
//                           key={passage.id}
//                           variant={isActive ? "default" : "outline"}
//                           size="sm"
//                           className={`h-9 sm:h-10 px-3 sm:px-4 transition-all text-xs sm:text-sm ${
//                             isActive ? 'ring-2 ring-offset-2 ring-primary shadow-lg' : ''
//                           }`}
//                           onClick={() => {
//                             // Find first question of this passage
//                             const firstQuestionIndex = session.questions.findIndex(q => q.passageId === passage.id);
//                             if (firstQuestionIndex !== -1) {
//                               setSelectedQuestionIndex(firstQuestionIndex);
//                             }
//                           }}
//                         >
//                           <div className="flex items-center gap-1.5 sm:gap-2">
//                             <div className="flex flex-col items-start">
//                               <span className="text-xs opacity-75 hidden sm:inline">Passage</span>
//                               <span className="font-semibold text-xs sm:text-sm">P{passage.number}</span>
//                             </div>
//                             <div className="text-xs">
//                               {answeredCount}/{passageQs.length}
//                             </div>
//                           </div>
//                         </Button>
//                       );
//                     })}
//                   </div>
//                 </div>
//               </div>
//             </ResizablePanel>

//             <ResizableHandle withHandle />

//             {/* Right Panel - Questions */}
//             <ResizablePanel defaultSize={50} minSize={30}>
//               <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
//                 {/* Questions Header */}
//                 <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 sm:px-6 py-4 sm:py-5 shadow-lg">
//                   {/* Section Title */}
//                   {currentSection && (
//                     <div className="mb-4 pb-3 border-b border-white/20">
//                       <h2 className="text-lg sm:text-xl font-bold mb-2">
//                         {currentSection.title}
//                       </h2>
//                       <div className="text-sm text-white/90 whitespace-pre-line leading-relaxed">
//                         {currentSection.instruction}
//                       </div>
//                     </div>
//                   )}

//                   {/* Current Question Info */}
//                   <div className="flex items-center justify-between mb-2 gap-2">
//                     <h3 className="uppercase tracking-wider font-semibold text-sm sm:text-base">
//                       Question {currentQuestion?.questionNumber || (selectedQuestionIndex + 1)}
//                     </h3>
//                     <div className="flex items-center gap-1.5 sm:gap-2">
//                       {/* Result indicator */}
//                       {currentAnswer?.isCorrect ? (
//                         <Badge className="bg-green-500 text-white border-0 text-xs px-2 py-0.5">
//                           Correct
//                         </Badge>
//                       ) : currentAnswer?.userAnswer ? (
//                         <Badge className="bg-red-500 text-white border-0 text-xs px-2 py-0.5">
//                           Wrong
//                         </Badge>
//                       ) : (
//                         <Badge className="bg-orange-500 text-white border-0 text-xs px-2 py-0.5">
//                           Skipped
//                         </Badge>
//                       )}
//                       <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs px-2 py-0.5 hidden sm:inline-flex">
//                         Review Mode
//                       </Badge>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Question Content */}
//                 <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/10 dark:to-indigo-950/10 px-3 sm:px-6 py-4 sm:py-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
//                   <div className="space-y-4 sm:space-y-6 pr-2 sm:pr-3">
//                     {/* Options List (for matching questions) */}
//                     {currentSection?.type === 'matching' && currentSection.options && (
//                       <Card className="bg-white dark:bg-gray-950 shadow-md">
//                         <CardContent className="p-3 sm:p-4">
//                           <h4 className="mb-2 sm:mb-3 font-semibold text-sm sm:text-base">
//                             {currentSection.questionRange === '1-8' ? 'List of Researchers' :
//                              currentSection.questionRange === '27-30' ? 'List of Options' : 'Options'}
//                           </h4>
//                           <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
//                             {currentSection.options.map((option, index) => (
//                               <div key={index} className="flex items-start gap-2 p-1.5 sm:p-2 rounded hover:bg-muted/50 transition-colors">
//                                 <span className="shrink-0 font-semibold text-primary w-4 sm:w-5">{option.charAt(0)}</span>
//                                 <span className="leading-relaxed">{option.substring(2)}</span>
//                               </div>
//                             ))}
//                           </div>
//                         </CardContent>
//                       </Card>
//                     )}

//                     {/* Question and Answer Options */}
//                     <Card className="bg-white dark:bg-gray-950 shadow-md">
//                       <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
//                         {/* Question Text */}
//                         <div className="flex gap-2 sm:gap-3">
//                           <div className="flex items-start gap-2 sm:gap-3 flex-1">
//                             <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${
//                               currentAnswer?.isCorrect
//                                 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
//                                 : currentAnswer?.userAnswer
//                                 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
//                                 : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
//                             }`}>
//                               <span className="font-semibold text-xs sm:text-sm">{currentQuestion?.questionNumber}</span>
//                             </div>
//                             <span className="pt-0.5 sm:pt-1 text-sm sm:text-base leading-relaxed">{currentQuestion?.content || currentQuestion?.text}</span>
//                           </div>
//                         </div>

//                         {/* Answer Options */}
//                         {/* Matching Type */}
//                         {currentQuestion?.type === 'matching' && currentSection?.options && (
//                           <div className="space-y-4">
//                             <div className="text-xs sm:text-sm text-muted-foreground">
//                               <div className="flex items-center gap-2 mb-3">
//                                 <span>Your answer:</span>
//                                 {currentAnswer?.userAnswer && (
//                                   <span className={`text-xs px-2 py-0.5 rounded font-medium ${
//                                     currentAnswer.isCorrect
//                                       ? 'bg-green-100 text-green-700'
//                                       : 'bg-red-100 text-red-700'
//                                   }`}>
//                                     {currentAnswer.userAnswer}
//                                   </span>
//                                 )}
//                               </div>
//                             </div>

//                             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
//                               {currentSection.options.map((option) => {
//                                 const letter = option.charAt(0);
//                                 const isUserAnswer = currentAnswer?.userAnswer === letter;
//                                 const isCorrect = currentQuestion.correctAnswer === letter;

//                                 return (
//                                   <div key={letter} className="relative">
//                                     <Button
//                                       variant={isUserAnswer ? "default" : "outline"}
//                                       className={`w-full aspect-square p-0 font-semibold text-base sm:text-lg transition-all relative ${
//                                         isCorrect
//                                           ? 'ring-2 ring-green-500 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
//                                           : isUserAnswer && !isCorrect
//                                           ? 'ring-2 ring-red-500 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
//                                           : ''
//                                       }`}
//                                       disabled
//                                     >
//                                       {letter}
//                                     </Button>

//                                     {/* Status indicators */}
//                                     {isCorrect && (
//                                       <div className="absolute -top-1 -right-1">
//                                         <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
//                                           <Check className="h-2.5 w-2.5 text-white" />
//                                         </div>
//                                       </div>
//                                     )}
//                                     {isUserAnswer && !isCorrect && (
//                                       <div className="absolute -top-1 -right-1">
//                                         <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
//                                           <XCircle className="h-2.5 w-2.5 text-white" />
//                                         </div>
//                                       </div>
//                                     )}

//                                     {/* Labels */}
//                                     {isCorrect && (
//                                       <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
//                                         <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded whitespace-nowrap">
//                                           Đúng
//                                         </span>
//                                       </div>
//                                     )}
//                                     {isUserAnswer && (
//                                       <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
//                                         <span className={`text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${
//                                           isCorrect
//                                             ? 'text-green-600 bg-green-50'
//                                             : 'text-blue-600 bg-blue-50'
//                                         }`}>
//                                           {isCorrect ? 'Đúng' : 'Chọn'}
//                                         </span>
//                                       </div>
//                                     )}
//                                   </div>
//                                 );
//                               })}
//                             </div>

//                             {/* Summary */}
//                             <div className="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border">
//                               <div className="flex items-center justify-between text-sm">
//                                 <div className="flex items-center gap-2">
//                                   {currentAnswer?.isCorrect ? (
//                                     <>
//                                       <CheckCircle className="h-4 w-4 text-green-600" />
//                                       <span className="font-medium text-green-600">Chính xác!</span>
//                                     </>
//                                   ) : currentAnswer?.userAnswer ? (
//                                     <>
//                                       <XCircle className="h-4 w-4 text-red-600" />
//                                       <span className="font-medium text-red-600">Sai rồi</span>
//                                     </>
//                                   ) : (
//                                     <>
//                                       <Pause className="h-4 w-4 text-orange-600" />
//                                       <span className="font-medium text-orange-600">Chưa trả lời</span>
//                                     </>
//                                   )}
//                                 </div>
//                                 <div className="text-xs text-muted-foreground">
//                                   Đáp án đúng: <span className="font-bold text-green-600 text-base">{currentQuestion.correctAnswer}</span>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         )}

//                         {/* True/False Type */}
//                         {currentQuestion?.type === 'true-false' && (
//                           <div className="space-y-4">
//                             <div className="text-xs sm:text-sm text-muted-foreground mb-3">
//                               <div className="flex items-center gap-2">
//                                 <span>Lựa chọn của bạn:</span>
//                                 {currentAnswer?.userAnswer && (
//                                   <span className={`text-xs px-2 py-0.5 rounded font-medium ${
//                                     currentAnswer.isCorrect
//                                       ? 'bg-green-100 text-green-700'
//                                       : 'bg-red-100 text-red-700'
//                                   }`}>
//                                     {currentAnswer.userAnswer}
//                                   </span>
//                                 )}
//                               </div>
//                             </div>

//                             <div className="grid grid-cols-1 gap-3">
//                               {['TRUE', 'FALSE', 'NOT GIVEN'].map((option) => {
//                                 const isUserAnswer = currentAnswer?.userAnswer === option;
//                                 const isCorrect = currentQuestion.correctAnswer === option;

//                                 return (
//                                   <div
//                                     key={option}
//                                     className={`relative w-full p-4 rounded-lg border-2 transition-all ${
//                                       isCorrect
//                                         ? 'border-green-500 bg-green-50 dark:bg-green-950 ring-1 ring-green-500'
//                                         : isUserAnswer && !isCorrect
//                                         ? 'border-red-500 bg-red-50 dark:bg-red-950 ring-1 ring-red-500'
//                                         : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950'
//                                     }`}
//                                   >
//                                     <div className="flex items-center justify-between">
//                                       <div className="flex items-center gap-3">
//                                         <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
//                                           isCorrect
//                                             ? 'bg-green-500 text-white'
//                                             : isUserAnswer && !isCorrect
//                                             ? 'bg-red-500 text-white'
//                                             : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
//                                         }`}>
//                                           {option === 'TRUE' ? 'T' : option === 'FALSE' ? 'F' : 'NG'}
//                                         </div>
//                                         <span className="font-semibold text-sm sm:text-base">{option}</span>
//                                       </div>

//                                       <div className="flex items-center gap-2">
//                                         {isUserAnswer && (
//                                           <div className="flex items-center gap-1">
//                                             <div className={`w-2 h-2 rounded-full ${
//                                               isCorrect ? 'bg-green-500' : 'bg-red-500'
//                                             }`} />
//                                             <span className="text-xs text-muted-foreground">Bạn chọn</span>
//                                           </div>
//                                         )}
//                                         {isCorrect && (
//                                           <div className="flex items-center gap-1">
//                                             <CheckCircle className="h-5 w-5 text-green-600" />
//                                             <span className="text-xs font-medium text-green-600">Đáp án đúng</span>
//                                           </div>
//                                         )}
//                                       </div>
//                                     </div>

//                                     {/* Status badge */}
//                                     {isCorrect && (
//                                       <div className="absolute -top-1 -right-1">
//                                         <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
//                                           ✓ Correct
//                                         </div>
//                                       </div>
//                                     )}
//                                     {isUserAnswer && !isCorrect && (
//                                       <div className="absolute -top-1 -right-1">
//                                         <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
//                                           ✗ Wrong
//                                         </div>
//                                       </div>
//                                     )}
//                                   </div>
//                                 );
//                               })}
//                             </div>

//                             {/* Summary */}
//                             <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border">
//                               <div className="flex items-center justify-between text-sm">
//                                 <div className="flex items-center gap-2">
//                                   {currentAnswer?.isCorrect ? (
//                                     <>
//                                       <CheckCircle className="h-4 w-4 text-green-600" />
//                                       <span className="font-medium text-green-600">Chính xác!</span>
//                                     </>
//                                   ) : currentAnswer?.userAnswer ? (
//                                     <>
//                                       <XCircle className="h-4 w-4 text-red-600" />
//                                       <span className="font-medium text-red-600">Sai rồi</span>
//                                     </>
//                                   ) : (
//                                     <>
//                                       <Pause className="h-4 w-4 text-orange-600" />
//                                       <span className="font-medium text-orange-600">Chưa trả lời</span>
//                                     </>
//                                   )}
//                                 </div>
//                                 <div className="text-xs text-muted-foreground">
//                                   Đáp án đúng: <span className="font-bold text-green-600 text-base">{currentQuestion.correctAnswer}</span>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         )}

//                         {/* Multiple Choice Type */}
//                         {currentQuestion?.type === 'multiple-choice' && currentQuestion.options && (
//                           <div className="space-y-3">
//                             <div className="text-xs sm:text-sm text-muted-foreground mb-2">
//                               <div className="flex items-center gap-2">
//                                 <span>Các lựa chọn:</span>
//                                 {currentAnswer?.userAnswer && (
//                                   <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
//                                     Bạn đã chọn: {currentAnswer.userAnswer}
//                                   </span>
//                                 )}
//                               </div>
//                             </div>
//                             {currentQuestion.options.map((option: string, index: number) => {
//                               const isUserAnswer = currentAnswer?.userAnswer === option;
//                               const isCorrect = option === currentQuestion.correctAnswer;
//                               const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...

//                               return (
//                                 <div
//                                   key={index}
//                                   className={`relative w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-all text-sm sm:text-base ${
//                                     isCorrect
//                                       ? 'border-green-500 bg-green-50 dark:bg-green-950 ring-1 ring-green-500'
//                                       : isUserAnswer && !isCorrect
//                                       ? 'border-red-500 bg-red-50 dark:bg-red-950 ring-1 ring-red-500'
//                                       : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950'
//                                   }`}
//                                 >
//                                   <div className="flex items-start gap-3">
//                                     {/* Option Letter */}
//                                     <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
//                                       isCorrect
//                                         ? 'bg-green-500 text-white'
//                                         : isUserAnswer && !isCorrect
//                                         ? 'bg-red-500 text-white'
//                                         : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
//                                     }`}>
//                                       {optionLetter}
//                                     </div>

//                                     {/* Option Text */}
//                                     <span className="leading-relaxed flex-1 pt-0.5">{option}</span>

//                                     {/* Status Icons */}
//                                     <div className="flex items-center gap-2 shrink-0">
//                                       {isUserAnswer && (
//                                         <div className="flex items-center gap-1">
//                                           <div className={`w-2 h-2 rounded-full ${
//                                             isCorrect ? 'bg-green-500' : 'bg-red-500'
//                                           }`} />
//                                           <span className="text-xs text-muted-foreground">Lựa chọn của bạn</span>
//                                         </div>
//                                       )}
//                                       {isCorrect && (
//                                         <div className="flex items-center gap-1">
//                                           <CheckCircle className="h-5 w-5 text-green-600" />
//                                           <span className="text-xs font-medium text-green-600">Đáp án đúng</span>
//                                         </div>
//                                       )}
//                                     </div>
//                                   </div>

//                                   {/* Feedback badge */}
//                                   {isCorrect && (
//                                     <div className="absolute -top-1 -right-1">
//                                       <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
//                                         ✓ Correct
//                                       </div>
//                                     </div>
//                                   )}
//                                   {isUserAnswer && !isCorrect && (
//                                     <div className="absolute -top-1 -right-1">
//                                       <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
//                                         ✗ Wrong
//                                       </div>
//                                     </div>
//                                   )}
//                                 </div>
//                               );
//                             })}

//                             {/* Summary */}
//                             <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border">
//                               <div className="flex items-center justify-between text-sm">
//                                 <div className="flex items-center gap-2">
//                                   {currentAnswer?.isCorrect ? (
//                                     <>
//                                       <CheckCircle className="h-4 w-4 text-green-600" />
//                                       <span className="font-medium text-green-600">Bạn đã trả lời đúng!</span>
//                                     </>
//                                   ) : currentAnswer?.userAnswer ? (
//                                     <>
//                                       <XCircle className="h-4 w-4 text-red-600" />
//                                       <span className="font-medium text-red-600">Bạn đã trả lời sai</span>
//                                     </>
//                                   ) : (
//                                     <>
//                                       <Pause className="h-4 w-4 text-orange-600" />
//                                       <span className="font-medium text-orange-600">Bạn đã bỏ qua câu này</span>
//                                     </>
//                                   )}
//                                 </div>
//                                 <div className="text-xs text-muted-foreground">
//                                   Đáp án đúng: <span className="font-medium text-green-600">{currentQuestion.correctAnswer}</span>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         )}

//                         {/* Fill in the Blank Type */}
//                         {currentQuestion?.type === 'fill-blank' && (
//                           <div className="space-y-4">
//                             <div className="text-xs sm:text-sm text-muted-foreground">
//                               So sánh câu trả lời:
//                             </div>

//                             <div className="space-y-3">
//                               {/* User's Answer */}
//                               <div className={`relative p-4 border-2 rounded-lg ${
//                                 currentAnswer?.isCorrect
//                                   ? 'border-green-500 bg-green-50 dark:bg-green-950'
//                                   : currentAnswer?.userAnswer
//                                   ? 'border-red-500 bg-red-50 dark:bg-red-950'
//                                   : 'border-orange-500 bg-orange-50 dark:bg-orange-950'
//                               }`}>
//                                 <div className="flex items-start justify-between gap-3">
//                                   <div className="flex-1">
//                                     <div className="flex items-center gap-2 mb-2">
//                                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
//                                         currentAnswer?.isCorrect
//                                           ? 'bg-green-500 text-white'
//                                           : currentAnswer?.userAnswer
//                                           ? 'bg-red-500 text-white'
//                                           : 'bg-orange-500 text-white'
//                                       }`}>
//                                         {currentAnswer?.isCorrect ? '✓' : currentAnswer?.userAnswer ? '✗' : '?'}
//                                       </div>
//                                       <p className="text-sm font-medium text-muted-foreground">Câu trả lời của bạn:</p>
//                                     </div>
//                                     <p className={`font-bold text-base ${
//                                       currentAnswer?.isCorrect
//                                         ? 'text-green-700 dark:text-green-300'
//                                         : currentAnswer?.userAnswer
//                                         ? 'text-red-700 dark:text-red-300'
//                                         : 'text-orange-700 dark:text-orange-300'
//                                     }`}>
//                                       {currentAnswer?.userAnswer || '(Không trả lời)'}
//                                     </p>
//                                   </div>

//                                   {currentAnswer?.isCorrect && (
//                                     <div className="absolute -top-1 -right-1">
//                                       <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
//                                         ✓ Correct
//                                       </div>
//                                     </div>
//                                   )}
//                                   {currentAnswer?.userAnswer && !currentAnswer?.isCorrect && (
//                                     <div className="absolute -top-1 -right-1">
//                                       <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
//                                         ✗ Wrong
//                                       </div>
//                                     </div>
//                                   )}
//                                 </div>
//                               </div>

//                               {/* Correct Answer */}
//                               <div className="relative p-4 border-2 border-green-500 bg-green-50 dark:bg-green-950 rounded-lg">
//                                 <div className="flex items-start gap-3">
//                                   <div className="flex-1">
//                                     <div className="flex items-center gap-2 mb-2">
//                                       <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
//                                         ✓
//                                       </div>
//                                       <p className="text-sm font-medium text-muted-foreground">Đáp án đúng:</p>
//                                     </div>
//                                     <p className="font-bold text-base text-green-700 dark:text-green-300 flex items-center gap-2">
//                                       <CheckCircle className="h-4 w-4" />
//                                       {currentQuestion.correctAnswer}
//                                     </p>
//                                   </div>
//                                 </div>

//                                 <div className="absolute -top-1 -right-1">
//                                   <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
//                                     ✓ Answer Key
//                                   </div>
//                                 </div>
//                               </div>

//                               {/* Comparison hint */}
//                               {currentAnswer?.userAnswer && !currentAnswer?.isCorrect && (
//                                 <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
//                                   <div className="flex items-start gap-2">
//                                     <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
//                                     <div className="text-sm">
//                                       <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Gợi ý:</p>
//                                       <p className="text-blue-700 dark:text-blue-300">
//                                         Bạn đã viết "<span className="font-medium">{currentAnswer.userAnswer}</span>"
//                                         nhưng đáp án đúng là "<span className="font-medium">{currentQuestion.correctAnswer}</span>".
//                                         Hãy chú ý đến chính tả và từ vựng chính xác.
//                                       </p>
//                                     </div>
//                                   </div>
//                                 </div>
//                               )}
//                             </div>

//                             {/* Summary */}
//                             <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border">
//                               <div className="flex items-center justify-between text-sm">
//                                 <div className="flex items-center gap-2">
//                                   {currentAnswer?.isCorrect ? (
//                                     <>
//                                       <CheckCircle className="h-4 w-4 text-green-600" />
//                                       <span className="font-medium text-green-600">Hoàn hảo!</span>
//                                     </>
//                                   ) : currentAnswer?.userAnswer ? (
//                                     <>
//                                       <XCircle className="h-4 w-4 text-red-600" />
//                                       <span className="font-medium text-red-600">Chưa chính xác</span>
//                                     </>
//                                   ) : (
//                                     <>
//                                       <Pause className="h-4 w-4 text-orange-600" />
//                                       <span className="font-medium text-orange-600">Chưa trả lời</span>
//                                     </>
//                                   )}
//                                 </div>
//                                 <div className="text-xs text-muted-foreground">
//                                   Yêu cầu: <span className="font-medium">Không quá 2 từ từ đoạn văn</span>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         )}
//                       </CardContent>
//                     </Card>

//                     {/* Preview of other questions in this passage */}
//                     <div className="space-y-2">
//                       <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground px-1">
//                         Các câu khác trong passage này:
//                       </h4>
//                       <div className="space-y-1.5 sm:space-y-2">
//                         {passageQuestions.map((q: any, idx: number) => {
//                           if (q.id === currentQuestion?.id) return null;
//                           const qAnswer = session.answers.find((a: any) => a.questionId === q.id);
//                           const isAnswered = !!qAnswer?.userAnswer;
//                           const isCorrectAnswer = qAnswer?.isCorrect;

//                           return (
//                             <button
//                               key={q.id}
//                               onClick={() => {
//                                 const globalIndex = session.questions.findIndex((sq: any) => sq.id === q.id);
//                                 setSelectedQuestionIndex(globalIndex);
//                               }}
//                               className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-xs sm:text-sm hover:bg-white/50 dark:hover:bg-gray-900/50 transition-colors text-left"
//                             >
//                               <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 text-xs sm:text-sm font-semibold ${
//                                 isCorrectAnswer
//                                   ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
//                                   : isAnswered
//                                   ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
//                                   : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
//                               }`}>
//                                 {q.questionNumber}
//                               </div>
//                               <span className={`flex-1 line-clamp-1 ${!isAnswered && 'text-muted-foreground'}`}>
//                                 {q.content || q.text}
//                               </span>
//                               <div className="flex items-center gap-1 shrink-0">
//                                 {isCorrectAnswer ? (
//                                   <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
//                                 ) : isAnswered ? (
//                                   <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
//                                 ) : (
//                                   <Pause className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
//                                 )}
//                               </div>
//                             </button>
//                           );
//                         })}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </ResizablePanel>
//           </ResizablePanelGroup>
//         </div>

//         {/* Navigation Bar - Single Row */}
//         <div className="border-t bg-white dark:bg-gray-950 shadow-lg px-3 sm:px-6 py-2 sm:py-3">
//           <div className="flex items-center justify-between gap-2 sm:gap-4">
//             {/* Center - Passage Info & Questions */}
//             <div className="flex items-center gap-1 sm:gap-2 flex-1 overflow-hidden px-2">
//               {/* Passage Label */}
//               <span className="font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
//                 PASSAGE {mockPassages[currentPassageIndex]?.number}
//               </span>

//               {/* Left Chevron */}
//               <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />

//               {/* Question Numbers */}
//               <div className="flex gap-1 items-center overflow-x-auto scrollbar-hide">
//                 {session.questions
//                   .filter((q: any) => q.passageId === mockPassages[currentPassageIndex]?.id)
//                   .map((q: any, idx: number) => {
//                     const ans = session.answers.find((a: any) => a.questionId === q.id);
//                     const isCorrect = ans?.isCorrect;
//                     const hasAnswer = ans?.userAnswer;
//                     const isCurrent = q.id === currentQuestion?.id;

//                     return (
//                       <Button
//                         key={q.id}
//                         variant="ghost"
//                         size="sm"
//                         className={`h-6 w-6 sm:h-7 sm:w-7 p-0 text-xs font-medium transition-all flex-shrink-0 ${
//                           isCorrect
//                             ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100 hover:bg-emerald-200 dark:hover:bg-emerald-800'
//                             : hasAnswer && !isCorrect
//                             ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800'
//                             : !hasAnswer
//                             ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100 hover:bg-orange-200 dark:hover:bg-orange-800'
//                             : isCurrent
//                             ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800'
//                             : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
//                         } ${isCurrent ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''}`}
//                         onClick={() => {
//                           const globalIndex = session.questions.findIndex((sq: any) => sq.id === q.id);
//                           setSelectedQuestionIndex(globalIndex);
//                         }}
//                       >
//                         {q.questionNumber || (session.questions.indexOf(q) + 1)}
//                       </Button>
//                     );
//                   })}
//               </div>

//               {/* Right Chevron */}
//               <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
//             </div>

//             {/* Right - Navigation Buttons */}
//             <div className="flex gap-1 sm:gap-2 ml-auto">
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setSelectedQuestionIndex(prev => Math.max(0, prev - 1))}
//                     disabled={selectedQuestionIndex === 0}
//                     className="text-xs gap-1 disabled:opacity-50"
//                   >
//                     <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
//                     <span className="hidden sm:inline">Previous</span>
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent>Câu trước</TooltipContent>
//               </Tooltip>

//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setSelectedQuestionIndex(prev => Math.min(session.questions.length - 1, prev + 1))}
//                     disabled={selectedQuestionIndex === session.questions.length - 1}
//                     className="text-xs gap-1 disabled:opacity-50"
//                   >
//                     <span className="hidden sm:inline">Next</span>
//                     <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent>Câu sau</TooltipContent>
//               </Tooltip>

//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="default"
//                     size="sm"
//                     onClick={onRetakeTest}
//                     className="text-xs gap-1 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
//                   >
//                     <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
//                     <span className="hidden sm:inline">Retake</span>
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent>Làm lại bài thi</TooltipContent>
//               </Tooltip>
//             </div>
//           </div>
//         </div>
//       </div>
//       </TooltipProvider>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       {viewMode === 'overview' && renderOverview()}
//       {viewMode === 'question-list' && renderQuestionList()}
//       {viewMode === 'detailed-review' && renderDetailedReview()}
//     </div>
//   );
// }
