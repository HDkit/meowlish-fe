import { Question } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

export const questions: Question[] = [
	// Leaf section s1-1
	{
		id: 'q1',
		lastEditedBy: 'u1',
		sectionId: 's1-1',
		type: 'multiple-choice',
		content: 'What is the main idea of the passage?',
		options: ['Option A', 'Option B', 'Option C', 'Option D'],
		correctAnswer: ['Option C'],
		points: 5,
		tagIds: ['q-t1', 'q-t3'], // Part 1 & Part 2
	},
	{
		id: 'q2',
		lastEditedBy: 'u1',
		sectionId: 's1-1',
		type: 'fill-blank',
		content: 'The capital of France is ____.',
		points: 3,
		tagIds: ['q-t2', 'q-t5'], // Part 1 & Part 2
	},
	{
		id: 'q5',
		lastEditedBy: 'u1',
		sectionId: 's1-1',
		type: 'speaking',
		content: 'Describe a memorable holiday experience.',
		points: 8,
		tagIds: ['q-t1'], // Part 1
	},
	{
		id: 'q7',
		lastEditedBy: 'u1',
		sectionId: 's1-1',
		type: 'multiple-choice',
		content: 'Choose the correct past tense of "run".',
		options: ['run', 'ran', 'runned', 'running'],
		correctAnswer: ['ran'],
		points: 2,
		tagIds: ['q-t38', 'q-t43'], // Part 5 Grammar + Thì
	},
	{
		id: 'q8',
		lastEditedBy: 'u1',
		sectionId: 's1-1',
		type: 'fill-blank',
		content: 'She ___ playing tennis every Sunday.',
		points: 3,
		tagIds: ['q-t43'], // Part 5 Grammar + Thì
	},

	// Leaf section s1-2
	{
		id: 'q3',
		lastEditedBy: 'u2',
		sectionId: 's1-2',
		type: 'essay',
		content: 'Explain your opinion on remote work benefits.',
		points: 10,
		tagIds: ['q-t14', 'q-t15'], // Part 3
	},
	{
		id: 'q4',
		lastEditedBy: 'u2',
		sectionId: 's1-2',
		type: 'multiple-choice',
		content: 'Which answer best completes the sentence: "She ___ to the store yesterday."',
		options: ['go', 'went', 'gone', 'going'],
		correctAnswer: ['went'],
		points: 2,
		tagIds: ['q-t38', 'q-t43'], // Part 5 Grammar + Thì
	},
	{
		id: 'q6',
		lastEditedBy: 'u2',
		sectionId: 's1-2',
		type: 'fill-blank',
		content: 'Water freezes at ____ degrees Celsius.',
		points: 3,
		tagIds: ['q-t39', 'q-t40'], // Part 5 Vocabulary + Danh từ
	},
	{
		id: 'q9',
		lastEditedBy: 'u2',
		sectionId: 's1-2',
		type: 'speaking',
		content: 'Describe a situation where you helped someone at work.',
		points: 8,
		tagIds: ['q-t19', 'q-t21'], // Part 3 Company topics
	},
	{
		id: 'q10',
		lastEditedBy: 'u1',
		sectionId: 's1-2',
		type: 'multiple-choice',
		content: 'Select the correct form: "He ___ already left when I arrived."',
		options: ['has', 'have', 'had', 'having'],
		correctAnswer: ['had'],
		points: 3,
		tagIds: ['q-t43', 'q-t47'], // Thì + Phân từ
	},
];

const questionsSlice = createGenericSlice<Question>('questions', questions);

export const {
	addItem: addQuestion,
	updateItem: updateQuestion,
	removeItem: removeQuestion,
	setList: setQuestions,
} = questionsSlice.actions;
export default questionsSlice.reducer;
