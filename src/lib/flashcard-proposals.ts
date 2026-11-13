import type {
  CardDiffField,
  ConflictResolution,
  FlashCardContent,
  FlashCardListChanges,
  FlashCardProposalStatus,
  ModifiedCardChange,
  PullUpstreamResponse,
} from '@/lib/api/services/FlashcardProposalService';

/** Vietnamese labels of the card fields a proposal can change, in display order. */
export const CARD_FIELD_LABELS: Record<CardDiffField, string> = {
  word: 'Từ',
  definition: 'Định nghĩa',
  partOfSpeech: 'Từ loại',
  pronunciation: 'Phát âm',
  examples: 'Ví dụ',
  notes: 'Ghi chú',
  tags: 'Nhãn',
};

const FIELD_ORDER = Object.keys(CARD_FIELD_LABELS) as CardDiffField[];

/** A field's value as one line of text; '' when empty. */
export const formatFieldValue = (content: FlashCardContent | undefined, field: CardDiffField): string => {
  if (!content) return '';
  const value = content[field];
  if (Array.isArray(value)) return value.filter(v => v.trim()).join(' · ');
  return value?.trim() ?? '';
};

export interface FieldChangeRow {
  field: CardDiffField;
  label: string;
  /** The original's value when proposed. */
  before: string;
  after: string;
  /** On a conflict: the original's value now, when it differs from `before`. */
  current?: string;
}

/** One row per changed field of a modified card: label, before → after (and the owner's value now). */
export const fieldChangeRows = (change: ModifiedCardChange): FieldChangeRow[] =>
  FIELD_ORDER.filter(f => change.fields.includes(f)).map(field => {
    const before = formatFieldValue(change.base, field);
    const current = change.current ? formatFieldValue(change.current, field) : undefined;
    return {
      field: field,
      label: CARD_FIELD_LABELS[field],
      before: before,
      after: formatFieldValue(change.proposed, field),
      current: current !== undefined && current !== before ? current : undefined,
    };
  });

export const countChanges = (changes: FlashCardListChanges): number =>
  changes.added.length + changes.modified.length + changes.removed.length;

/** "2 thẻ mới · 1 thẻ sửa · 1 thẻ xoá" (empty parts left out), or "Không có thay đổi". */
export const summarizeCounts = (counts: { added: number; modified: number; removed: number }): string => {
  const parts = [
    counts.added > 0 ? `${counts.added} thẻ mới` : '',
    counts.modified > 0 ? `${counts.modified} thẻ sửa` : '',
    counts.removed > 0 ? `${counts.removed} thẻ xoá` : '',
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'Không có thay đổi';
};

export const summarizeChanges = (changes: FlashCardListChanges): string =>
  summarizeCounts({
    added: changes.added.length,
    modified: changes.modified.length,
    removed: changes.removed.length,
  });

export const PROPOSAL_STATUS: Record<FlashCardProposalStatus, { label: string; className: string }> = {
  OPEN: { label: 'Đang chờ duyệt', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACCEPTED: { label: 'Đã chấp nhận', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Đã từ chối', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  WITHDRAWN: { label: 'Đã rút lại', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const proposalStatusLabel = (status: string): string =>
  PROPOSAL_STATUS[status as FlashCardProposalStatus]?.label ?? status;

/** In-app path of a proposal (also used by notifications). */
export const proposalPath = (listId: string, proposalId: string): string =>
  `/flashcards/${encodeURIComponent(listId)}/proposals/${encodeURIComponent(proposalId)}`;

export const proposePath = (forkId: string): string => `/flashcards/${encodeURIComponent(forkId)}/propose`;

/** Ids of the conflicting cards (modified or removed) that need the owner's choice. */
export const conflictIds = (changes: FlashCardListChanges): string[] => [
  ...changes.modified.filter(c => c.conflict).map(c => c.targetCardId),
  ...changes.removed.filter(c => c.conflict).map(c => c.targetCardId),
];

/** Conflicting cards without a choice yet. */
export const unresolvedConflicts = (
  changes: FlashCardListChanges,
  choices: Readonly<Record<string, boolean | undefined>>,
): string[] => conflictIds(changes).filter(id => choices[id] === undefined);

/** The owner's choices as the accept payload, for conflicting cards only. */
export const toResolutions = (
  changes: FlashCardListChanges,
  choices: Readonly<Record<string, boolean | undefined>>,
): ConflictResolution[] =>
  conflictIds(changes)
    .filter(id => choices[id] !== undefined)
    .map(id => ({ targetCardId: id, apply: choices[id] === true }));

/** Toast text after "Cập nhật từ bản gốc". */
export const pullResultMessage = (result: PullUpstreamResponse): string => {
  const parts = [
    result.updated > 0 ? `cập nhật ${result.updated} thẻ` : '',
    result.added > 0 ? `thêm ${result.added} thẻ mới` : '',
    result.removed > 0 ? `xoá ${result.removed} thẻ bản gốc đã xoá` : '',
  ].filter(Boolean);
  const done = parts.length > 0 ? `Đã ${parts.join(', ')}.` : 'Bộ của bạn đã có mọi thay đổi của bản gốc.';
  return result.skipped > 0 ?
      `${done} Giữ nguyên ${result.skipped} thẻ bạn đã sửa.`
    : done;
};

/** "Sao chép từ “IELTS” của Minh" for a copy; null for other lists. */
export const lineageText = (
  list: { forkedFromName?: string; forkedFromAuthorId?: string },
  authorName?: string,
): string | null => {
  if (!list.forkedFromName) return null;
  return authorName ?
      `Sao chép từ “${list.forkedFromName}” của ${authorName}`
    : `Sao chép từ “${list.forkedFromName}”`;
};
