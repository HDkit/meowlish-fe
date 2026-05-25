'use client';

import { useEffect, useCallback } from 'react';
import { NotificationService } from '@/lib/api/services/NotificationService';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setNotifications } from '@/components/store/notificationSlice';
import { useBackoffPolling } from '@/hooks/useBackoffPolling';
import { useProviderErrorRegister } from './ProviderErrorContext';
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
  const { register, unregister } = useProviderErrorRegister();
  const userId = currUser?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const res = await NotificationService.listNotifications(userId, undefined, undefined, undefined, 50);
    const data = (res as any)?.data ?? res;
    if (data?.notifications) {
      dispatch(setNotifications(data.notifications.map(mapToNotification)));
    }
  }, [userId, dispatch]);

  const { error, isRetrying, manualRetry } = useBackoffPolling(fetchNotifications, POLL_INTERVAL, !!userId);

  useEffect(() => {
    register('notifications', { label: 'Thông báo', error, isRetrying, manualRetry });
    return () => unregister('notifications');
  }, [error, isRetrying, manualRetry, register, unregister]);

  return <>{children}</>;
}
