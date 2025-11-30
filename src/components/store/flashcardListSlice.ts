import { FlashcardList } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const flashcardLists: FlashcardList[] = [
	{
		id: 'fl1',
		userId: 'u1',
		name: 'Từ vựng IELTS',
		description: 'Danh sách từ vựng quan trọng cho IELTS',
		createdAt: new Date('2025-01-01').getTime(),
	},
	{
		id: 'fl2',
		userId: 'u1',
		name: 'Ngữ pháp TOEIC',
		description: 'Các cấu trúc ngữ pháp thường gặp trong TOEIC',
		createdAt: new Date('2025-01-05').getTime(),
	},
	{
		id: 'fl3',
		userId: 'u2',
		name: 'Academic Vocabulary',
		description: 'Từ vựng học thuật',
		createdAt: new Date('2025-01-10').getTime(),
	},
];

const flashcardListsSlice = createGenericSlice<FlashcardList>('flashcardLists', flashcardLists);

export const {
	addItem: addFlashcardList,
	updateItem: updateFlashcardList,
	removeItem: removeFlashcardList,
	setList: setFlashcardLists,
} = flashcardListsSlice.actions;
export default flashcardListsSlice.reducer;

