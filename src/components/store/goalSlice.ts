import { Goal, TestType } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const goals: Goal[] = [
	{
		id: 'g1',
		userId: 'u1',
		testType: TestType.IELTS,
		target: 7,
		dueDate: new Date('2025-12-31'),
	},
	{
		id: 'g2',
		userId: 'u2',
		testType: TestType.TOEIC,
		target: 900,
		dueDate: new Date('2025-11-30'),
	},
];

const goalsSlice = createGenericSlice<Goal>('goals', goals);

export const {
	addItem: addGoal,
	updateItem: updateGoal,
	removeItem: removeGoal,
	setList: setGoals,
} = goalsSlice.actions;
export default goalsSlice.reducer;
