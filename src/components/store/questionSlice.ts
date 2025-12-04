import { Question } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

export const questions: Question[] = [
	// Leaf section s1-1
	{
		id: 'q1',
		lastEditedBy: 'u1',
		sectionId: 's1-1',
		type: 'fill-blank',
		content: 'The capital of France is ____.',
		correctAnswer: ['Paris'],
		points: 3,
		tagIds: ['q-t2', 'q-t5'], // Part 1 & Part 2,
		explanation:
			'France’s capital city is Paris, which has been the political and administrative center of the country for centuries. It is where major government institutions are located, including the presidential residence and parliament.',
		aiExplanation:
			"Paris, the capital of France, has served as the nation's political and administrative hub for over a millennium. Historically, it became the central power seat during the medieval period, with the establishment of the monarchy and later, the French Republic. Key government institutions, such as the Élysée Palace (the presidential residence) and the National Assembly, are located in Paris. The city's prominence grew with the French Revolution (1789) and continued through the modern era as the heart of French governance and diplomacy.\n" +
			'Source: Encyclopædia Britannica(2021)',
	},
	{
		id: 'q2',
		lastEditedBy: 'u1',
		sectionId: 's1-1',
		type: 'multiple-choice',
		content: 'What is the main idea of the passage?',
		options: ['Option A', 'Option B', 'Option C', 'Option D'],
		correctAnswer: ['Option C'],
		points: 5,
		tagIds: ['q-t1', 'q-t3'], // Part 1 & Part 2,
		explanation: 'Đây là giải thích câu hỏi',
	},
	{
		id: 'q5',
		lastEditedBy: 'u1',
		sectionId: 's1-1',
		type: 'speaking',
		content: 'Describe a memorable holiday experience.',
		points: 8,
		tagIds: ['q-t1'], // Part 1,
		explanation: 'Đây là giải thích câu hỏi',
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
		explanation: 'Đây là giải thích câu hỏi',
	},
	{
		id: 'q8',
		lastEditedBy: 'u1',
		sectionId: 's1-1',
		type: 'fill-blank',
		content: 'She ___ playing tennis every Sunday.',
		correctAnswer: ['is'],
		points: 3,
		tagIds: ['q-t43'], // Part 5 Grammar + Thì
		explanation: 'Đây là giải thích câu hỏi',
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
		explanation: 'Đây là giải thích câu hỏi',
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
		explanation: 'Đây là giải thích câu hỏi',
	},
	{
		id: 'q6',
		lastEditedBy: 'u2',
		sectionId: 's1-2',
		type: 'fill-blank',
		content: 'Water freezes at ____ degrees Celsius.',
		correctAnswer: ['0'],
		points: 3,
		tagIds: ['q-t39', 'q-t40'], // Part 5 Vocabulary + Danh từ
		explanation: 'Đây là giải thích câu hỏi',
	},
	{
		id: 'q9',
		lastEditedBy: 'u2',
		sectionId: 's1-2',
		type: 'speaking',
		content: 'Describe a situation where you helped someone at work.',
		points: 8,
		tagIds: ['q-t19', 'q-t21'], // Part 3 Company topics
		explanation: 'Đây là giải thích câu hỏi',
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
		explanation: 'Đây là giải thích câu hỏi',
	},
	{
		id: 'q11',
		lastEditedBy: 'u1',
		sectionId: 's1-2',
		type: 'multiple-choice',
		content: 'Select the correct form: "He ___ already left when I arrived."',
		options: ['has', 'have', 'had', 'having'],
		correctAnswer: ['had'],
		points: 3,
		tagIds: ['q-t43', 'q-t47'], // Thì + Phân từ
		explanation: 'Đây là giải thích câu hỏi',
	},

	// --- QUESTIONS CHO EXAM MOCK MỚI e7 (sections s7-1, s7-2) ---
	// s7-1 – Studying abroad
	{
		id: 'q200',
		lastEditedBy: 'u1',
		sectionId: 's7-1',
		type: 'multiple-choice',
		content: 'What is one main reason students choose to study abroad?',
		options: [
			'To avoid learning new languages',
			'To experience a different education system and culture',
			'To stay closer to their families',
			'To reduce their independence',
		],
		correctAnswer: ['To experience a different education system and culture'],
		points: 3,
		tagIds: [],
		explanation: 'Trong đoạn, lý do chính là trải nghiệm hệ thống giáo dục và văn hóa khác.',
	},
	{
		id: 'q201',
		lastEditedBy: 'u1',
		sectionId: 's7-1',
		type: 'fill-blank',
		content: 'Living in another country helps students become more ____.',
		correctAnswer: ['independent'],
		points: 2,
		tagIds: [],
		explanation: 'Đoạn văn nêu rõ: "Living in another country helps them become more independent."',
	},

	// s7-2 – Daily exercise
	{
		id: 'q202',
		lastEditedBy: 'u1',
		sectionId: 's7-2',
		type: 'multiple-choice',
		content: 'According to the passage, how much exercise do experts recommend?',
		options: [
			'10 minutes once a week',
			'30 minutes most days of the week',
			'2 hours every day',
			'Only when you feel tired',
		],
		correctAnswer: ['30 minutes most days of the week'],
		points: 3,
		tagIds: [],
		explanation: 'Đoạn văn nói: "Experts recommend at least 30 minutes of moderate exercise most days of the week."',
	},
	{
		id: 'q203',
		lastEditedBy: 'u1',
		sectionId: 's7-2',
		type: 'fill-blank',
		content: 'Regular exercise is important for maintaining good ____.',
		correctAnswer: ['health'],
		points: 2,
		tagIds: [],
		explanation: 'Câu đầu tiên nêu rõ: "Regular exercise is important for maintaining good health."',
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
