import { Difficulty, Exam, ExamStatus, Skill, TestType } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const exams: Exam[] = [
	{
		id: 'e1',
		createdBy: 'u1',
		status: ExamStatus.Approved,
		title: 'IELTS Reading Practice',
		description: 'Practice test for IELTS Reading section',
		duration: 60,
		difficulty: Difficulty.Intermediate,
		skill: Skill.Reading,
		testType: TestType.IELTS,
		tagIds: ['t1'],
	},
	{
		id: 'e2',
		createdBy: 'u2',
		status: ExamStatus.Approved,
		title: 'TOEIC Listening Test',
		description: 'Listen and choose the correct answer',
		duration: 45,
		difficulty: Difficulty.Beginner,
		skill: Skill.Listening,
		testType: TestType.TOEIC,
		tagIds: ['t2'],
	},
	{
		id: 'e3',
		createdBy: 'u1',
		status: ExamStatus.Pending,
		title: 'IELTS Writing Task 1',
		description: 'Task 1 practice for IELTS writing section',
		duration: 40,
		difficulty: Difficulty.Intermediate,
		skill: Skill.Writing,
		testType: TestType.IELTS,
		tagIds: ['t1'],
	},
	{
		id: 'e4',
		createdBy: 'u2',
		status: ExamStatus.Rejected,
		title: 'TOEIC Reading Comprehension',
		description: 'Reading comprehension practice for TOEIC',
		duration: 50,
		difficulty: Difficulty.Advanced,
		skill: Skill.Reading,
		testType: TestType.TOEIC,
		tagIds: ['t2'],
	},
	{
		id: 'e5',
		createdBy: 'u1',
		status: ExamStatus.Rejected,
		title: 'IELTS Speaking Mock Exam',
		description: 'Speaking practice with sample prompts',
		duration: 20,
		difficulty: Difficulty.Intermediate,
		skill: Skill.Speaking,
		testType: TestType.IELTS,
		tagIds: ['t1'],
	},
	{
		id: 'e6',
		createdBy: 'u2',
		status: ExamStatus.Pending,
		title: 'TOEIC Listening Advanced',
		description: 'Advanced listening test for TOEIC',
		duration: 60,
		difficulty: Difficulty.Advanced,
		skill: Skill.Listening,
		testType: TestType.TOEIC,
		tagIds: ['t2'],
	},
];

const examsSlice = createGenericSlice<Exam>('exams', exams);

export const {
	addItem: addExam,
	updateItem: updateExam,
	removeItem: removeExam,
	setList: setExams,
} = examsSlice.actions;
export default examsSlice.reducer;
