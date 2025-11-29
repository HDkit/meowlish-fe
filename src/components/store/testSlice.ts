// store/testSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TestType = 'ielts' | 'toeic';
export type Skill = 'reading' | 'listening' | 'writing' | 'speaking';

export interface TestOption {
	id: string;
	title: string;
	description: string;
	duration: number; // in minutes
	questions: number;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	skill: Skill;
	testType: TestType;
	popularity: number; // 0-100
	averageScore: number; // e.g., 6.5 for IELTS or 750 for TOEIC
}

// Your mock tests
const mockTests: TestOption[] = [
	{
		id: 'ielts-reading-1',
		title: 'IELTS Reading - Academic',
		description: 'Đọc hiểu học thuật với 3 đoạn văn dài và 40 câu hỏi',
		duration: 60,
		questions: 40,
		difficulty: 'intermediate',
		skill: 'reading',
		testType: 'ielts',
		popularity: 85,
		averageScore: 6.5,
	},
	{
		id: 'ielts-listening-1',
		title: 'IELTS Listening - Full Test',
		description: '4 phần nghe với các tình huống đa dạng',
		duration: 40,
		questions: 40,
		difficulty: 'intermediate',
		skill: 'listening',
		testType: 'ielts',
		popularity: 92,
		averageScore: 6.8,
	},
	{
		id: 'ielts-writing-1',
		title: 'IELTS Writing - Task 1 & 2',
		description: 'Viết báo cáo (Task 1) và bài luận (Task 2)',
		duration: 60,
		questions: 2,
		difficulty: 'advanced',
		skill: 'writing',
		testType: 'ielts',
		popularity: 78,
		averageScore: 6.2,
	},
	{
		id: 'ielts-speaking-1',
		title: 'IELTS Speaking - Full Test',
		description: '3 phần thi nói: giới thiệu, thuyết trình và thảo luận',
		duration: 15,
		questions: 3,
		difficulty: 'intermediate',
		skill: 'speaking',
		testType: 'ielts',
		popularity: 88,
		averageScore: 6.4,
	},
	{
		id: 'toeic-reading-1',
		title: 'TOEIC Reading - Business Context',
		description: 'Đọc hiểu trong môi trường kinh doanh',
		duration: 75,
		questions: 100,
		difficulty: 'intermediate',
		skill: 'reading',
		testType: 'toeic',
		popularity: 76,
		averageScore: 750,
	},
	{
		id: 'toeic-listening-1',
		title: 'TOEIC Listening - Workplace',
		description: 'Nghe hiểu các tình huống công việc',
		duration: 45,
		questions: 100,
		difficulty: 'intermediate',
		skill: 'listening',
		testType: 'toeic',
		popularity: 82,
		averageScore: 780,
	},
];

interface TestState {
	tests: TestOption[];
}

const initialState: TestState = {
	tests: mockTests,
};

const testSlice = createSlice({
	name: 'tests',
	initialState,
	reducers: {
		setTests(state, action: PayloadAction<TestOption[]>) {
			state.tests = action.payload;
		},
		addTest(state, action: PayloadAction<TestOption>) {
			state.tests.push(action.payload);
		},
		updateTest(state, action: PayloadAction<{ id: string; data: Partial<TestOption> }>) {
			const index = state.tests.findIndex((t) => t.id === action.payload.id);
			if (index !== -1) {
				state.tests[index] = { ...state.tests[index], ...action.payload.data };
			}
		},
		removeTest(state, action: PayloadAction<string>) {
			state.tests = state.tests.filter((t) => t.id !== action.payload);
		},
	},
});

export const { setTests, addTest, updateTest, removeTest } = testSlice.actions;

export default testSlice.reducer;
