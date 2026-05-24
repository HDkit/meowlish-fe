import { Reply } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const replies: Reply[] = [];

const repliesSlice = createGenericSlice<Reply>('replies', replies);

export const {
	addItem: addReply,
	updateItem: updateReply,
	removeItem: removeReply,
	setList: setreplies,
} = repliesSlice.actions;
export default repliesSlice.reducer;
