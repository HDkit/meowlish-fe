import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface ChatResponse {
  id: string;
  uid: string;
  message: string;
  createdAt: string;
}

export interface GetChatLogResponse {
  chats: ChatResponse[];
  nextCursor: string;
  prevCursor: string;
}

export class ChatMessageService {
  public static getChatLog(
    roomId: string,
    uid?: string,
    cursor?: string,
    limit?: number,
  ): CancelablePromise<GetChatLogResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/rooms/{roomId}/logs',
      path: { roomId },
      query: { uid, cursor, limit },
    });
  }
}
