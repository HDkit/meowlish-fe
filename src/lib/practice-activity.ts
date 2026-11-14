/**
 * Helpers for the practice activity heatmap and the weekly view. Days are UTC day keys
 * (YYYY-MM-DD), the same buckets the exam service counts in and the achievement service uses for
 * streaks, so everything here does date math in UTC.
 */

export type DayActivity = { date: string; attempts: number; minutes: number };

export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

export type HeatCell = DayActivity & {
	level: ActivityLevel;
	isToday: boolean;
	isFuture: boolean;
};

const DAY_MS = 86_400_000;

const toMs = (key: string): number => Date.parse(`${key}T00:00:00Z`);
const toKey = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

export function addDays(key: string, n: number): string {
	return toKey(toMs(key) + n * DAY_MS);
}

/** 0 = Monday … 6 = Sunday (weeks start on Monday, as in Vietnam). */
export function weekdayIndex(key: string): number {
	return (new Date(toMs(key)).getUTCDay() + 6) % 7;
}

/** Fixed buckets, so a colour means the same thing every week: 0, 1, 2, 3–4, 5+ attempts. */
export function activityLevel(attempts: number): ActivityLevel {
	if (attempts <= 0) return 0;
	if (attempts === 1) return 1;
	if (attempts === 2) return 2;
	if (attempts <= 4) return 3;
	return 4;
}

function indexDays(days: DayActivity[]): Map<string, DayActivity> {
	const map = new Map<string, DayActivity>();
	for (const d of days) {
		const prev = map.get(d.date);
		map.set(d.date, {
			date: d.date,
			attempts: (prev?.attempts ?? 0) + d.attempts,
			minutes: (prev?.minutes ?? 0) + d.minutes,
		});
	}
	return map;
}

/**
 * Columns of Monday-first weeks, the last one holding `today`; days after today are flagged
 * `isFuture` so they can be drawn empty. `months` marks the column where each month starts.
 */
export function buildHeatmap(
	days: DayActivity[],
	today: string,
	weeks: number,
): { weeks: HeatCell[][]; months: { column: number; label: string }[] } {
	const byDate = indexDays(days);
	const start = addDays(today, -weekdayIndex(today) - (weeks - 1) * 7);
	const columns: HeatCell[][] = [];
	const months: { column: number; label: string }[] = [];
	let lastMonth = -1;
	for (let w = 0; w < weeks; w++) {
		const column: HeatCell[] = [];
		for (let d = 0; d < 7; d++) {
			const date = addDays(start, w * 7 + d);
			const found = byDate.get(date);
			const attempts = found?.attempts ?? 0;
			column.push({
				date: date,
				attempts: attempts,
				minutes: found?.minutes ?? 0,
				level: activityLevel(attempts),
				isToday: date === today,
				isFuture: date > today,
			});
		}
		const month = new Date(toMs(column[0].date)).getUTCMonth();
		const firstOfMonthInColumn = column.find(c => c.date.endsWith('-01'));
		const labelMonth = firstOfMonthInColumn
			? new Date(toMs(firstOfMonthInColumn.date)).getUTCMonth()
			: w === 0
				? month
				: -1;
		if (labelMonth >= 0 && labelMonth !== lastMonth) {
			months.push({ column: w, label: `Th${labelMonth + 1}` });
			lastMonth = labelMonth;
		}
		columns.push(column);
	}
	// a label on the first column right before the next month's label would overlap it
	if (months.length > 1 && months[1].column - months[0].column < 3) months.shift();
	return { weeks: columns, months: months };
}

/** Totals over the days from `from` to `to`, both included. */
export function summarizeRange(
	days: DayActivity[],
	from: string,
	to: string,
): { activeDays: number; attempts: number; minutes: number } {
	const inRange = days.filter(d => d.date >= from && d.date <= to && d.attempts > 0);
	return {
		activeDays: new Set(inRange.map(d => d.date)).size,
		attempts: inRange.reduce((s, d) => s + d.attempts, 0),
		minutes: inRange.reduce((s, d) => s + d.minutes, 0),
	};
}

export type WeekDayState = 'done' | 'missed' | 'today' | 'upcoming';

export const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Monday to Sunday of the week holding `today`, each day practised, missed, today or ahead. */
export function currentWeek(
	days: DayActivity[],
	today: string,
): (DayActivity & { label: string; dayOfMonth: number; state: WeekDayState })[] {
	const byDate = indexDays(days);
	const monday = addDays(today, -weekdayIndex(today));
	return WEEKDAY_LABELS.map((label, i) => {
		const date = addDays(monday, i);
		const found = byDate.get(date);
		const attempts = found?.attempts ?? 0;
		let state: WeekDayState;
		if (attempts > 0) state = 'done';
		else if (date === today) state = 'today';
		else if (date < today) state = 'missed';
		else state = 'upcoming';
		return {
			date: date,
			attempts: attempts,
			minutes: found?.minutes ?? 0,
			label: label,
			dayOfMonth: Number(date.slice(8, 10)),
			state: state,
		};
	});
}

export function formatMinutes(minutes: number): string {
	if (minutes < 60) return `${minutes} phút`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}

const WEEKDAY_NAMES = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

/** "Thứ sáu, 13/11/2026" for a UTC day key. */
export function formatDayLabel(key: string): string {
	const d = new Date(toMs(key));
	const dd = String(d.getUTCDate()).padStart(2, '0');
	const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
	return `${WEEKDAY_NAMES[d.getUTCDay()]}, ${dd}/${mm}/${d.getUTCFullYear()}`;
}
