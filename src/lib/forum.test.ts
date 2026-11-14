import { describe, expect, it } from 'vitest';
import { canModerate, communityErrorMessage, pageOfPosition, parsePageParam, totalPages } from './forum';

describe('forum helpers', () => {
  it('lets mods and admins moderate, nobody else', () => {
    expect(canModerate('role-mod')).toBe(true);
    expect(canModerate('role-head-staff')).toBe(true);
    expect(canModerate('role-staff')).toBe(false);
    expect(canModerate('role-learner')).toBe(false);
    expect(canModerate(undefined)).toBe(false);
  });

  it('finds the page of a reply and the page count', () => {
    expect(pageOfPosition(1, 20)).toBe(1);
    expect(pageOfPosition(20, 20)).toBe(1);
    expect(pageOfPosition(21, 20)).toBe(2);
    expect(pageOfPosition(0, 20)).toBe(1);
    expect(totalPages(0, 20)).toBe(1);
    expect(totalPages(41, 20)).toBe(3);
  });

  it('parses page params defensively', () => {
    expect(parsePageParam('3')).toBe(3);
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('abc')).toBe(1);
    expect(parsePageParam(null)).toBe(1);
  });

  it('translates known API errors and hides technical ones', () => {
    expect(communityErrorMessage({ status: 403, body: { error: 'This thread is locked' } })).toMatch(/khóa/);
    expect(communityErrorMessage({ status: 404, body: { error: 'Thread not found' } })).toMatch(/không tồn tại/);
    expect(communityErrorMessage({ status: 500, body: { error: 'PrismaClientKnownRequestError at x.ts:12' } })).toBe(
      'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau',
    );
  });
});
