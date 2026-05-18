import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface ChatRoomResponse {
  id: string;
  name: string;
  scheduledLiveUrl?: string;
  scheduledDate?: string;
}

export interface ListChatRoomsResponse {
  rooms: ChatRoomResponse[];
  prevCursor: string;
  nextCursor: string;
}

export interface CreateChatRoomPayload {
  name: string;
}

export interface UpdateRoomSchedulePayload {
  url?: string;
  time?: string;
  setUrlNull?: boolean;
  setTimeNull?: boolean;
}

export class ChatRoomService {
  public static listRooms(
    cursor?: string,
    limit?: number,
  ): CancelablePromise<ListChatRoomsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/rooms',
      query: { cursor, limit },
    });
  }

  public static createRoom(
    payload: CreateChatRoomPayload,
  ): CancelablePromise<ChatRoomResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/rooms',
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static deleteRoom(roomId: string): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/rooms/{roomId}',
      path: { roomId },
    });
  }

  public static updateSchedule(
    roomId: string,
    payload: UpdateRoomSchedulePayload,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/v1/rooms/{roomId}/schedule',
      path: { roomId },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static banUser(
    roomId: string,
    uid: string,
    reason?: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/rooms/{roomId}/ban',
      path: { roomId },
      body: { uid, reason },
      mediaType: 'application/json',
    });
  }

  public static unbanUser(
    roomId: string,
    uid: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/rooms/{roomId}/ban/{uid}',
      path: { roomId, uid },
    });
  }
}
