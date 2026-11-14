import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/** Gateway envelope: every route wraps its payload in `data`. */
export interface Envelope<T> {
  data: T | null;
}

export interface ForumThreadSummary {
  id: string;
  categoryId: string;
  authorId: string;
  title: string;
  excerpt: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  viewCount: number;
  lastActivityAt: string;
  lastReplyAuthorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  position: number;
  /** Only moderators may open threads here. */
  moderatorsOnly: boolean;
  threadCount: number;
  replyCount: number;
  latestThread?: ForumThreadSummary;
}

export interface ForumThread extends Omit<ForumThreadSummary, 'excerpt'> {
  categoryName: string;
  body: string;
  editedAt?: string;
}

export interface ForumQuote {
  id: string;
  authorId: string;
  excerpt: string;
}

export interface ForumReply {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  /** 1-based position in the thread, oldest first. */
  position: number;
  quotedReply?: ForumQuote;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListForumThreadsResponse {
  threads: ForumThreadSummary[];
  totalCount: number;
}

export interface ListForumRepliesResponse {
  replies: ForumReply[];
  totalCount: number;
}

/** Hand-written client for /api/v1/resources/forum (see the gateway's ForumGatewayController). */
export class ForumService {
  public static listCategories(): CancelablePromise<Envelope<{ categories: ForumCategory[] }>> {
    return __request(OpenAPI, { method: 'GET', url: '/api/v1/resources/forum/categories' });
  }

  public static getCategory(categoryId: string): CancelablePromise<Envelope<ForumCategory>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/forum/categories/{categoryId}',
      path: { categoryId },
    });
  }

  public static listThreads(
    categoryId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ): CancelablePromise<Envelope<ListForumThreadsResponse>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/forum/categories/{categoryId}/threads',
      path: { categoryId },
      query: { page: params.page, limit: params.limit, search: params.search?.trim() || undefined },
    });
  }

  public static createThread(
    categoryId: string,
    payload: { title: string; body: string },
  ): CancelablePromise<Envelope<ForumThread>> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/forum/categories/{categoryId}/threads',
      path: { categoryId },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static getThread(threadId: string): CancelablePromise<Envelope<ForumThread>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/forum/threads/{threadId}',
      path: { threadId },
    });
  }

  public static updateThread(
    threadId: string,
    payload: { title?: string; body?: string },
  ): CancelablePromise<Envelope<ForumThread>> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/v1/resources/forum/threads/{threadId}',
      path: { threadId },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static moderateThread(
    threadId: string,
    payload: { isPinned?: boolean; isLocked?: boolean },
  ): CancelablePromise<Envelope<ForumThread>> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/v1/resources/forum/threads/{threadId}/moderation',
      path: { threadId },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static deleteThread(threadId: string): CancelablePromise<Envelope<null>> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/resources/forum/threads/{threadId}',
      path: { threadId },
    });
  }

  public static listReplies(
    threadId: string,
    params: { page?: number; limit?: number } = {},
  ): CancelablePromise<Envelope<ListForumRepliesResponse>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/forum/threads/{threadId}/replies',
      path: { threadId },
      query: { page: params.page, limit: params.limit },
    });
  }

  public static createReply(
    threadId: string,
    payload: { body: string; quotedReplyId?: string },
  ): CancelablePromise<Envelope<ForumReply>> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/forum/threads/{threadId}/replies',
      path: { threadId },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static updateReply(replyId: string, payload: { body: string }): CancelablePromise<Envelope<ForumReply>> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/v1/resources/forum/replies/{replyId}',
      path: { replyId },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static deleteReply(replyId: string): CancelablePromise<Envelope<null>> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/resources/forum/replies/{replyId}',
      path: { replyId },
    });
  }
}
