import { extractApiErrorMessage } from './api-response';

/** Backend role ids (auth-session roleIdFromRoles) that moderate the forum and comments: mod, admin. */
const MODERATOR_ROLE_IDS = new Set(['role-mod', 'role-head-staff']);

export const canModerate = (roleId?: string | null): boolean => !!roleId && MODERATOR_ROLE_IDS.has(roleId);

export const THREADS_PER_PAGE = 20;
export const REPLIES_PER_PAGE = 20;

/** Page (1-based) holding the reply at `position` (1-based). */
export const pageOfPosition = (position: number, perPage: number = REPLIES_PER_PAGE): number =>
  Math.max(1, Math.ceil(position / perPage));

export const totalPages = (total: number, perPage: number): number => Math.max(1, Math.ceil(total / perPage));

/** Reads a positive page number from the URL (`?page=`), defaulting to 1. */
export const parsePageParam = (value: string | null | undefined): number => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
};

const KNOWN_ERRORS: Record<string, string> = {
  'This thread is locked': 'Chủ đề đã bị khóa, không thể trả lời hoặc chỉnh sửa.',
  'Only moderators can open threads in this category': 'Chỉ quản trị viên mới được đăng chủ đề trong chuyên mục này.',
  'Only moderators can do this': 'Chỉ quản trị viên mới thực hiện được thao tác này.',
  'Thread not found': 'Chủ đề không tồn tại hoặc đã bị xóa.',
  'Reply not found': 'Câu trả lời không tồn tại hoặc đã bị xóa.',
  'Quoted reply not found': 'Câu trả lời được trích dẫn không còn tồn tại.',
  'Category not found': 'Chuyên mục không tồn tại.',
  'Comment not found': 'Bình luận không tồn tại hoặc đã bị xóa.',
  'Blog not found': 'Bài viết không tồn tại hoặc đã bị xóa.',
};

/** User-facing Vietnamese message for a forum/comment API error (never raw JSON). */
export const communityErrorMessage = (error: unknown, fallback?: string): string => {
  // forum/comment messages first (by the backend's raw text), then the app-wide translation
  const body = (error as { body?: { error?: unknown; message?: unknown } } | null)?.body;
  for (const raw of [body?.error, body?.message].flat()) {
    if (typeof raw === 'string' && KNOWN_ERRORS[raw.trim()]) return KNOWN_ERRORS[raw.trim()];
  }
  return extractApiErrorMessage(error, fallback);
};
