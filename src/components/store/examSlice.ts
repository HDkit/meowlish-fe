import { Difficulty, Exam, ExamStatus, Skill, TestType } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const exams: Exam[] = [
	{
		id: 'e1',
		createdBy: 'u1',
		status: ExamStatus.Published, // Đã được duyệt
		title: 'Luyện tập IELTS Reading',
		description: 'Bài thi thực hành phần Đọc hiểu IELTS',
		duration: 60,
		difficulty: Difficulty.Intermediate,
		skill: Skill.Reading,
		testType: TestType.IELTS,
		tagIds: ['t1', 't2'],
		reviewedBy: 'u-head-staff',
		reviewedAt: Date.now() - 86400000, // 1 day ago
		createdAt: Date.now() - 172800000, // 2 days ago
		updatedAt: Date.now() - 86400000,
	},
	{
		id: 'e2',
		createdBy: 'u2',
		status: ExamStatus.Published,
		title: 'Bài thi TOEIC Listening',
		description: 'Nghe và chọn câu trả lời đúng',
		duration: 45,
		difficulty: Difficulty.Beginner,
		skill: Skill.Listening,
		testType: TestType.TOEIC,
		tagIds: ['t2'],
		reviewedBy: 'u-head-staff',
		reviewedAt: Date.now() - 43200000,
		createdAt: Date.now() - 86400000,
		updatedAt: Date.now() - 3600000,
	},
	{
		id: 'e3',
		createdBy: 'u1',
		status: ExamStatus.NeedsRevision, // Bị từ chối
		title: 'IELTS Writing Task 1',
		description: 'Luyện tập Task 1 phần Viết IELTS',
		duration: 40,
		difficulty: Difficulty.Intermediate,
		skill: Skill.Writing,
		testType: TestType.IELTS,
		tagIds: ['t1'],
		reviewedBy: 'u-head-staff',
		reviewedAt: Date.now() - 3600000,
		rejectionReason: 'Câu hỏi không đủ số lượng. Cần ít nhất 10 câu hỏi.',
		createdAt: Date.now() - 172800000,
		updatedAt: Date.now() - 86400000,
	},
	{
		id: 'e4',
		createdBy: 'u2',
		status: ExamStatus.NeedsRevision,
		title: 'Đọc hiểu TOEIC',
		description: 'Luyện tập đọc hiểu cho TOEIC',
		duration: 50,
		difficulty: Difficulty.Advanced,
		skill: Skill.Reading,
		testType: TestType.TOEIC,
		tagIds: ['t2'],
		reviewedBy: 'u-head-staff',
		reviewedAt: Date.now() - 3600000,
		rejectionReason: 'Đề thi cần thêm hướng dẫn và giải thích đáp án cho từng câu hỏi.',
		createdAt: Date.now() - 7200000,
		updatedAt: Date.now() - 7200000,
	},
	{
		id: 'e5',
		createdBy: 'u1',
		status: ExamStatus.NeedsRevision,
		title: 'Thi thử IELTS Speaking',
		description: 'Luyện tập Speaking với các đề mẫu',
		duration: 20,
		difficulty: Difficulty.Intermediate,
		skill: Skill.Speaking,
		testType: TestType.IELTS,
		tagIds: ['t1'],
		reviewedBy: 'u-head-staff',
		reviewedAt: Date.now() - 7200000,
		rejectionReason: 'Đề Speaking cần bổ sung thêm các câu hỏi thực hành và mẫu câu trả lời.',
		createdAt: Date.now() - 259200000,
		updatedAt: Date.now() - 7200000,
	},
	{
		id: 'e6',
		createdBy: 'u2',
		status: ExamStatus.InDraft, // Đang chờ duyệt
		title: 'TOEIC Listening Nâng cao',
		description: 'Bài thi nghe nâng cao cho TOEIC',
		duration: 60,
		difficulty: Difficulty.Advanced,
		skill: Skill.Listening,
		testType: TestType.TOEIC,
		tagIds: ['t2'],
		submittedAt: Date.now() - 3600000, // Submitted 1 hour ago
		createdAt: Date.now() - 7200000,
		updatedAt: Date.now() - 3600000,
	},
	// Exam mock mới để dễ test làm bài
	{
		id: 'e7',
		createdBy: 'u1',
		status: ExamStatus.Published,
		title: 'IELTS Reading – Đề thi thử số 1',
		description: 'Đề thi thử cho phần Đọc hiểu IELTS với hai đoạn văn và nhiều dạng câu hỏi khác nhau.',
		duration: 30,
		difficulty: Difficulty.Beginner,
		skill: Skill.Reading,
		testType: TestType.IELTS,
		tagIds: ['t1'],
		reviewedBy: 'u-head-staff',
		reviewedAt: Date.now() - 86400000,
		createdAt: Date.now() - 172800000,
	},
	// New InDraft exam for testing approval workflow
	{
		id: 'e8',
		createdBy: 'u1',
		status: ExamStatus.InDraft,
		title: 'IELTS Writing Task 2 – Nâng cao',
		description: 'Luyện tập Writing Task 2 với các chủ đề nâng cao và mẫu bài viết tham khảo.',
		duration: 40,
		difficulty: Difficulty.Advanced,
		skill: Skill.Writing,
		testType: TestType.IELTS,
		tagIds: ['t1'],
		submittedAt: Date.now() - 1800000, // Submitted 30 minutes ago
		createdAt: Date.now() - 86400000,
		updatedAt: Date.now() - 1800000,
	},
];

