'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ChatRoomService } from '@/lib/api/services/ChatRoomService';
import { ChatMessageService } from '@/lib/api/services/ChatMessageService';
import type { ChatRoomResponse } from '@/lib/api/services/ChatRoomService';
import type { ChatResponse } from '@/lib/api/services/ChatMessageService';
import { useAppDispatch } from '@/lib/store/hooks';
import { setChatRooms } from '@/components/store/chatRoomSlice';
import { setChatMessages } from '@/components/store/chatMessageSlice';
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const roomsRes = await ChatRoomService.listRooms();
      const rooms = roomsRes?.rooms ?? [];
      dispatch(setChatRooms(rooms.map(mapRoom)));

      const msgPromises = rooms.map((r) =>
        ChatMessageService.getChatLog(r.id).catch(() => null),
      );
      const msgResults = await Promise.all(msgPromises);
      const allMessages: ChatMessage[] = [];
      msgResults.forEach((res, idx) => {
        if (!res) return;
        const roomId = rooms[idx].id;
        if (res.chats) {
          allMessages.push(...res.chats.map((c) => mapChat(c, roomId)));
        }
      });
      dispatch(setChatMessages(allMessages));
    } catch (err) {
      console.error('[ChatProvider] fetch error:', err);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  return <>{children}</>;
}
