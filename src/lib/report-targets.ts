/** What a report points at (`targetType` of POST /resources/reports). */
export type ReportTargetType =
  | 'exam'
  | 'blog'
  | 'blog comment'
  | 'flashcard'
  | 'flashcard list'
  | 'forum thread'
  | 'forum reply';

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  exam: 'Đề thi',
  blog: 'Blog',
  'blog comment': 'Bình luận blog',
  flashcard: 'Flashcard',
  'flashcard list': 'Bộ sưu tập',
  'forum thread': 'Chủ đề diễn đàn',
  'forum reply': 'Trả lời diễn đàn',
};

export const reportTargetLabel = (targetType?: string): string =>
  (targetType && REPORT_TARGET_LABELS[targetType as ReportTargetType]) || 'Khác';

/** Child targets carry their parent so the admin link can open the right page. */
export const forumReplyTargetId = (threadId: string, replyId: string): string => `${threadId}/${replyId}`;
export const blogCommentTargetId = (blogId: string, commentId: string): string => `${blogId}/${commentId}`;

const splitPair = (targetId: string): [string, string | undefined] => {
  const [parent, child] = targetId.split('/');
  return [parent, child || undefined];
};

/** Page showing the reported item, or null for unknown targets. */
export const reportTargetUrl = (targetType?: string, targetId?: string): string | null => {
  if (!targetType || !targetId) return null;
  const enc = encodeURIComponent;
  switch (targetType) {
    case 'exam':
      return `/test/${enc(targetId)}`;
    case 'blog':
      return `/blog/${enc(targetId)}`;
    case 'blog comment': {
      const [blogId, commentId] = splitPair(targetId);
      return commentId ? `/blog/${enc(blogId)}#comment-${enc(commentId)}` : `/blog/${enc(blogId)}`;
    }
    case 'flashcard': {
      const [listId] = splitPair(targetId);
      return listId ? `/flashcards/${enc(listId)}` : null;
    }
    case 'flashcard list':
      return `/flashcards/${enc(targetId)}`;
    case 'forum thread':
      return `/forum/thread/${enc(targetId)}`;
    case 'forum reply': {
      const [threadId, replyId] = splitPair(targetId);
      return replyId ?
          `/forum/thread/${enc(threadId)}?reply=${enc(replyId)}#reply-${enc(replyId)}`
        : `/forum/thread/${enc(threadId)}`;
    }
    default:
      return null;
  }
};
