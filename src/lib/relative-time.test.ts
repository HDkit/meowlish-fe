import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './relative-time';

const now = new Date('2026-11-13T12:00:00Z').getTime();
const ago = (ms: number) => new Date(now - ms).toISOString();

describe('formatRelativeTime', () => {
  it('describes recent times in Vietnamese', () => {
    expect(formatRelativeTime(ago(10_000), now)).toBe('vừa xong');
    expect(formatRelativeTime(ago(5 * 60_000), now)).toBe('5 phút trước');
    expect(formatRelativeTime(ago(3 * 3_600_000), now)).toBe('3 giờ trước');
    expect(formatRelativeTime(ago(2 * 86_400_000), now)).toBe('2 ngày trước');
  });

  it('falls back to a date after a week, and tolerates clock skew and bad input', () => {
    expect(formatRelativeTime(ago(30 * 86_400_000), now)).toMatch(/2026/);
    expect(formatRelativeTime(new Date(now + 5_000).toISOString(), now)).toBe('vừa xong');
    expect(formatRelativeTime('not a date', now)).toBe('');
  });
});
