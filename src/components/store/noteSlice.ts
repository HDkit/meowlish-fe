import { Note } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const notes: Note[] = [];

const notesSlice = createGenericSlice<Note>('notes', notes);

export const {
	addItem: addNote,
	updateItem: updateNote,
	removeItem: removeNote,
	setList: setNotes,
} = notesSlice.actions;
export default notesSlice.reducer;
