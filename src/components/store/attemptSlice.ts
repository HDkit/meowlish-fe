import { Attempt } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const attempts: Attempt[] = [];

const attemptsSlice = createGenericSlice<Attempt>('attempts', attempts);

export const {
	addItem: addAttempt,
	updateItem: updateAttempt,
	removeItem: removeAttempt,
	setList: setAttempts,
} = attemptsSlice.actions;
export default attemptsSlice.reducer;
