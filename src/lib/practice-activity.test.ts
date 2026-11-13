import { describe, expect, it } from 'vitest';
import {
	activityLevel,
	addDays,
	buildHeatmap,
	currentWeek,
	formatDayLabel,
	formatMinutes,
	summarizeRange,
	weekdayIndex,
} from './practice-activity';

describe('date helpers', () => {
	it('adds days across month and year ends in UTC', () => {
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
		expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
	});

	it('numbers weekdays from Monday', () => {
		expect(weekdayIndex('2026-11-09')).toBe(0); // Monday
		expect(weekdayIndex('2026-11-15')).toBe(6); // Sunday
	});

	it('formats days and durations in Vietnamese', () => {
		expect(formatDayLabel('2026-11-13')).toBe('Thứ sáu, 13/11/2026');
		expect(formatMinutes(45)).toBe('45 phút');
		expect(formatMinutes(120)).toBe('2 giờ');
		expect(formatMinutes(95)).toBe('1 giờ 35 phút');
	});
});

describe('activityLevel', () => {
	it('uses fixed buckets', () => {
		expect([0, 1, 2, 3, 4, 5, 12].map(activityLevel)).toEqual([0, 1, 2, 3, 3, 4, 4]);
	});
});

describe('buildHeatmap', () => {
	const today = '2026-11-13'; // Friday

	it('ends with the week holding today, Monday first, future days flagged', () => {
		const { weeks } = buildHeatmap([], today, 4);
		expect(weeks).toHaveLength(4);
		expect(weeks.every(w => w.length === 7)).toBe(true);
		const last = weeks[3];
		expect(last[0].date).toBe('2026-11-09');
		expect(last[4]).toMatchObject({ date: today, isToday: true, isFuture: false });
		expect(last[5].isFuture).toBe(true);
		expect(weeks[0][0].date).toBe('2026-10-19');
	});

	it('buckets activity into the right cells and merges duplicate days', () => {
		const { weeks } = buildHeatmap(
			[
				{ date: '2026-11-10', attempts: 1, minutes: 20 },
				{ date: '2026-11-10', attempts: 2, minutes: 10 },
				{ date: '2026-11-13', attempts: 6, minutes: 90 },
				{ date: '2025-01-01', attempts: 3, minutes: 5 },
			],
			today,
			2,
		);
		const cells = weeks.flat();
		expect(cells.find(c => c.date === '2026-11-10')).toMatchObject({ attempts: 3, minutes: 30, level: 3 });
		expect(cells.find(c => c.date === today)?.level).toBe(4);
		expect(cells.reduce((s, c) => s + c.attempts, 0)).toBe(9);
	});

	it('labels the column where each month starts', () => {
		const { months } = buildHeatmap([], today, 10);
		expect(months.map(m => m.label)).toEqual(['Th9', 'Th10', 'Th11']);
		const nov = months.find(m => m.label === 'Th11');
		const { weeks } = buildHeatmap([], today, 10);
		expect(weeks[nov!.column].some(c => c.date === '2026-11-01')).toBe(true);
	});
});

describe('summarizeRange', () => {
	it('totals only the days inside the range', () => {
		const days = [
			{ date: '2026-11-01', attempts: 2, minutes: 30 },
			{ date: '2026-11-05', attempts: 1, minutes: 15 },
			{ date: '2026-10-31', attempts: 4, minutes: 60 },
		];
		expect(summarizeRange(days, '2026-11-01', '2026-11-30')).toEqual({
			activeDays: 2,
			attempts: 3,
			minutes: 45,
		});
	});
});

describe('currentWeek', () => {
	it('marks days done, missed, today and upcoming', () => {
		const week = currentWeek(
			[
				{ date: '2026-11-09', attempts: 1, minutes: 10 },
				{ date: '2026-11-11', attempts: 2, minutes: 40 },
			],
			'2026-11-13',
		);
		expect(week.map(d => d.label)).toEqual(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
		expect(week.map(d => d.state)).toEqual([
			'done',
			'missed',
			'done',
			'missed',
			'today',
			'upcoming',
			'upcoming',
		]);
		expect(week[2]).toMatchObject({ dayOfMonth: 11, attempts: 2, minutes: 40 });
	});

	it('shows today as done once practised', () => {
		const week = currentWeek([{ date: '2026-11-15', attempts: 1, minutes: 5 }], '2026-11-15');
		expect(week[6].state).toBe('done');
	});
});
