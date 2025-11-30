import { FlashCard } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const flashcards: FlashCard[] = [
	// Flashcards của user u1 trong list fl1 (Từ vựng IELTS)
	{ id: 'f1', userId: 'u1', listId: 'fl1', content: 'Aberration', notes: 'A deviation from what is normal or expected. Example: The sudden change in weather was an aberration.', tagId: 'q-t39' },
	{ id: 'f2', userId: 'u1', listId: 'fl1', content: 'Ambiguous', notes: 'Having more than one possible meaning; unclear. Example: His ambiguous statement confused everyone.', tagId: 'q-t39' },
	
	// Flashcards của user u1 trong list fl2 (Ngữ pháp TOEIC)
	{ id: 'f3', userId: 'u1', listId: 'fl2', content: 'Present Perfect', notes: 'Have/has + past participle. Used for actions that started in the past and continue to the present, or actions completed at an unspecified time.', tagId: 'q-t43' },
	{ id: 'f4', userId: 'u1', listId: 'fl2', content: 'Passive Voice', notes: 'Object + be + past participle. Used when the focus is on the action, not the doer. Example: The cake was baked by Mary.', tagId: 'q-t44' },
	
	// Flashcards của user u2 trong list fl3 (Academic Vocabulary)
	{ id: 'f5', userId: 'u2', listId: 'fl3', content: 'Comprehensive', notes: 'Including everything; complete. Example: We need a comprehensive solution to this problem.', tagId: 'q-t39' },
	{ id: 'f6', userId: 'u2', listId: 'fl3', content: 'Relative Clauses', notes: 'Clauses that give extra information about a noun. Use "who" for people, "which" for things, "where" for places.', tagId: 'q-t38' },
	{ id: 'f7', userId: 'u2', listId: 'fl3', content: 'Conditional Sentences', notes: 'Type 2: If + past simple, would + infinitive. Used for hypothetical situations. Example: If I were rich, I would travel the world.', tagId: 'q-t38' },
	{ id: 'f8', userId: 'u2', listId: 'fl3', content: 'Phrasal Verbs: Look after', notes: 'To take care of someone or something. Example: She looks after her elderly parents.', tagId: 'q-t39' },
];

const flashcardsSlice = createGenericSlice<FlashCard>('flashcards', flashcards);

export const {
	addItem: addFlashCard,
	updateItem: updateFlashCard,
	removeItem: removeFlashCard,
	setList: setFlashCards,
} = flashcardsSlice.actions;
export default flashcardsSlice.reducer;
