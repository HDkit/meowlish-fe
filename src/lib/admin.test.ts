import { describe, expect, it, vi } from 'vitest';
import {
	asQueryArray,
	examStatusMeta,
	fetchAllPages,
	formatDate,
	initials,
	matchesSearch,
	pageBounds,
	paginate,
	reportStatusMeta,
	reportTargetUrl,
	roleLabel,
	roleTone,
	searchKey,
} from './admin';

describe('status meta', () => {
	it('maps exam statuses to one label and tone each', () => {
		expect(examStatusMeta('PENDING')).toEqual({ label: 'Chờ duyệt', tone: 'warning' });
		expect(examStatusMeta('approved')).toEqual({ label: 'Đã xuất bản', tone: 'success' });
		expect(examStatusMeta('ARCHIVED')).toEqual({ label: 'ARCHIVED', tone: 'neutral' });
		expect(examStatusMeta(undefined)).toEqual({ label: 'Không rõ', tone: 'neutral' });
	});

	it('maps report statuses', () => {
		expect(reportStatusMeta('reviewing')).toEqual({ label: 'Đang xem xét', tone: 'info' });
		expect(reportStatusMeta('RESOLVED').tone).toBe('success');
	});
});

describe('roles', () => {
	it('labels backend role names', () => {
		expect(roleLabel('admin')).toBe('Quản trị viên');
		expect(roleLabel('mod')).toBe('Điều hành viên');
		expect(roleLabel('custom')).toBe('custom');
		expect(roleTone('admin')).toBe('accent');
		expect(roleTone('student')).toBe('neutral');
	});
});

describe('reportTargetUrl', () => {
	it('links each target type', () => {
		expect(reportTargetUrl('exam', 'e1')).toBe('/test/e1');
		expect(reportTargetUrl('flashcard', 'list1/card1')).toBe('/flashcards/list1');
		expect(reportTargetUrl('flashcard list', 'list1')).toBe('/flashcards/list1');
		expect(reportTargetUrl('other', 'x')).toBeNull();
		expect(reportTargetUrl('exam', undefined)).toBeNull();
	});
});

describe('search', () => {
	it('ignores case and Vietnamese diacritics', () => {
		expect(searchKey('  Đề Thi Thử ')).toBe('de thi thu');
		expect(matchesSearch('de thi', 'Đề thi IELTS')).toBe(true);
		expect(matchesSearch('toeic', 'Đề thi IELTS', undefined, 'mô tả')).toBe(false);
		expect(matchesSearch('', 'anything')).toBe(true);
	});
});

describe('pagination', () => {
	const items = Array.from({ length: 45 }, (_, i) => i);

	it('slices a page and clamps out-of-range pages', () => {
		expect(paginate(items, 1, 20).items).toHaveLength(20);
		expect(paginate(items, 3, 20)).toMatchObject({ page: 3, totalPages: 3, items: [40, 41, 42, 43, 44] });
		expect(paginate(items, 9, 20).page).toBe(3);
		expect(paginate([], 2, 20)).toEqual({ items: [], page: 1, totalPages: 1 });
	});

	it('computes the shown range', () => {
		expect(pageBounds(1, 20, 45)).toEqual({ from: 1, to: 20 });
		expect(pageBounds(3, 20, 45)).toEqual({ from: 41, to: 45 });
		expect(pageBounds(1, 20, 0)).toEqual({ from: 0, to: 0 });
	});
});

describe('asQueryArray', () => {
	it('repeats a single value so the gateway parses an array', () => {
		expect(asQueryArray(['admin'])).toEqual(['admin', 'admin']);
		expect(asQueryArray(['a', 'b'])).toEqual(['a', 'b']);
		expect(asQueryArray([])).toEqual([]);
	});
});

describe('fetchAllPages', () => {
	it('follows the cursor until a short page', async () => {
		const pages: Record<string, { items: number[]; nextCursor: string }> = {
			start: { items: [1, 2], nextCursor: 'c1' },
			c1: { items: [3, 4], nextCursor: 'c2' },
			c2: { items: [5], nextCursor: 'c3' },
		};
		const fetchPage = vi.fn(async (cursor?: string) => pages[cursor ?? 'start']);
		await expect(fetchAllPages(fetchPage, { pageSize: 2 })).resolves.toEqual({
			items: [1, 2, 3, 4, 5],
			complete: true,
		});
		expect(fetchPage).toHaveBeenCalledTimes(3);
	});

	it('stops at maxPages and on a repeated cursor', async () => {
		const always = vi.fn(async () => ({ items: [1, 2], nextCursor: 'same' }));
		await expect(fetchAllPages(always, { pageSize: 2 })).resolves.toEqual({ items: [1, 2, 1, 2], complete: true });

		let n = 0;
		const endless = async () => ({ items: [n, n], nextCursor: `c${++n}` });
		await expect(fetchAllPages(endless, { pageSize: 2, maxPages: 3 })).resolves.toMatchObject({ complete: false });
	});
});

describe('formatting', () => {
	it('formats dates and tolerates missing ones', () => {
		expect(formatDate(undefined)).toBe('—');
		expect(formatDate('not a date')).toBe('—');
		expect(formatDate('2026-03-05T10:00:00Z')).toMatch(/05\/03\/2026/);
	});

	it('builds initials', () => {
		expect(initials('Nguyễn Văn An')).toBe('NA');
		expect(initials('admin')).toBe('AD');
		expect(initials('')).toBe('?');
	});
});
