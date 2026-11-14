import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { Envelope } from './ForumService';

export interface BlogComment {
  id: string;
  blogId: string;
  parentId?: string;
  /** Empty once deleted. */
  authorId: string;
  /** Markdown; empty once deleted. */
  content: string;
  /** 0 for top-level comments. */
  depth: number;
  /** Deleted but kept as "[đã xóa]" because it still has replies. */
  deleted: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Oldest first. */
  replies: BlogComment[];
}

export interface ListBlogCommentsResponse {
  /** Top-level comments of the page, newest first, each with its reply tree. */
  comments: BlogComment[];
  totalThreads: number;
  totalComments: number;
}

/** Hand-written client for blog comments (gateway ResourceGatewayController). */
export class BlogCommentService {
  public static listComments(
    blogId: string,
    params: { page?: number; limit?: number } = {},
  ): CancelablePromise<Envelope<ListBlogCommentsResponse>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/blogs/{blogId}/comments',
      path: { blogId },
      query: { page: params.page, limit: params.limit },
    });
  }

  public static createComment(
    blogId: string,
    payload: { content: string; parentId?: string },
  ): CancelablePromise<Envelope<BlogComment>> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/blogs/{blogId}/comments',
      path: { blogId },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static updateComment(commentId: string, payload: { content: string }): CancelablePromise<Envelope<BlogComment>> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/v1/resources/blog-comments/{commentId}',
      path: { commentId },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static deleteComment(commentId: string): CancelablePromise<Envelope<null>> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/resources/blog-comments/{commentId}',
      path: { commentId },
    });
  }
}
