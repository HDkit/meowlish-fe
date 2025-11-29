import { Reply } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const replies: Reply[] = [
	{
		id: 'r1',
		userId: 'u2',
		commentId: 'c1',
		content: 'I agree, very tricky!',
	},
];

const repliesSlice = createGenericSlice<Reply>('replies', replies);

export const {
	addItem: addReply,
	updateItem: updateReply,
	removeItem: removeReply,
	setList: setreplies,
} = repliesSlice.actions;
export default repliesSlice.reducer;
