'use client';

import { useEffect, useCallback } from 'react';
import { ChatRoomService } from '@/lib/api/services/ChatRoomService';
import { ChatMessageService } from '@/lib/api/services/ChatMessageService';
import type { ChatRoomResponse } from '@/lib/api/services/ChatRoomService';
import type { ChatResponse } from '@/lib/api/services/ChatMessageService';
import { useAppDispatch } from '@/lib/store/hooks';
import { setChatRooms } from '@/components/store/chatRoomSlice';
import { setChatMessages } from '@/components/store/chatMessageSlice';
import { useBackoffPolling } from '@/hooks/useBackoffPolling';
import { useProviderErrorRegister } from './ProviderErrorContext';
import type { ChatRoom, ChatMessage } from '@/types/client';

const POLL_INTERVAL = 30_000;

function mapRoom(r: ChatRoomResponse): ChatRoom {
  return {
    id: r.id,
    name: r.name,
    scheduledLiveUrl: r.scheduledLiveUrl,
    scheduledDate: r.scheduledDate ? new Date(r.scheduledDate).getTime() : undefined,
  };
}

function mapChat(c: ChatResponse, roomId: string): ChatMessage {
  return {
    id: c.id,
    roomId,
    uid: c.uid,
    message: c.message,
    createdAt: new Date(c.createdAt).getTime(),
  };
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { register, unregister } = useProviderErrorRegister();

  const fetchAll = useCallback(async () => {
    const roomsRes = await ChatRoomService.listRooms();
    const roomsData = (roomsRes as any)?.data ?? roomsRes;
    const rooms = roomsData?.rooms ?? [];
    dispatch(setChatRooms(rooms.map(mapRoom)));

    const msgPromises = rooms.map((r: ChatRoomResponse) =>
      ChatMessageService.getChatLog(r.id).catch(() => null),
    );
    const msgResults = await Promise.all(msgPromises);
    const allMessages: ChatMessage[] = [];
    msgResults.forEach((res: any, idx: number) => {
      if (!res) return;
      const msgData = (res as any)?.data ?? res;
      const roomId = rooms[idx].id;
      if (msgData.chats) {
        allMessages.push(...msgData.chats.map((c: ChatResponse) => mapChat(c, roomId)));
      }
    });
    dispatch(setChatMessages(allMessages));
  }, [dispatch]);

  const { error, isRetrying, manualRetry } = useBackoffPolling(fetchAll, POLL_INTERVAL);

  useEffect(() => {
    register('chat', { label: 'Phòng chat', error, isRetrying, manualRetry });
    return () => unregister('chat');
  }, [error, isRetrying, manualRetry, register, unregister]);

  return <>{children}</>;
}
