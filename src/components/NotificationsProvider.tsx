'use client';

import { useEffect, useRef, useCallback } from 'react';
import { NotificationService } from '@/lib/api/services/NotificationService';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setNotifications } from '@/components/store/notificationSlice';
import type { Notification } from '@/types/client';
import type { NotificationResponse } from '@/lib/api/services/NotificationService';

const POLL_INTERVAL = 30_000;

function mapToNotification(n: NotificationResponse): Notification {
  let linkType: Notification['linkType'] = undefined;
  let linkId: string | undefined = undefined;
  if (n.data) {
    try {
      const parsed = JSON.parse(n.data);
      linkType = parsed.linkType ?? undefined;
      linkId = parsed.linkId ?? undefined;
    } catch {}
  }
  return {
    id: n.id,
    userId: n.recipientId,
    type: n.type as Notification['type'],
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    linkType,
    linkId,
    createdAt: new Date(n.createdAt).getTime(),
  };
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const currUser = useAppSelector(
    (s) => (s as any).currUser?.entity ?? (s as any).currUser?.current ?? null,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!currUser?.id) return;
    try {
      const res = await NotificationService.listNotifications(currUser.id, undefined, undefined, undefined, 50);
      if (res?.notifications) {
        dispatch(setNotifications(res.notifications.map(mapToNotification)));
      }
    } catch (err) {
      console.error('[NotificationsProvider] fetch error:', err);
    }
  }, [currUser?.id, dispatch]);

  useEffect(() => {
    if (!currUser?.id) return;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currUser?.id, fetchNotifications]);

  return <>{children}</>;
}
