import { describe, expect, it } from 'vitest';
import type {
  FlashCardContent,
  FlashCardListChanges,
  ModifiedCardChange,
} from '@/lib/api/services/FlashcardProposalService';
import {
  fieldChangeRows,
  formatFieldValue,
  lineageText,
  proposalPath,
  proposalStatusLabel,
  pullResultMessage,
  summarizeChanges,
  summarizeCounts,
  toResolutions,
  unresolvedConflicts,
} from './flashcard-proposals';

const content = (overrides: Partial<FlashCardContent> = {}): FlashCardContent => ({
  word: 'apple',
  definition: 'quả táo',
  examples: ['An apple a day', ' '],
  tags: ['fruit'],
  ...overrides,
});

const modified = (overrides: Partial<ModifiedCardChange> = {}): ModifiedCardChange => ({
  targetCardId: 'o1',
  sourceCardId: 'f1',
  fields: ['notes', 'definition'],
  base: content(),
  proposed: content({ definition: 'trái táo', notes: 'mới' }),
  conflict: false,
  targetMissing: false,
  ...overrides,
});

const changes = (overrides: Partial<FlashCardListChanges> = {}): FlashCardListChanges => ({
  added: [],
  modified: [],
  removed: [],
  ...overrides,
});

describe('formatFieldValue', () => {
  it('joins non-empty list values and trims text', () => {
    expect(formatFieldValue(content(), 'examples')).toBe('An apple a day');
    expect(formatFieldValue(content({ notes: '  ghi chú ' }), 'notes')).toBe('ghi chú');
    expect(formatFieldValue(content(), 'pronunciation')).toBe('');
    expect(formatFieldValue(undefined, 'word')).toBe('');
  });
});

describe('fieldChangeRows', () => {
  it('lists changed fields in display order with before and after', () => {
    expect(fieldChangeRows(modified())).toEqual([
      { field: 'definition', label: 'Định nghĩa', before: 'quả táo', after: 'trái táo', current: undefined },
      { field: 'notes', label: 'Ghi chú', before: '', after: 'mới', current: undefined },
    ]);
  });

  it('shows the owner’s current value only when it changed since the proposal', () => {
    const rows = fieldChangeRows(
      modified({ fields: ['definition'], current: content({ definition: 'táo đỏ' }), conflict: true }),
    );
    expect(rows[0].current).toBe('táo đỏ');
    expect(fieldChangeRows(modified({ fields: ['definition'], current: content() }))[0].current).toBeUndefined();
  });
});

describe('summaries and labels', () => {
  it('summarizes change counts in Vietnamese', () => {
    expect(summarizeCounts({ added: 2, modified: 0, removed: 1 })).toBe('2 thẻ mới · 1 thẻ xoá');
    expect(summarizeChanges(changes())).toBe('Không có thay đổi');
  });

  it('labels statuses and builds proposal links', () => {
    expect(proposalStatusLabel('OPEN')).toBe('Đang chờ duyệt');
    expect(proposalStatusLabel('ACCEPTED')).toBe('Đã chấp nhận');
    expect(proposalStatusLabel('UNKNOWN')).toBe('UNKNOWN');
    expect(proposalPath('l 1', 'p1')).toBe('/flashcards/l%201/proposals/p1');
  });

  it('describes where a copy came from', () => {
    expect(lineageText({ forkedFromName: 'IELTS' }, 'Minh')).toBe('Sao chép từ “IELTS” của Minh');
    expect(lineageText({ forkedFromName: 'IELTS' })).toBe('Sao chép từ “IELTS”');
    expect(lineageText({})).toBeNull();
  });

  it('reports what a pull did', () => {
    expect(pullResultMessage({ updated: 2, added: 1, removed: 0, skipped: 1 })).toBe(
      'Đã cập nhật 2 thẻ, thêm 1 thẻ mới. Giữ nguyên 1 thẻ bạn đã sửa.',
    );
    expect(pullResultMessage({ updated: 0, added: 0, removed: 0, skipped: 0 })).toBe(
      'Bộ của bạn đã có mọi thay đổi của bản gốc.',
    );
  });
});

describe('conflict resolutions', () => {
  const withConflicts = changes({
    modified: [modified({ conflict: true }), modified({ targetCardId: 'o3' })],
    removed: [{ targetCardId: 'o2', base: content(), conflict: true, targetMissing: false }],
  });

  it('lists conflicting cards that still need a choice', () => {
    expect(unresolvedConflicts(withConflicts, {})).toEqual(['o1', 'o2']);
    expect(unresolvedConflicts(withConflicts, { o1: true, o2: false })).toEqual([]);
  });

  it('sends choices for conflicting cards only', () => {
    expect(toResolutions(withConflicts, { o1: false, o2: true, o3: true })).toEqual([
      { targetCardId: 'o1', apply: false },
      { targetCardId: 'o2', apply: true },
    ]);
  });
});
