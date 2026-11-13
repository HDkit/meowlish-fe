import { describe, expect, it } from 'vitest';
import type { BlogComment } from './api/services/BlogCommentService';
import {
  MAX_VISUAL_DEPTH,
  collectAuthorIds,
  countVisible,
  findComment,
  insertReply,
  removeComment,
  replaceComment,
  visualDepth,
} from './comment-tree';

const c = (id: string, replies: BlogComment[] = [], extra: Partial<BlogComment> = {}): BlogComment => ({
  id: id,
  blogId: 'b',
  authorId: `u-${id}`,
  content: id,
  depth: 0,
  deleted: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  replies: replies,
  ...extra,
});

const shape = (comments: BlogComment[]): unknown =>
  comments.map(x => (x.replies.length ? { [x.deleted ? `${x.id}†` : x.id]: shape(x.replies) } : x.deleted ? `${x.id}†` : x.id));

describe('comment tree helpers', () => {
  const tree = [c('a', [c('a1', [c('a1x')]), c('a2')]), c('b')];

  it('caps the visual depth', () => {
    expect(visualDepth(0)).toBe(0);
    expect(visualDepth(2)).toBe(2);
    expect(visualDepth(12)).toBe(MAX_VISUAL_DEPTH);
  });

  it('inserts a reply last under its parent without mutating the input', () => {
    const next = insertReply(tree, c('a1y', [], { parentId: 'a1' }));
    expect(shape(next)).toEqual([{ a: [{ a1: ['a1x', 'a1y'] }, 'a2'] }, 'b']);
    expect(shape(tree)).toEqual([{ a: [{ a1: ['a1x'] }, 'a2'] }, 'b']);
  });

  it('replaces an edited comment but keeps its replies', () => {
    const next = replaceComment(tree, c('a1', [], { content: 'edited' }));
    expect(findComment(next, 'a1')?.content).toBe('edited');
    expect(findComment(next, 'a1')?.replies.map(r => r.id)).toEqual(['a1x']);
  });

  it('turns a comment with replies into a placeholder and drops leaves', () => {
    const withPlaceholder = removeComment(tree, 'a1');
    expect(shape(withPlaceholder)).toEqual([{ a: [{ 'a1†': ['a1x'] }, 'a2'] }, 'b']);
    expect(findComment(withPlaceholder, 'a1')).toMatchObject({ content: '', authorId: '' });
    expect(shape(removeComment(tree, 'b'))).toEqual([{ a: [{ a1: ['a1x'] }, 'a2'] }]);
  });

  it('drops a placeholder once its last reply goes', () => {
    const placeholder = removeComment(tree, 'a1');
    expect(shape(removeComment(placeholder, 'a1x'))).toEqual([{ a: ['a2'] }, 'b']);
  });

  it('counts visible comments and collects authors', () => {
    const placeholder = removeComment(tree, 'a1');
    expect(countVisible(tree)).toBe(5);
    expect(countVisible(placeholder)).toBe(4);
    expect([...collectAuthorIds(placeholder)].sort()).toEqual(['u-a', 'u-a1x', 'u-a2', 'u-b']);
  });
});
