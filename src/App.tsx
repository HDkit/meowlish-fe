import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { TestInterface } from './components/TestInterface';
import { ResultsView } from './components/ResultsView';
import { ProgressTracker } from './components/ProgressTracker';
import { Header } from './components/Header';
import { AuthForm } from './components/AuthForm';
import { TestSelection } from './components/TestSelection';
import { LandingPage } from './components/LandingPage';
import { MainNavbar } from './components/MainNavbar';
import { Profile } from './components/Profile';
import { History } from './components/History';
import { TestsPage } from './components/TestsPage';
import { UserPage } from './components/UserPage';
import { SpeakingTest } from './components/SpeakingTest';

export type TestType = 'ielts' | 'toeic';
export type Skill = 'listening' | 'reading' | 'writing' | 'speaking';

export interface TestSession {
  id: string;
  testType: TestType;
  skill: Skill;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Answer[];
  startTime: Date;
  completed: boolean;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'essay' | 'speaking';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  skill: Skill;
}

export interface Answer {
  questionId: string;
  userAnswer: string;
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
}

export interface UserProgress {
  totalTests: number;
  completedTests: number;
  ieltsScore: number;
  toeicScore: number;
  skillScores: Record<Skill, number>;
  recentSessions: TestSession[];
  studyStreak: number;
  totalStudyTime: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
  progress: UserProgress;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard' | 'test-selection' | 'test' | 'results' | 'progress' | 'profile' | 'history' | 'tests' | 'user'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<TestSession | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const [selectedTestType, setSelectedTestType] = useState<TestType | null>(null);
  const [isSpeakingTest, setIsSpeakingTest] = useState(false);

  const handleAuth = async (data: { email: string; password: string; fullName?: string }) => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful authentication
      const mockUser: User = {
        id: '1',
        email: data.email,
        fullName: data.fullName || 'Người dùng',
        createdAt: new Date(),
        progress: {
          totalTests: 12,
          completedTests: 12,
          ieltsScore: 6.5,
          toeicScore: 750,
          skillScores: {
            reading: 7.0,
            listening: 6.5,
            writing: 6.0,
            speaking: 6.5
          },
          recentSessions: [],
          studyStreak: 7,
          totalStudyTime: 2400
        }
      };
      
