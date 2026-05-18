import { ChatRoom } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const chatRoomsSlice = createGenericSlice<ChatRoom>('chatRooms', []);

export const {
	addItem: addChatRoom,
	updateItem: updateChatRoom,
	removeItem: removeChatRoom,
	setList: setChatRooms,
} = chatRoomsSlice.actions;
export default chatRoomsSlice.reducer;
