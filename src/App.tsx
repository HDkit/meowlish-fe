import { Dashboard } from './components/Dashboard';
// import { TestInterface } from './components/TestInterface';
// import { ResultsView } from './components/ResultsView';
import { ProgressTracker } from './components/ProgressTracker';
import { AuthForm } from './components/AuthForm';
import { TestSelection } from './components/TestSelection';
import { LandingPage } from './components/LandingPage';
import { MainNavbar } from './components/MainNavbar';
import { History } from './components/History';
import { TestsPage } from './components/TestsPage';
import { UserPage } from './components/UserPage';
import { SpeakingTest } from './components/SpeakingTest';
import { Routes, Route } from 'react-router-dom';

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
	return (
		<div className='min-h-screen bg-background'>
			<MainNavbar />

			<main className='container mx-auto px-4 py-6'>
				<Routes>
					<Route path='/' element={<LandingPage />} />
					<Route path='/auth' element={<AuthForm />} />
					{/* <Route path='/dashboard' element={<Dashboard />} />
					<Route path='/tests' element={<TestsPage />} />
					<Route path='/test-selection' element={<TestSelection />} /> */}
					{/* <Route path='/test/:id' element={<TestInterface />} /> */}
					{/* <Route path='/results' element={<ResultsView />} /> */}
					{/* <Route path='/progress' element={<ProgressTracker />} />
					<Route path='/history' element={<History />} />
					<Route path='/user' element={<UserPage />} /> */}

					{/* Edit later, DO NOT DEMO */}
					{/* <Route path='/speaking-test' element={<SpeakingTest />} /> */}
				</Routes>
			</main>
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
					content:
						'Read the passage about climate change and answer: What is the main cause of global warming according to the text?',
					options: ['Natural climate cycles', 'Human activities', 'Solar radiation', 'Ocean currents'],
					correctAnswer: 'Human activities',
					points: 1,
					skill: 'reading',
				},
				{
					id: '2',
					type: 'fill-blank',
					difficulty: 'intermediate',
					content:
						'Complete the sentence: The research shows that renewable energy sources could _____ carbon emissions by 50%.',
					correctAnswer: 'reduce',
					points: 1,
					skill: 'reading',
				}
			);
		} else if (skill === 'listening') {
			questions.push({
				id: '3',
				type: 'multiple-choice',
				difficulty: 'intermediate',
				content: 'Listen to the conversation and answer: Where are the speakers planning to meet?',
				options: ['Library', 'Coffee shop', 'University campus', 'Train station'],
				correctAnswer: 'Coffee shop',
				points: 1,
				skill: 'listening',
			});
		}
	} else if (testType === 'toeic') {
		if (skill === 'reading') {
			questions.push({
				id: '4',
				type: 'multiple-choice',
				difficulty: 'intermediate',
				content: 'What time does the meeting start according to the email?',
				options: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM'],
				correctAnswer: '10:00 AM',
				points: 1,
				skill: 'reading',
			});
		}
	}

	return questions;
}

function calculateResults(session: TestSession) {
	const totalQuestions = session.questions.length;
	const correctAnswers = session.answers.filter((answer) => answer.isCorrect).length;
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
		recommendations: generateRecommendations(accuracy, session.skill),
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
