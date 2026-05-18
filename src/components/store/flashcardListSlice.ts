import { FlashcardList } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const flashcardListsSlice = createGenericSlice<FlashcardList>('flashcardLists', []);

export const {
	addItem: addFlashcardList,
	updateItem: updateFlashcardList,
	removeItem: removeFlashcardList,
	setList: setFlashcardLists,
} = flashcardListsSlice.actions;
export default flashcardListsSlice.reducer;
