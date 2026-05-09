import { ChatRoom } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const chatRooms: ChatRoom[] = [
	{
		id: 'room1',
		name: 'IELTS Study Group',
		createdBy: 'u1',
		memberCount: 15,
		lastMessageAt: Date.now() - 60000,
		createdAt: Date.now() - 604800000,
	},
	{
		id: 'room2',
		name: 'TOEIC Practice Room',
		createdBy: 'u2',
		memberCount: 8,
		lastMessageAt: Date.now() - 300000,
		createdAt: Date.now() - 432000000,
	},
	{
		id: 'room3',
		name: 'English Daily Chat',
		createdBy: 'u1',
		scheduledLiveUrl: 'https://meet.google.com/abc-defg-hij',
		scheduledDate: Date.now() + 86400000,
		memberCount: 22,
		lastMessageAt: Date.now() - 120000,
		createdAt: Date.now() - 1209600000,
	},
	{
		id: 'room4',
		name: 'Writing Workshop',
		createdBy: 'u3',
		memberCount: 5,
		lastMessageAt: Date.now() - 7200000,
		createdAt: Date.now() - 259200000,
	},
];

const chatRoomsSlice = createGenericSlice<ChatRoom>('chatRooms', chatRooms);

export const {
	addItem: addChatRoom,
	updateItem: updateChatRoom,
	removeItem: removeChatRoom,
	setList: setChatRooms,
} = chatRoomsSlice.actions;
export default chatRoomsSlice.reducer;
