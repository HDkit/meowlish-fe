import { Comment, Difficulty } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const comments: Comment[] = [
	{
		id: 'c1',
		userId: 'u1',
		examId: 'e1',
		content: 'This exam was challenging!',
		examRating: Difficulty.Intermediate,
	},
];

const commentsSlice = createGenericSlice<Comment>('comments', comments);

export const {
	addItem: addComment,
	updateItem: updateComment,
	removeItem: removeComment,
	setList: setComments,
} = commentsSlice.actions;
export default commentsSlice.reducer;
