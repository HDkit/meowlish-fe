import { FlashCard } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const flashcardsSlice = createGenericSlice<FlashCard>('flashcards', []);

export const {
	addItem: addFlashCard,
	updateItem: updateFlashCard,
	removeItem: removeFlashCard,
	setList: setFlashCards,
} = flashcardsSlice.actions;
export default flashcardsSlice.reducer;
