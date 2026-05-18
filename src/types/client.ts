export interface MockDbType {
	id: string;
}

// Admin & RBAC Types
export interface Role extends MockDbType {
	name: 'learner' | 'mod' | 'staff' | 'head_staff';
	description: string;
}

export interface Permission extends MockDbType {
	roleId: string; // Role.id
	resource: 'exam' | 'user' | 'blog' | 'comment';
	action: 'create' | 'read' | 'update' | 'delete' | 'approve';
}

export interface User extends MockDbType {
	email: string;
	password: string;
	fullName: string;
	roleId: string; // Role.id
	status: 'active' | 'suspended' | 'banned';
	avatarUrl?: string;
	createdAt: number;
	lastLoginAt?: number;
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
	Empty = 'Empty', // Just created, no content
	InDraft = 'InDraft', // Being edited by staff
	NeedsRevision = 'NeedsRevision', // Rejected by head_staff
	Published = 'Published', // Approved, visible to learners
	// Keep old statuses for backward compatibility
	Pending = 'pending',
	Approved = 'approved',
	Rejected = 'rejected',
}
export interface Exam extends MockDbType {
	createdBy: string; //User.id
	creatorId?: string; // Alias for createdBy (for backward compatibility)
	status: ExamStatus;
	title: string;
	description: string;
	sectionId?: string; // Section.id (which section this exam belongs to)
	duration: number; // in minutes
	passScore?: number; // Passing score percentage
	difficulty: Difficulty;
	skill: Skill;
	testType: TestType;
	tagIds: string[];
	// Admin workflow fields
	submittedAt?: number; // When staff submitted for approval
	reviewedBy?: string; // User.id (head_staff)
	reviewedAt?: number;
	rejectionReason?: string;
	createdAt?: number;
	updatedAt?: number;
}

export interface Section extends MockDbType {
	lastEditedBy: string; //User.id
	parentId: string; //Exam.id or Section.id
	title?: string; // Optional section title
	direction?: string;
	difficulty: Difficulty;
	fileUrls?: string[];
	contentType?: string;
}

// Closure Table for Section Hierarchy
export interface SectionClosure extends MockDbType {
	ancestorId: string; // Section.id
	descendantId: string; // Section.id
	depth: number;
}

// File Attachments
export interface FileAttachment extends MockDbType {
	uploadedBy: string; // User.id
	filename: string;
	originalFilename: string;
	url: string; // data URL or blob URL for localStorage
	mimetype: string;
	size: number;
	attachableType: 'question' | 'section' | 'blog';
	attachableId: string;
	createdAt: number;
}

export interface Question extends MockDbType {
	lastEditedBy: string; //User.id
	sectionId: string; //Section.id
	type: 'MCQ' | 'MCQ_MULTI' | 'Fill' | 'FillAny' | 'Writing' | 'multiple-choice' | 'fill-blank' | 'essay' | 'speaking' | 'multiple-correct-answers';
	content: string;
	choices?: { key: string; content?: string }[];
	correctAnswer?: string[];
	points: number;
	tagIds: string[];
	explanation: string;

	// dummy fields exisiting to replace API calls only
	aiExplanation?: string;
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

export enum ReportCategory {
	Bug = 'bug',
	Content = 'content',
	Behavior = 'behavior',
}

export enum ReportStatus {
	Pending = 'pending',
	Reviewing = 'reviewing',
	Resolved = 'resolved',
	Rejected = 'rejected',
}

export interface Report extends MockDbType {
	reportedBy: string;
	type: string;
	title: string;
	description: string;
	targetType?: string;
	targetId?: string;
	status: ReportStatus;
	adminResponse?: string;
	resolvedBy?: string;
	fileIds: string[];
	createdAt: number;
	updatedAt?: number;
}

// Notification types
export enum NotificationType {
	BlogFollow = 'blog_follow',
	ReportResponse = 'report_response',
	System = 'system',
}

export interface Notification extends MockDbType {
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	isRead: boolean;
	linkType?: 'blog' | 'report';
	linkId?: string;
	createdAt: number;
}

// Chat types
export interface ChatRoom extends MockDbType {
	name: string;
	scheduledLiveUrl?: string;
	scheduledDate?: number;
}

export interface ChatMessage extends MockDbType {
	roomId: string;
	uid: string;
	message: string;
	createdAt: number;
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

export interface FlashcardList extends MockDbType {
	authorId: string;
	name: string;
	description?: string;
	isPublic: boolean;
	tags: string[];
	createdAt: number;
	updatedAt?: number;
}

export interface FlashCard extends MockDbType {
	word: string;
	definition: string;
	image?: string;
	partOfSpeech?: string;
	pronunciation?: string;
	examples: string[];
	notes?: string;
	authorId: string;
	tags: string[];
	listId: string;
	createdAt: number;
	updatedAt?: number;
}

export interface Note extends MockDbType {
	targetId: string; // Exam.id or Question.id
	content: string;
}

export enum BlogCategory {
	WebUsage = 'web-usage', // Cách sử dụng web
	LanguageLearning = 'language-learning', // Học ngôn ngữ
	ExamTips = 'exam-tips', // Cách làm bài thi
	StudentReview = 'student-review', // Review của học viên
	StudyAbroad = 'study-abroad', // Du học
}

export interface Blog extends MockDbType {
	authorId: string;
	title: string;
	content: string;
	tags: string[];
	createdAt: number;
	updatedAt?: number;
}
