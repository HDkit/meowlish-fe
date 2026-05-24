import { Exam, ExamStatus } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const exams: Exam[] = [];

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
