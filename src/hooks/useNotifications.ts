'use client';

import { useCallback } from 'react';
import { NotificationService } from '@/lib/api/services/NotificationService';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { updateNotification } from '@/components/store/notificationSlice';
import type { Notification } from '@/types/client';

export function useNotifications() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.notifications.list) as Notification[];
  const currUser = useAppSelector(
    (s) => (s as any).currUser?.entity ?? (s as any).currUser?.current ?? null,
  );

  const markAsRead = useCallback(async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      dispatch(updateNotification({ id, isRead: true } as Notification));
    } catch (err) {
      console.error('[useNotifications] markAsRead error:', err);
    }
  }, [dispatch]);

  const markAllAsRead = useCallback(async () => {
    if (!currUser?.id) return;
    try {
      await NotificationService.markAllAsRead(currUser.id);
      (notifications as Notification[]).forEach((n) => {
        if (!n.isRead) {
          dispatch(updateNotification({ ...n, isRead: true }));
        }
      });
    } catch (err) {
      console.error('[useNotifications] markAllAsRead error:', err);
    }
  }, [currUser?.id, notifications, dispatch]);

  const unreadCount = (notifications as Notification[]).filter(
    (n) => !n.isRead && n.userId === currUser?.id,
  ).length;

  return { markAsRead, markAllAsRead, unreadCount };
}