      setCurrentUser(mockUser);
      setCurrentView('dashboard');
    } catch (error) {
      setAuthError('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      // Simulate social login API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful social authentication
      const mockUser: User = {
        id: `${provider}-${Date.now()}`,
        email: provider === 'google' ? 'user@gmail.com' : 'user@facebook.com',
        fullName: provider === 'google' ? 'Google User' : 'Facebook User',
        createdAt: new Date(),
        progress: {
          totalTests: 0,
          completedTests: 0,
          ieltsScore: 0,
          toeicScore: 0,
          skillScores: {
            reading: 0,
            listening: 0,
            writing: 0,
            speaking: 0
          },
          recentSessions: [],
          studyStreak: 0,
          totalStudyTime: 0
        }
      };
      
      setCurrentUser(mockUser);
      setCurrentView('dashboard');
    } catch (error) {
      setAuthError(`Đăng nhập bằng ${provider === 'google' ? 'Google' : 'Facebook'} thất bại. Vui lòng thử lại.`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
    setCurrentSession(null);
    setTestResults(null);
  };

  const handleGetStarted = () => {
    setAuthMode('register');
    setCurrentView('auth');
  };

  const handleGoToLogin = () => {
    setAuthMode('login');
    setCurrentView('auth');
  };

  const handleStartTest = (testType: TestType, skill: Skill, testId?: string) => {
    // Check if this is a speaking test
    if (skill === 'speaking') {
      setIsSpeakingTest(true);
      setCurrentView('test');
      setSelectedTestType(testType);
      return;
    }

    // Handle regular tests (reading, listening, writing)
    const session: TestSession = {
      id: testId || `test-${Date.now()}`,
      testType,
      skill,
      questions: generateMockQuestions(testType, skill),
      currentQuestionIndex: 0,
      answers: [],
      startTime: new Date(),
      completed: false
    };
    setCurrentSession(session);
    setIsSpeakingTest(false);
    setCurrentView('test');
  };

  const handleCompleteTest = (session: TestSession) => {
    const results = calculateResults(session);
    setTestResults(results);
    setCurrentSession(null);
    setCurrentView('results');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentSession(null);
    setTestResults(null);
    setIsSpeakingTest(false);
  };

  const handleSpeakingTestComplete = () => {
    setIsSpeakingTest(false);
    setCurrentView('dashboard');
  };

  const handleGoToTestSelection = (testType?: TestType) => {
    setSelectedTestType(testType || null);
    setCurrentView('test-selection');
  };

  const handleNavigateHome = () => {
    setCurrentView('landing');
    setSelectedTestType(null);
  };

  const handleNavigateAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setCurrentView('auth');
  };

  const handleNavigateDashboard = () => {
    if (currentUser) {
      setCurrentView('dashboard');
    }
  };

  const handleNavigateProfile = () => {
    if (currentUser) {
      setCurrentView('user'); // Changed to show UserPage instead of Profile
    }
  };

  const handleNavigateHistory = () => {
    if (currentUser) {
      setCurrentView('history');
    }
  };

  const handleNavigateProgress = () => {
    if (currentUser) {
      setCurrentView('progress');
    }
  };

  const handleNavigateTests = () => {
    setCurrentView('tests'); // Allow guests to view tests page
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Hide navbar during test */}
      {currentView !== 'test' && (
        <MainNavbar
          currentUser={currentUser}
          onNavigateHome={handleNavigateHome}
          onNavigateAuth={handleNavigateAuth}
          onNavigateTestSelection={handleGoToTestSelection}
          onNavigateDashboard={handleNavigateDashboard}
          onNavigateProfile={handleNavigateProfile}
          onNavigateHistory={handleNavigateHistory}
          onNavigateProgress={handleNavigateProgress}
          onNavigateTests={handleNavigateTests}
          onLogout={handleLogout}
        />
      )}

      {/* Landing page */}
      {currentView === 'landing' && (
        <LandingPage
          onGetStarted={handleGetStarted}
          onLogin={handleGoToLogin}
        />
      )}

      {/* Auth view */}
      {currentView === 'auth' && (
        <div className="container mx-auto px-4 py-6">
          <AuthForm
            mode={authMode}
            onSubmit={handleAuth}
            onSocialLogin={handleSocialLogin}
            onToggleMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            loading={authLoading}
            error={authError}
          />
        </div>
      )}

      {/* Main app content for logged in users */}
      {currentView !== 'landing' && currentView !== 'auth' && (
        <main className="container mx-auto px-4 py-6">
          {currentView === 'dashboard' && (
            <Dashboard 
              onStartTest={handleStartTest}
              onGoToTestSelection={handleGoToTestSelection}
              user={currentUser}
            />
          )}

          {currentView === 'test-selection' && (
            <TestSelection 
              onStartTest={handleStartTest}
              userProgress={currentUser?.progress}
              preselectedTestType={selectedTestType}
            />
          )}
          
          {currentView === 'test' && !isSpeakingTest && currentSession && (
            <TestInterface 
              session={currentSession}
              onComplete={handleCompleteTest}
              onUpdateSession={setCurrentSession}
            />
          )}

          {currentView === 'test' && isSpeakingTest && (
            <SpeakingTest />
          )}
          
          {currentView === 'results' && testResults && (
            <ResultsView 
              results={testResults}
              onBackToDashboard={handleBackToDashboard}
              onRetakeTest={() => setCurrentView('test-selection')}
            />
          )}
          
          {currentView === 'progress' && (
            <ProgressTracker />
          )}

          {currentView === 'profile' && currentUser && (
            <Profile 
              user={currentUser}
              onUpdateUser={setCurrentUser}
            />
          )}

          {currentView === 'history' && (
            <History userId={currentUser?.id} />
          )}

          {currentView === 'tests' && (
            <TestsPage 
              onStartTest={handleStartTest}
              preselectedTestType={selectedTestType}
              currentUser={currentUser}
              onRequestLogin={handleGoToLogin}
            />
          )}

          {currentView === 'user' && currentUser && (
            <UserPage 
              user={currentUser}
              onUpdateUser={setCurrentUser}
              onNavigateProfile={handleNavigateProfile}
              onNavigateHistory={handleNavigateHistory}
              onNavigateProgress={handleNavigateProgress}
            />
          )}
        </main>
      )}
    </div>
  );


}

