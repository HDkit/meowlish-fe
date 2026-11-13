import { describe, expect, it } from 'vitest';
import {
  blogCommentTargetId,
  forumReplyTargetId,
  reportTargetLabel,
  reportTargetUrl,
} from './report-targets';

describe('report targets', () => {
  it('links forum threads and replies (with the reply anchor)', () => {
    expect(reportTargetUrl('forum thread', 't1')).toBe('/forum/thread/t1');
    expect(reportTargetUrl('forum reply', forumReplyTargetId('t1', 'r9'))).toBe(
      '/forum/thread/t1?reply=r9#reply-r9',
    );
    expect(reportTargetUrl('forum reply', 't1')).toBe('/forum/thread/t1');
  });

  it('links blog comments to their post', () => {
    expect(reportTargetUrl('blog comment', blogCommentTargetId('b1', 'c2'))).toBe('/blog/b1#comment-c2');
  });

  it('keeps the existing targets', () => {
    expect(reportTargetUrl('exam', 'e1')).toBe('/test/e1');
    expect(reportTargetUrl('blog', 'b1')).toBe('/blog/b1');
    expect(reportTargetUrl('flashcard', 'l1/c1')).toBe('/flashcards/l1');
    expect(reportTargetUrl('flashcard list', 'l1')).toBe('/flashcards/l1');
  });

  it('returns null for unknown or incomplete targets', () => {
    expect(reportTargetUrl('user', 'u1')).toBeNull();
    expect(reportTargetUrl(undefined, 'x')).toBeNull();
    expect(reportTargetUrl('blog', '')).toBeNull();
  });

  it('labels targets in Vietnamese', () => {
    expect(reportTargetLabel('forum reply')).toBe('Trả lời diễn đàn');
    expect(reportTargetLabel('blog comment')).toBe('Bình luận blog');
    expect(reportTargetLabel('something')).toBe('Khác');
    expect(reportTargetLabel()).toBe('Khác');
  });
});
