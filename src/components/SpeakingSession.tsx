import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Mic, 
  MicOff, 
  Play,
  Pause,
  StopCircle,
  Volume2,
  MessageSquare,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  Wifi,
  WifiOff
} from 'lucide-react';
import { SpeakingPart, SpeakingTestData } from './SpeakingTest';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

// Import services
import { audioService } from '../services/audioService';
import { speechRecognitionService } from '../services/speechRecognitionService';
import { elevenLabsService } from '../services/elevenLabsService';
import { speechToTextService, type STTResult } from '../services/speechToTextService';
import { geminiService, type SpeakingContext } from '../services/geminiService';

interface SpeakingSessionProps {
  part: SpeakingPart;
  onEnd: (data: SpeakingTestData) => void;
  onCancel: () => void;
}

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
  duration?: number;
}

// Mock questions based on part
const INITIAL_QUESTIONS = {
  1: [
    "Hello! Let's start with some questions about yourself. Can you tell me your name and where you're from?",
    "What do you do? Are you working or studying?",
    "Tell me about your hometown. What is it like?",
  ],
  2: [
    "I'm going to give you a topic and I'd like you to talk about it for 1-2 minutes. You have 1 minute to prepare. Here's your topic:\n\n**Describe a person who has influenced you**\n\nYou should say:\n- Who this person is\n- How you know them\n- What they have done to influence you\n- And explain why this person is important to you",
  ],
  3: [
    "Let's talk about the influence people have on each other. How do you think people influence others in modern society?",
    "Do you think social media has changed the way people influence each other?",
  ]
};

