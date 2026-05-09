import { ChatMessage } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const chatMessages: ChatMessage[] = [
	{ id: 'msg1', roomId: 'room1', userId: 'u1', message: 'Chào mọi người! Ai đang ôn IELTS Writing Task 2 không?', createdAt: Date.now() - 3600000 },
	{ id: 'msg2', roomId: 'room1', userId: 'u2', message: 'Mình đang ôn nè! Bạn ôn topic gì vậy?', createdAt: Date.now() - 3500000 },
	{ id: 'msg3', roomId: 'room1', userId: 'u1', message: 'Mình đang tập viết về Education topic, khá khó 😅', createdAt: Date.now() - 3400000 },
	{ id: 'msg4', roomId: 'room1', userId: 'u3', message: 'Education topic hay đấy! Mình có vài mẫu câu hay, để mình share cho', createdAt: Date.now() - 3300000 },
	{ id: 'msg5', roomId: 'room1', userId: 'u2', message: 'Cảm ơn bạn nhiều! Mình cũng cần tham khảo thêm', createdAt: Date.now() - 3200000 },
	{ id: 'msg6', roomId: 'room2', userId: 'u2', message: 'Có ai làm Part 5 TOEIC hôm nay chưa?', createdAt: Date.now() - 600000 },
	{ id: 'msg7', roomId: 'room2', userId: 'u1', message: 'Mình làm rồi, được 42/50. Cải thiện hơn lần trước!', createdAt: Date.now() - 500000 },
	{ id: 'msg8', roomId: 'room2', userId: 'u2', message: 'Hay quá! Chia sẻ bí quyết đi bạn 🎉', createdAt: Date.now() - 400000 },
	{ id: 'msg9', roomId: 'room3', userId: 'u1', message: 'Good morning everyone! How are you today?', createdAt: Date.now() - 180000 },
	{ id: 'msg10', roomId: 'room3', userId: 'u3', message: "I'm doing great! Just finished my morning coffee ☕", createdAt: Date.now() - 150000 },
	{ id: 'msg11', roomId: 'room3', userId: 'u2', message: "Has anyone watched the latest TED talk about learning?", createdAt: Date.now() - 120000 },
	{ id: 'msg12', roomId: 'room4', userId: 'u3', message: 'Hôm nay mình sẽ review bài writing của các bạn nhé', createdAt: Date.now() - 7200000 },
];

const chatMessagesSlice = createGenericSlice<ChatMessage>('chatMessages', chatMessages);

export const {
	addItem: addChatMessage,
	updateItem: updateChatMessage,
	removeItem: removeChatMessage,
	setList: setChatMessages,
} = chatMessagesSlice.actions;
export default chatMessagesSlice.reducer;
