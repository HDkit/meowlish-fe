import { FlashCard } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const flashcards: FlashCard[] = [
	{ id: 'f1', userId: 'u1', content: 'Vocabulary: Aberration', notes: 'Means deviation from normal', tagId: 't1' },
];

const flashcardsSlice = createGenericSlice<FlashCard>('flashcards', flashcards);

export const {
	addItem: addFlashCard,
	updateItem: updateFlashCard,
	removeItem: removeFlashCard,
	setList: setFlashCards,
} = flashcardsSlice.actions;
export default flashcardsSlice.reducer;
