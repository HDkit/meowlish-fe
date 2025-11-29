import { Attempt } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const attempts: Attempt[] = [
	{
		id: 'a1',
		userId: 'u1',
		examId: 'e1',
		startTime: new Date(),
		timeLeft: 3600,
		isPaused: false,
		score: 85,
		choices: [
			{ questionId: 'q1', answerIdx: 'Option C' },
			{ questionId: 'q2', answerIdx: 'Paris' },
		],
	},
];

const attemptsSlice = createGenericSlice<Attempt>('attempts', attempts);

export const {
	addItem: addAttempt,
	updateItem: updateAttempt,
	removeItem: removeAttempt,
	setList: setAttempts,
} = attemptsSlice.actions;
export default attemptsSlice.reducer;
