import { REPORT_TARGET_LABELS, reportTargetUrl } from './report-targets';
/** Pure helpers shared by the admin console pages (src/components/admin/*). */

/** Colour family of a status badge; the badge component maps it to classes. */
export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent';
export type StatusMeta = { label: string; tone: Tone };

const unknown = (value?: string): StatusMeta => ({ label: value || 'Không rõ', tone: 'neutral' });

export const EXAM_STATUSES: Record<string, StatusMeta> = {
	EMPTY: { label: 'Bản nháp', tone: 'neutral' },
	PENDING: { label: 'Chờ duyệt', tone: 'warning' },
	REJECTED: { label: 'Cần sửa', tone: 'danger' },
	APPROVED: { label: 'Đã xuất bản', tone: 'success' },
};
export const examStatusMeta = (status?: string): StatusMeta =>
	(status && EXAM_STATUSES[status.toUpperCase()]) || unknown(status);

export const REPORT_STATUSES: Record<string, StatusMeta> = {
	pending: { label: 'Chờ xử lý', tone: 'warning' },
	reviewing: { label: 'Đang xem xét', tone: 'info' },
	resolved: { label: 'Đã giải quyết', tone: 'success' },
	rejected: { label: 'Đã từ chối', tone: 'danger' },
};
export const reportStatusMeta = (status?: string): StatusMeta =>
	(status && REPORT_STATUSES[status.toLowerCase()]) || unknown(status);

export const REPORT_TYPES: Record<string, string> = {
	bug: 'Lỗi hệ thống',
	content: 'Nội dung',
	behavior: 'Hành vi',
};

/** Report target labels and links come from lib/report-targets (one list for every target type). */
export const REPORT_TARGETS: Record<string, string> = REPORT_TARGET_LABELS;
export { reportTargetUrl };

/** Backend role names (libs/typing Role) -> Vietnamese labels. */
export const ROLE_LABELS: Record<string, string> = {
	admin: 'Quản trị viên',
	mod: 'Điều hành viên',
	user: 'Người dùng',
	student: 'Học viên',
	parent: 'Phụ huynh',
	teacher: 'Giáo viên',
	mentor: 'Người hướng dẫn',
};
export const roleLabel = (name: string): string => ROLE_LABELS[name] ?? name;
export const roleTone = (name: string): Tone =>
	name === 'admin' ? 'accent'
	: name === 'mod' ? 'info'
	: name === 'teacher' || name === 'mentor' ? 'success'
	: 'neutral';

/** Lowercase, without Vietnamese diacritics, so "de thi" finds "Đề thi". */
export const searchKey = (value: string): string =>
	value
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.toLowerCase()
		.trim();

export const matchesSearch = (query: string, ...fields: Array<string | null | undefined>): boolean => {
	const q = searchKey(query);
	if (!q) return true;
	return fields.some((f) => !!f && searchKey(f).includes(q));
};

/** Slices a page (1-based) out of `items`, clamping the page into range. */
export const paginate = <T,>(items: readonly T[], page: number, pageSize: number) => {
	const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
	const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
	const start = (current - 1) * pageSize;
	return { items: items.slice(start, start + pageSize), page: current, totalPages: totalPages };
};

/** "x–y / total" bounds of a 1-based page; from = 0 when there is nothing. */
export const pageBounds = (page: number, pageSize: number, total: number) => {
	if (total <= 0) return { from: 0, to: 0 };
	const from = (page - 1) * pageSize + 1;
	return { from: Math.min(from, total), to: Math.min(page * pageSize, total) };
};

/**
 * Gateway list DTOs without `@ToStringArray()` reject a single query value ("hasRoles must be an
 * array"): `?a=x` parses as a string, `?a=x&a=x` as an array. Repeat a lone value so it stays one.
 */
export const asQueryArray = (values: readonly string[]): string[] =>
	values.length === 1 ? [values[0], values[0]] : [...values];

/**
 * Follows a forward cursor until a short page, `maxPages` pages, or a repeated cursor. The
 * management lists are small (tens to hundreds of rows), so the pages load all rows and search,
 * filter and paginate locally; the exam list has no substring title search on the server.
 */
export const fetchAllPages = async <T,>(
	fetchPage: (cursor: string | undefined) => Promise<{ items: T[]; nextCursor?: string }>,
	{ pageSize, maxPages = 20 }: { pageSize: number; maxPages?: number },
): Promise<{ items: T[]; complete: boolean }> => {
	const items: T[] = [];
	let cursor: string | undefined;
	const seen = new Set<string>();
	for (let i = 0; i < maxPages; i++) {
		const page = await fetchPage(cursor);
		items.push(...page.items);
		if (page.items.length < pageSize || !page.nextCursor || seen.has(page.nextCursor)) {
			return { items: items, complete: true };
		}
		seen.add(page.nextCursor);
		cursor = page.nextCursor;
	}
	return { items: items, complete: false };
};

export const formatDate = (value?: string | number | Date | null, withTime = false): string => {
	if (value === undefined || value === null || value === '') return '—';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return '—';
	return d.toLocaleDateString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		...(withTime && { hour: '2-digit', minute: '2-digit' }),
	});
};

/** Two letters for an avatar placeholder. */
export const initials = (name?: string | null): string => {
	const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return '?';
	const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0];
	return letters.toUpperCase();
};