export function SpeakingSession({ part, onEnd, onCancel }: SpeakingSessionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isWhisperEnabled, setIsWhisperEnabled] = useState(false);
  const [whisperStatus, setWhisperStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MAX_DURATION = part === 2 ? 4 * 60 : 5 * 60; // 4 min for part 2, 5 min for others
  const MAX_QUESTIONS = part === 2 ? 3 : 12;

  // Initialize session
  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
    };
  }, []);

  // Session timer
  useEffect(() => {
    sessionTimerRef.current = setInterval(() => {
      setSessionTime(prev => {
        const newTime = prev + 1;
        if (newTime >= MAX_DURATION) {
          handleAutoEnd();
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSession = async () => {
    // Check ElevenLabs service availability
    setWhisperStatus('checking');
    try {
      const isElevenLabsAvailable = await elevenLabsService.checkHealth();
      setIsWhisperEnabled(isElevenLabsAvailable);
      setWhisperStatus(isElevenLabsAvailable ? 'available' : 'unavailable');
      
      if (isElevenLabsAvailable) {
        toast.success('✅ ElevenLabs API đã sẵn sàng - Giọng nói AI chất lượng cao');
      } else {
        toast.info('🔄 Sử dụng Browser TTS - Thiết lập ElevenLabs API để có giọng nói tốt hơn');
      }
    } catch (error) {
      setIsWhisperEnabled(false);
      setWhisperStatus('unavailable');
      toast.info('🔄 Sử dụng Browser TTS - Thiết lập ElevenLabs API để có giọng nói tốt hơn');
    }

    // Initialize Speech Recognition
    if (speechRecognitionService.isSpeechRecognitionSupported()) {
      speechRecognitionService.configure({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });

      // Set up event handlers
      speechRecognitionService.onResult((result) => {
        if (result.isFinal) {
          setFinalTranscript(prev => prev + result.transcript + ' ');
        }
        setTranscript(result.transcript);
      });

      speechRecognitionService.onError((error) => {
        console.error('Speech recognition error:', error);
        if (!error.includes('no-speech')) {
          toast.error(error);
        }
      });

      speechRecognitionService.onStart(() => {
        console.log('Speech recognition started');
      });

      speechRecognitionService.onEnd(() => {
        console.log('Speech recognition ended');
      });
    } else {
      toast.error('Trình duyệt không hỗ trợ Web Speech API');
    }

    // Ask first question
    await askInitialQuestion();
  };

  const askInitialQuestion = async () => {
    const questions = INITIAL_QUESTIONS[part];
    if (questions && questions.length > 0) {
      const question = questions[0];
      setMessages(prev => [...prev, {
        role: 'ai',
        content: question,
        timestamp: new Date()
      }]);
      
      // Speak question (optional)
      speakText(question);
    }
  };

  const speakText = async (text: string) => {
    // Check if ElevenLabs is enabled and available first
    if (isWhisperEnabled) {
      try {
        // Try ElevenLabs TTS first for better quality
        const audioBlob = await elevenLabsService.synthesizeSpeech(text, {
          voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam voice - neutral examiner voice
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          },
          model_id: 'eleven_turbo_v2_5' // Free tier model
        });

        // Create audio element and play
        const audioUrl = elevenLabsService.createSpeechPlaybackUrl(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          elevenLabsService.revokeSpeechPlaybackUrl(audioUrl);
        };
        
        await audio.play();
        return; // Success, exit function
      } catch (error) {
        console.warn('ElevenLabs TTS failed, falling back to browser TTS:', error);
      }
    }
    
    // Fallback to browser's built-in speech synthesis
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Optional: Wait for voices to load
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          window.speechSynthesis.speak(utterance);
        }, { once: true });
      } else {
        window.speechSynthesis.speak(utterance);
      }
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  };

  const startRecording = async () => {
    try {
      // Initialize audio recording
      await audioService.initializeRecording({
        sampleRate: 44100,
        channelCount: 1,
        audioBitsPerSecond: 128000
      });

      await audioService.startRecording();
      setIsRecording(true);
      setTranscript('');
      setFinalTranscript('');

      // Start speech recognition
      speechRecognitionService.clearTranscript();
      speechRecognitionService.start();

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Bắt đầu ghi âm và nhận diện giọng nói');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Không thể truy cập microphone');
    }
  };

  const pauseRecording = () => {
    try {
      audioService.pauseRecording();
      speechRecognitionService.stop();
      setIsPaused(true);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      toast.info('Tạm dừng ghi âm');
    } catch (error) {
      console.error('Error pausing recording:', error);
      toast.error('Lỗi khi tạm dừng ghi âm');
    }
  };

  const resumeRecording = () => {
    try {
      audioService.resumeRecording();
      speechRecognitionService.start();
      setIsPaused(false);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.info('Tiếp tục ghi âm');
    } catch (error) {
      console.error('Error resuming recording:', error);
      toast.error('Lỗi khi tiếp tục ghi âm');
    }
  };

  const handleStopRecording = async () => {
    setIsProcessing(true);
    
    try {
      // Stop audio recording
      const audioResult = await audioService.stopRecording();
      setCurrentAudioBlob(audioResult.blob);
      
      // Stop speech recognition
      speechRecognitionService.stop();
      
      const duration = recordingTime;
      let finalTranscriptText = finalTranscript.trim() || transcript.trim();
      
      // Use comprehensive STT service
      try {
        toast.info('🎙️ Đang xử lý giọng nói...', { duration: 2000 });
        
        const sttResult = await speechToTextService.transcribe(audioResult.blob, {
          language: 'en',
          preferElevenLabs: isWhisperEnabled,
          hybridMode: isWhisperEnabled && audioResult.blob.size > 5000, // Use hybrid for longer audio
          minAudioSize: 1000
        });
        
        if (sttResult.text && sttResult.text.trim().length > 0) {
          finalTranscriptText = sttResult.text.trim();
          
          // Get quality assessment
          const quality = speechToTextService.getTranscriptionQuality(sttResult);
          
          console.log('📝 STT Result:', {
            text: finalTranscriptText,
            method: sttResult.method,
            quality: quality.level,
            factors: quality.factors
          });
          
          // Show appropriate success message based on method
          const methodEmoji = {
            elevenlabs: '🤖',
            hybrid: '🔄', 
            webspeech: '🌐'
          };
          
          const qualityEmoji = {
            excellent: '⭐',
            good: '✅',
            fair: '👍',
            poor: '⚠️'
          };
          
          toast.success(
            `${methodEmoji[sttResult.method]} ${qualityEmoji[quality.level]} Transcription hoàn thành (${quality.level})`,
            { duration: 3000 }
          );
        } else {
          console.warn('STT returned empty text, using fallback');
          finalTranscriptText = finalTranscript.trim() || transcript.trim() || "No speech detected";
          toast.warning('� Không phát hiện được giọng nói rõ ràng');
        }
      } catch (sttError) {
        console.error('STT service failed:', sttError);
        finalTranscriptText = finalTranscript.trim() || transcript.trim() || "Speech processing failed";
        toast.error('❌ Lỗi xử lý giọng nói, sử dụng kết quả thô');
      }
      
      if (!finalTranscriptText) {
        finalTranscriptText = "No speech detected";
      }
      
      // Add user message
      setMessages(prev => [...prev, {
        role: 'user',
        content: finalTranscriptText,
        timestamp: new Date(),
        duration
      }]);

      setRecordingTime(0);
      setIsRecording(false);
      setIsPaused(false);
      
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

      // Generate next question using Gemini AI
      await generateNextQuestion(finalTranscriptText);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Lỗi khi dừng ghi âm');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateNextQuestion = async (previousAnswer: string) => {
    setIsProcessing(true);
    
    try {
      const userAnswerCount = messages.filter(m => m.role === 'user').length + 1;
      
      // Check if we should end the session
      if (userAnswerCount >= MAX_QUESTIONS) {
        handleAutoEnd();
        return;
      }

      // Build context for Gemini
      const context: SpeakingContext = {
        part,
        previousQuestions: messages.filter(m => m.role === 'ai').map(m => m.content),
        userAnswers: [...messages.filter(m => m.role === 'user').map(m => m.content), previousAnswer],
        sessionDuration: sessionTime,
        questionCount: userAnswerCount
      };

      // Generate next question using Gemini API
      let nextQuestion = '';
      try {
        nextQuestion = await geminiService.generateNextQuestion(context, {
          difficulty: part === 1 ? 'easy' : part === 2 ? 'medium' : 'hard',
          followUpStyle: part === 3 ? 'analytical' : 'direct'
        });
      } catch (geminiError) {
        console.error('Gemini API failed, using fallback:', geminiError);
        // Fallback to static questions
        nextQuestion = getFallbackQuestion(previousAnswer);
      }

      // Add AI message
      setMessages(prev => [...prev, {
        role: 'ai',
        content: nextQuestion,
        timestamp: new Date()
      }]);

      setCurrentQuestion(prev => prev + 1);
      speakText(nextQuestion);
      
    } catch (error) {
      console.error('Error generating next question:', error);
      toast.error('Lỗi khi tạo câu hỏi tiếp theo');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFallbackQuestion = (previousAnswer: string): string => {
    const fallbacks = {
      1: [
        "That's interesting! Can you tell me more about that?",
        "How long have you been doing that?",
        "What do you enjoy most about it?",
        "Do you think you'll continue doing this in the future?",
        "How has this changed over the years?",
      ],
      2: [
        "Thank you. Now I'd like to ask you some questions related to what you just said.",
      ],
      3: [
        "What do you think are the main advantages and disadvantages of this?",
        "How do you think this will change in the future?",
        "Do you think this is the same in all countries?",
        "What role do you think technology plays in this?",
      ]
    };

    const questions = fallbacks[part];
    return questions[Math.floor(Math.random() * questions.length)];
  };

  const handleAutoEnd = () => {
    setShowEndDialog(true);
  };

  const handleConfirmEnd = () => {
    const testData: SpeakingTestData = {
      part,
      questions: messages.filter(m => m.role === 'ai').map(m => m.content),
      userAnswers: messages
        .filter(m => m.role === 'user')
        .map((m, idx) => ({
          question: messages.filter(msg => msg.role === 'ai')[idx]?.content || '',
          transcript: m.content,
          duration: m.duration || 0
        })),
      startTime: new Date(Date.now() - sessionTime * 1000),
      endTime: new Date(),
      totalDuration: sessionTime
    };

    cleanup();
    onEnd(testData);
  };

  const cleanup = () => {
    // Stop audio service
    audioService.cleanup();
    
    // Stop speech recognition
    speechRecognitionService.stop();

    // Clear timers
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    // Cancel speech synthesis
    window.speechSynthesis.cancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAudioQualityInfo = (blob: Blob | null) => {
    if (!blob) return null;
    
    const sizeKB = Math.round(blob.size / 1024);
    const quality = sizeKB > 100 ? 'Excellent' : sizeKB > 50 ? 'Good' : sizeKB > 20 ? 'Fair' : 'Low';
    const color = sizeKB > 100 ? 'text-green-600' : sizeKB > 50 ? 'text-primary' : sizeKB > 20 ? 'text-yellow-600' : 'text-red-600';
    
    return { sizeKB, quality, color };
  };

  const progressPercentage = (sessionTime / MAX_DURATION) * 100;
  const questionProgress = (messages.filter(m => m.role === 'user').length / MAX_QUESTIONS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Speaking Test - Part {part}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {part === 1 && 'Introduction & Interview'}
                  {part === 2 && 'Long Turn (Topic Card)'}
                  {part === 3 && 'Discussion'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-base px-4 py-2">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatTime(sessionTime)}
                </Badge>
                <Badge 
                  variant={whisperStatus === 'available' ? 'default' : 'secondary'} 
                  className="text-sm px-3 py-1"
                >
                  {whisperStatus === 'checking' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {whisperStatus === 'available' && <Wifi className="h-3 w-3 mr-1" />}
                  {whisperStatus === 'unavailable' && <WifiOff className="h-3 w-3 mr-1" />}
                  {whisperStatus === 'checking' ? 'Checking...' : 
                   whisperStatus === 'available' ? 'ElevenLabs' : 'Web Speech'}
                </Badge>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowEndDialog(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Kết thúc bài thi
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Progress bars */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Thời gian</span>
                <span className={progressPercentage > 80 ? 'text-orange-600 font-semibold' : ''}>
                  {formatTime(sessionTime)} / {formatTime(MAX_DURATION)}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Câu hỏi</span>
                <span>
                  {messages.filter(m => m.role === 'user').length} / {MAX_QUESTIONS}
                </span>
              </div>
              <Progress value={questionProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Conversation */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.role === 'ai' ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                      <span className="text-xs opacity-75">
                        {message.role === 'ai' ? 'AI Examiner' : 'You'}
                        {message.duration && ` • ${message.duration}s`}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI đang xử lý...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Recording Controls */}
        <Card className="border-2 border-primary/30 dark:border-primary/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Live Transcript */}
              {isRecording && (
                <div className="bg-primary/10 dark:bg-primary/10 p-4 rounded-lg border border-primary/30 dark:border-primary/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Live Speech Recognition</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(recordingTime)}
                      </Badge>
                      {isWhisperEnabled && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <Wifi className="h-3 w-3 mr-1" />
                          AI STT Ready
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Web Speech API Live Results */}
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          🎙️ Web Speech API (Live)
                        </span>
                        {isRecording && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-red-500">Recording</span>
                          </div>
                        )}
                      </div>
                      
                      {finalTranscript && (
                        <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 p-2 rounded mb-2">
                          <strong>✅ Confirmed:</strong> {finalTranscript}
                        </p>
                      )}
                      
                      <p className="text-sm text-muted-foreground min-h-[2rem]">
                        <strong>⏳ Live:</strong> {transcript || 'Đang nghe... Hãy nói rõ ràng'}
                      </p>
                    </div>

                    {/* ElevenLabs Processing Info */}
                    {isWhisperEnabled && (
                      <div className="bg-gradient-to-r from-secondary/10 to-primary/10 dark:from-secondary/20 dark:to-primary/20 p-3 rounded-lg border border-secondary/30 dark:border-secondary/50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-secondary dark:text-secondary/80">
                            🤖 ElevenLabs AI Enhancement
                          </span>
                        </div>
                        <p className="text-xs text-secondary dark:text-secondary/80">
                          Sau khi dứt lời, AI sẽ cải thiện độ chính xác transcription
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Control Buttons - Always visible */}
              <div className="space-y-4">
                {/* Current Question Indicator */}
                {messages.length > 0 && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-sm px-4 py-2">
                      Câu hỏi {Math.ceil(messages.filter(m => m.role === 'ai').length)} / {MAX_QUESTIONS}
                    </Badge>
                  </div>
                )}

                {/* Recording Controls */}
                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className={`px-8 py-6 font-semibold ${
                        isProcessing || messages.length === 0
                      }`}
                      disabled={isProcessing || messages.length === 0}
                    >
                      <Mic className="h-6 w-6 mr-2" />
                      {messages.length === 0 ? 'Chờ câu hỏi...' : 'Bắt đầu trả lời'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={isPaused ? resumeRecording : pauseRecording}
                        size="lg"
                        variant="outline"
                        className="px-8 py-6 border-2"
                      >
                        {isPaused ? (
                          <>
                            <Play className="h-6 w-6 mr-2" />
                            Tiếp tục
                          </>
                        ) : (
                          <>
                            <Pause className="h-6 w-6 mr-2" />
                            Tạm dừng
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={handleStopRecording}
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-6 shadow-lg"
                        disabled={isProcessing}
                      >
                        <Send className="h-6 w-6 mr-2" />
                        Hoàn thành câu trả lời
                      </Button>
                    </>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-center gap-2">
                  {!isRecording && messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const lastAiMessage = messages.filter(m => m.role === 'ai').pop();
                        if (lastAiMessage) {
                          speakText(lastAiMessage.content);
                        }
                      }}
                      className="text-sm"
                    >
                      <Volume2 className="h-4 w-4 mr-1" />
                      Nghe lại câu hỏi
                    </Button>
                  )}
                </div>
              </div>

              {/* Instructions & Tips */}
              {!isRecording && (
                <div className="space-y-3">
                  {/* Instructions */}
                  {messages.length === 0 ? (
                    <div className="bg-primary/10 dark:bg-primary/10 p-4 rounded-lg border border-primary/30 dark:border-primary/30">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">Chờ examiner đặt câu hỏi</span>
                      </div>
                      <p className="text-sm text-primary dark:text-primary/80">
                        AI examiner sẽ đặt câu hỏi cho bạn. Sau đó bạn có thể nhấn nút ghi âm để trả lời.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">Sẵn sàng ghi âm câu trả lời</span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Nhấn <strong>"Bắt đầu trả lời"</strong> để ghi âm câu trả lời của bạn.
                      </p>
                    </div>
                  )}

                  {/* Tips */}
                  <div className="flex items-start gap-2 text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">💡 Mẹo khi trả lời:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Nói rõ ràng và với tốc độ vừa phải</li>
                        <li>• Phát triển câu trả lời với ví dụ cụ thể</li>
                        <li>• Sử dụng các từ nối để câu trả lời mạch lạc hơn</li>
                        <li>• Có thể tạm dừng để suy nghĩ rồi tiếp tục</li>
                        {isWhisperEnabled && (
                          <li>• 🤖 AI sẽ cải thiện độ chính xác transcription</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Status */}
              {isProcessing && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                        {isWhisperEnabled ? '🤖 AI Processing Pipeline' : '🔄 Processing Audio'}
                      </div>
                      <div className="text-xs text-yellow-600 dark:text-yellow-400">
                        {isWhisperEnabled ? (
                          <>
                            <span className="inline-block mr-3">📝 ElevenLabs Transcription</span>
                            <span className="inline-block">🧠 Gemini Question Generation</span>
                          </>
                        ) : (
                          'Đang xử lý với Web APIs...'
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Animation */}
                  <div className="mt-3 w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-1">
                    <div className="bg-yellow-500 h-1 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* End Session Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <StopCircle className="h-5 w-5 text-red-600" />
              Kết thúc bài thi Speaking?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn kết thúc bài thi? Điều này sẽ kết thúc toàn bộ phiên luyện tập và chuyển đến trang kết quả.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            {/* Current Session Stats */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/10 dark:to-secondary/10 p-4 rounded-lg border">
              <h4 className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">📊 Thống kê phiên thi:</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Thời gian:</span>
                  <span className="font-semibold text-primary">{formatTime(sessionTime)} / {formatTime(MAX_DURATION)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Câu trả lời:</span>
                  <span className="font-semibold text-green-600">{messages.filter(m => m.role === 'user').length} / {MAX_QUESTIONS}</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            {messages.filter(m => m.role === 'user').length === 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    Bạn chưa trả lời câu hỏi nào!
                  </span>
                </div>
              </div>
            )}

            {/* What happens next */}
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 Sau khi kết thúc, bạn sẽ xem được kết quả chi tiết với phân tích AI về bài nói của mình.
              </p>
            </div>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="flex-1">
              ← Tiếp tục luyện tập
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmEnd}
              className="bg-red-600 hover:bg-red-700 flex-1"
            >
              🏁 Kết thúc và xem kết quả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
