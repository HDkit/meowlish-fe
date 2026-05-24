import { Goal } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const goals: Goal[] = [];

const goalsSlice = createGenericSlice<Goal>('goals', goals);

export const {
	addItem: addGoal,
	updateItem: updateGoal,
	removeItem: removeGoal,
	setList: setGoals,
} = goalsSlice.actions;
export default goalsSlice.reducer;
