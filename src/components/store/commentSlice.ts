import { Comment } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const comments: Comment[] = [];

const commentsSlice = createGenericSlice<Comment>('comments', comments);

export const {
	addItem: addComment,
	updateItem: updateComment,
	removeItem: removeComment,
	setList: setComments,
} = commentsSlice.actions;
export default commentsSlice.reducer;