// Mock data generation functions
function generateMockQuestions(testType: TestType, skill: Skill): Question[] {
  const questions: Question[] = [];
  
  if (testType === 'ielts') {
    if (skill === 'reading') {
      questions.push(
        {
          id: '1',
          type: 'multiple-choice',
          difficulty: 'intermediate',
          content: 'Read the passage about climate change and answer: What is the main cause of global warming according to the text?',
          options: ['Natural climate cycles', 'Human activities', 'Solar radiation', 'Ocean currents'],
          correctAnswer: 'Human activities',
          points: 1,
          skill: 'reading'
        },
        {
          id: '2',
          type: 'fill-blank',
          difficulty: 'intermediate',
          content: 'Complete the sentence: The research shows that renewable energy sources could _____ carbon emissions by 50%.',
          correctAnswer: 'reduce',
          points: 1,
          skill: 'reading'
        }
      );
    } else if (skill === 'listening') {
      questions.push(
        {
          id: '3',
          type: 'multiple-choice',
          difficulty: 'intermediate',
          content: 'Listen to the conversation and answer: Where are the speakers planning to meet?',
          options: ['Library', 'Coffee shop', 'University campus', 'Train station'],
          correctAnswer: 'Coffee shop',
          points: 1,
          skill: 'listening'
        }
      );
    }
  } else if (testType === 'toeic') {
    if (skill === 'reading') {
      questions.push(
        {
          id: '4',
          type: 'multiple-choice',
          difficulty: 'intermediate',
          content: 'What time does the meeting start according to the email?',
          options: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM'],
          correctAnswer: '10:00 AM',
          points: 1,
          skill: 'reading'
        }
      );
    }
  }
  
  return questions;
}

function calculateResults(session: TestSession) {
  const totalQuestions = session.questions.length;
  const correctAnswers = session.answers.filter(answer => answer.isCorrect).length;
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  
  let estimatedScore = 0;
  if (session.testType === 'ielts') {
    // IELTS band score calculation (0-9)
    // For reading, typically need about 30-32 out of 40 for band 7
    if (correctAnswers >= 35) estimatedScore = 8.0;
    else if (correctAnswers >= 30) estimatedScore = 7.0;
    else if (correctAnswers >= 23) estimatedScore = 6.0;
    else if (correctAnswers >= 15) estimatedScore = 5.0;
    else if (correctAnswers >= 10) estimatedScore = 4.0;
    else estimatedScore = 3.0;
  } else {
    estimatedScore = Math.round((accuracy / 100) * 990);
  }
  
  return {
    session,
    accuracy,
    estimatedScore,
    correctAnswers,
    totalQuestions,
    recommendations: generateRecommendations(accuracy, session.skill)
  };
}

function generateRecommendations(accuracy: number, skill: Skill): string[] {
  const recommendations = [];
  
  if (accuracy < 60) {
    recommendations.push(`Focus on building foundational ${skill} skills`);
    recommendations.push('Practice daily with easier materials');
    recommendations.push('Review grammar and vocabulary basics');
  } else if (accuracy < 80) {
    recommendations.push(`Good progress in ${skill}! Continue regular practice`);
    recommendations.push('Try more challenging materials');
    recommendations.push('Focus on time management');
  } else {
    recommendations.push(`Excellent ${skill} skills! You're ready for the actual test`);
    recommendations.push('Maintain your level with regular practice');
    recommendations.push('Focus on test strategies and time optimization');
  }
  
  return recommendations;
}