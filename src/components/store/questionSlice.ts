import { Question } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

export const questions: Question[] = [];

const questionsSlice = createGenericSlice<Question>('questions', questions);

export const {
	addItem: addQuestion,
	updateItem: updateQuestion,
	removeItem: removeQuestion,
	setList: setQuestions,
} = questionsSlice.actions;
export default questionsSlice.reducer;
