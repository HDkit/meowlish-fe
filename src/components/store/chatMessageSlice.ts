import { ChatMessage } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const chatMessagesSlice = createGenericSlice<ChatMessage>('chatMessages', []);

export const {
	addItem: addChatMessage,
	updateItem: updateChatMessage,
	removeItem: removeChatMessage,
	setList: setChatMessages,
} = chatMessagesSlice.actions;
export default chatMessagesSlice.reducer;