// Use base generic slice
const baseSlice = createGenericSlice<Exam>('exams', exams);

// Extend with custom actions for workflow
const examsSlice = createSlice({
	name: 'exams',
	initialState: baseSlice.getInitialState(),
	reducers: {
		...baseSlice.caseReducers, // Include base CRUD actions
		
		// Submit exam for approval (staff action)
		submitForApproval: (state, action: PayloadAction<string>) => {
			const exam = state.list.find(e => e.id === action.payload);
			if (exam && (exam.status === ExamStatus.Empty || exam.status === ExamStatus.NeedsRevision)) {
				exam.status = ExamStatus.InDraft;
				exam.submittedAt = Date.now();
				exam.updatedAt = Date.now();
			}
		},
		
		// Approve exam (head staff action)
		approveExam: (state, action: PayloadAction<{ examId: string; reviewerId: string }>) => {
			const exam = state.list.find(e => e.id === action.payload.examId);
			if (exam && exam.status === ExamStatus.InDraft) {
				exam.status = ExamStatus.Published;
				exam.reviewedBy = action.payload.reviewerId;
				exam.reviewedAt = Date.now();
				exam.rejectionReason = undefined;
				exam.updatedAt = Date.now();
			}
		},
		
		// Reject exam (head staff action)
		rejectExam: (state, action: PayloadAction<{ examId: string; reviewerId: string; reason: string }>) => {
			const exam = state.list.find(e => e.id === action.payload.examId);
			if (exam && exam.status === ExamStatus.InDraft) {
				exam.status = ExamStatus.NeedsRevision;
				exam.reviewedBy = action.payload.reviewerId;
				exam.reviewedAt = Date.now();
				exam.rejectionReason = action.payload.reason;
				exam.updatedAt = Date.now();
			}
		},
		
		// Revert to draft after fixing issues
		revertToDraft: (state, action: PayloadAction<string>) => {
			const exam = state.list.find(e => e.id === action.payload);
			if (exam && exam.status === ExamStatus.NeedsRevision) {
				exam.status = ExamStatus.InDraft;
				exam.updatedAt = Date.now();
			}
		},
	},
});

export const {
	addItem: addExam,
	updateItem: updateExam,
	removeItem: removeExam,
	setList: setExams,
	submitForApproval,
	approveExam,
	rejectExam,
	revertToDraft,
} = examsSlice.actions;

export default examsSlice.reducer;
