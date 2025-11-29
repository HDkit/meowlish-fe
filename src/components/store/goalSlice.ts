import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Goal {
	id: string;
	label: 'IELTS Score' | 'TOEIC Score';
	target: number;
}

interface GoalsState {
	list: Goal[];
}

const initialState: GoalsState = {
	list: [
		{ id: 'ielts', label: 'IELTS Score', target: 7 },
		{ id: 'toeic', label: 'TOEIC Score', target: 900 },
	],
};

export const goalsSlice = createSlice({
	name: 'goals',
	initialState,
	reducers: {
		addGoal: (state, action: PayloadAction<Goal>) => {
			state.list.push(action.payload);
		},
		updateGoal: (state, action: PayloadAction<Goal>) => {
			const index = state.list.findIndex((g) => g.id === action.payload.id);
			if (index !== -1) state.list[index] = action.payload;
		},
		removeGoal: (state, action: PayloadAction<string>) => {
			state.list = state.list.filter((g) => g.id !== action.payload);
		},
	},
});

export const { addGoal, updateGoal, removeGoal } = goalsSlice.actions;
export default goalsSlice.reducer;
