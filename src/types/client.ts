export interface MockDbType {
	id: string;
}
export interface User extends MockDbType {
	email: string;
	password: string;
	fullName: string;
	createdAt: number;
}

export interface Goal extends MockDbType {
	userId: string;
	testType: TestType;
	target: number;
	dueDate: number;
}

export enum TestType {
	IELTS = 'ielts',
	TOEIC = 'toeic',
}

export enum Skill {
	Reading = 'reading',
	Listening = 'listening',
	Writing = 'writing',
	Speaking = 'speaking',
}

export enum Difficulty {
	Beginner = 'beginner',
	Intermediate = 'intermediate',
	Advanced = 'advanced',
}

export enum ExamStatus {
	Pending = 'pending',
	Approved = 'approved',
	Rejected = 'rejected',
}
export interface Exam extends MockDbType {
	createdBy: string; //User.id
	status: ExamStatus;
	title: string;
	description: string;
	duration: number; // in minutes
	difficulty: Difficulty;
	skill: Skill;
	testType: TestType;
	tagIds: string[];
}

export interface Section extends MockDbType {
	lastEditedBy: string; //User.id
	parentId: string; //Exam.id or Section.id
	direction: string;
	difficulty: Difficulty;
}

export interface Question extends MockDbType {
	lastEditedBy: string; //User.id
	sectionId: string; //Section.id
	type: 'multiple-choice' | 'fill-blank' | 'essay' | 'speaking';
	content: string;
	options?: string[];
	correctAnswer?: string[];
	points: number;
	tagIds: string[];
}

// handle closing tab
// handle clicking pause/submit buttons
export interface Attempt extends MockDbType {
	userId: string; //User.id
	examId: string; //Exam.id
	startTime: number;
	timeLeft: number; //seconds
	isPaused: boolean;
	score?: number;
	choices: { questionId: string; answerIdx: string }[];
}

export interface Comment extends MockDbType {
	userId: string; //User.id
	examId: string;
	content: string;
	examRating: Difficulty;
}

export interface Reply extends MockDbType {
	userId: string; //User.id
	commentId: string;
	content: string;
}

export interface Report extends MockDbType {
	userId: string; //User.id
	examId: string;
	content: string;
}
export enum TagType {
	Exam = 'exam',
	Question = 'question',
	Flashcard = 'flashcard',
	Blog = 'blog',
}
export interface Tag extends MockDbType {
	name: string;
	parentTagId?: string;
	tagType: TagType;
}

export interface FlashCard extends MockDbType {
	userId: string;
	content: string;
	notes?: string;
	tagId: string;
}

export interface Note extends MockDbType {
	targetId: string; // Exam.id or Question.id
	content: string;
}

export interface Blog extends MockDbType {
	createdBy: string;
	summary: string;
	title: string;
	content: string;
}
