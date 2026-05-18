import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface NotificationResponse {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  data?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ListNotificationsResponse {
  notifications: NotificationResponse[];
  totalCount: number;
  unreadCount: number;
}

export class NotificationService {
  public static listNotifications(
    recipientId?: string,
    type?: string,
    isRead?: boolean,
    page?: number,
    limit?: number,
  ): CancelablePromise<ListNotificationsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/notifications',
      query: { recipientId, type, isRead, page, limit },
    });
  }

  public static getNotification(id: string): CancelablePromise<NotificationResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/notifications/{id}',
      path: { id },
    });
  }

  public static deleteNotification(id: string): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/notifications/{id}',
      path: { id },
    });
  }

  public static markAsRead(id: string): CancelablePromise<NotificationResponse> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/v1/notifications/{id}/read',
      path: { id },
    });
  }

  public static markAllAsRead(recipientId: string): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/notifications/read-all',
      body: { recipientId },
      mediaType: 'application/json',
    });
  }
}
