import type { BlogComment } from './api/services/BlogCommentService';

/** Indentation stops here; deeper replies are drawn at this level with an "↪ name" hint. */
export const MAX_VISUAL_DEPTH = 4;

export const visualDepth = (depth: number): number => Math.min(Math.max(depth, 0), MAX_VISUAL_DEPTH);

/** Comments in the tree that are not deleted placeholders. */
export const countVisible = (comments: readonly BlogComment[]): number =>
  comments.reduce((n, c) => n + (c.deleted ? 0 : 1) + countVisible(c.replies), 0);

const mapTree = (
  comments: readonly BlogComment[],
  fn: (c: BlogComment) => BlogComment | null,
): BlogComment[] =>
  comments
    .map(c => fn({ ...c, replies: mapTree(c.replies, fn) }))
    .filter((c): c is BlogComment => c !== null);

/** Puts a new reply last under its parent (replies are oldest first). */
export const insertReply = (comments: readonly BlogComment[], reply: BlogComment): BlogComment[] =>
  mapTree(comments, c => (c.id === reply.parentId ? { ...c, replies: [...c.replies, { ...reply, replies: [] }] } : c));

/** Swaps in an edited comment, keeping its loaded replies. */
export const replaceComment = (comments: readonly BlogComment[], updated: BlogComment): BlogComment[] =>
  mapTree(comments, c => (c.id === updated.id ? { ...updated, replies: c.replies } : c));

/**
 * Mirrors the server after a delete: a comment with replies becomes a "[đã xóa]" placeholder,
 * otherwise it disappears, and so do placeholders left without replies.
 */
export const removeComment = (comments: readonly BlogComment[], id: string): BlogComment[] =>
  mapTree(comments, c => {
    if (c.id === id) {
      return c.replies.length > 0 ? { ...c, deleted: true, content: '', authorId: '', editedAt: undefined } : null;
    }
    return c.deleted && c.replies.length === 0 ? null : c;
  });

/** Every author id in the tree, deduplicated (deleted comments have none). */
export const collectAuthorIds = (comments: readonly BlogComment[], into = new Set<string>()): Set<string> => {
  for (const c of comments) {
    if (c.authorId) into.add(c.authorId);
    collectAuthorIds(c.replies, into);
  }
  return into;
};

export const findComment = (comments: readonly BlogComment[], id: string): BlogComment | undefined => {
  for (const c of comments) {
    if (c.id === id) return c;
    const found = findComment(c.replies, id);
    if (found) return found;
  }
  return undefined;
};
