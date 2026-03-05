import { FileAttachment } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

// Empty initial state - files uploaded during runtime
const files: FileAttachment[] = [];

const filesSlice = createGenericSlice<FileAttachment>('files', files);

export const {
	addItem: addFile,
	updateItem: updateFile,
	removeItem: removeFile,
	setList: setFiles,
} = filesSlice.actions;

export default filesSlice.reducer;
