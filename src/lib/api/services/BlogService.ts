import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface BlogResponse {
  id: string;
  title: string;
  content: string;
  authorId: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ListBlogsResponse {
  blogs: BlogResponse[];
  totalCount: number;
}

export interface CreateBlogPayload {
  title: string;
  content: string;
  authorId: string;
  tags?: string[];
}

export interface UpdateBlogPayload {
  title?: string;
  content?: string;
  tags?: string[];
}

export class BlogService {
  public static listBlogs(
    authorId?: string,
    page?: number,
    limit?: number,
    tags?: string[],
  ): CancelablePromise<ListBlogsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/blogs',
      query: { authorId, page, limit, tags },
    });
  }

  public static getBlog(id: string): CancelablePromise<BlogResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/blogs/{id}',
      path: { id },
    });
  }

  public static createBlog(
    payload: CreateBlogPayload,
  ): CancelablePromise<BlogResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/blogs',
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static updateBlog(
    id: string,
    payload: UpdateBlogPayload,
  ): CancelablePromise<BlogResponse> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/v1/resources/blogs/{id}',
      path: { id },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static deleteBlog(id: string): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/resources/blogs/{id}',
      path: { id },
    });
  }
}
