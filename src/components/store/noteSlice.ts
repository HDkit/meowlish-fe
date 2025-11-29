import { Note } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const notes: Note[] = [{ id: 'n1', targetId: 'q1', content: 'Focus on main idea keywords' }];

const notesSlice = createGenericSlice<Note>('notes', notes);

export const {
	addItem: addNote,
	updateItem: updateNote,
	removeItem: removeNote,
	setList: setNotes,
} = notesSlice.actions;
export default notesSlice.reducer;
