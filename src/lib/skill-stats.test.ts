import { describe, expect, it } from 'vitest';
import { focusTags, levelOf, practiceSuggestion, skillTrend, sparklinePoints, tagRows } from './skill-stats';

const pts = (...ps: number[]) => ps.map(p => ({ percent: p }));

describe('skillTrend', () => {
	it('needs two points', () => {
		expect(skillTrend([])).toBeNull();
		expect(skillTrend(pts(50))).toBeNull();
	});

	it('compares the latest scores with the ones just before', () => {
		expect(skillTrend(pts(40, 60))).toEqual({ direction: 'up', delta: 20 });
		// last 3 (70, 80, 90) vs previous 3 (40, 50, 60)
		expect(skillTrend(pts(10, 40, 50, 60, 70, 80, 90))).toEqual({ direction: 'up', delta: 30 });
		expect(skillTrend(pts(80, 70, 60, 50))).toEqual({ direction: 'down', delta: -20 });
	});

	it('treats small changes as flat', () => {
		expect(skillTrend(pts(60, 62))).toEqual({ direction: 'flat', delta: 2 });
	});
});

describe('levelOf', () => {
	it('maps percentages to levels', () => {
		expect([20, 40, 60, 80].map(p => levelOf(p).tone)).toEqual(['low', 'mid', 'high', 'top']);
	});
});

describe('tagRows / focusTags', () => {
	const rows = tagRows([
		{ name: 'Inference', correct: 9, incorrect: 1, skipped: 0 },
		{ name: 'Tenses', correct: 1, incorrect: 2, skipped: 1 },
		{ name: 'Detail', correct: 4, incorrect: 4, skipped: 2 },
		{ name: 'Empty', correct: 0, incorrect: 0, skipped: 0 },
		{ name: 'Graphic', correct: 2, incorrect: 6, skipped: 2 },
	]);

	it('computes totals and sorts weakest first, dropping empty tags', () => {
		expect(rows.map(r => [r.name, r.accuracy, r.total])).toEqual([
			['Graphic', 20, 10],
			['Tenses', 25, 4],
			['Detail', 40, 10],
			['Inference', 90, 10],
		]);
	});

	it('suggests weak tags with enough questions', () => {
		expect(focusTags(rows).map(r => r.name)).toEqual(['Graphic', 'Detail']);
		expect(focusTags(rows, 1, 1).map(r => r.name)).toEqual(['Graphic']);
	});
});

describe('sparklinePoints', () => {
	it('maps 0–100 onto the box, top is 100', () => {
		expect(sparklinePoints([0, 100], 100, 40, 0)).toEqual([
			{ x: 0, y: 40 },
			{ x: 100, y: 0 },
		]);
	});

	it('centres a single point and clamps out-of-range values', () => {
		expect(sparklinePoints([150], 100, 40, 0)).toEqual([{ x: 50, y: 0 }]);
	});
});

describe('practiceSuggestion', () => {
	it('prefers the weakest tag with enough questions', () => {
		const s = practiceSuggestion(
			[{ skill: 'READING', attempts: 2, averagePercent: 30 }],
			[{ name: 'Graphic Based', correct: 1, incorrect: 5, skipped: 0 }],
		);
		expect(s?.title).toContain('Graphic Based');
		expect(s?.href).toBe('/test-selection?tag=Graphic%20Based');
	});

	it('falls back to the weakest practised skill, then to nothing', () => {
		expect(
			practiceSuggestion(
				[
					{ skill: 'READING', attempts: 2, averagePercent: 70 },
					{ skill: 'LISTENING', attempts: 1, averagePercent: 45 },
					{ skill: 'WRITING', attempts: 0 },
				],
				[{ name: 'Few', correct: 0, incorrect: 2, skipped: 0 }],
			)?.title,
		).toBe('luyện kỹ năng nghe');
		expect(practiceSuggestion([{ skill: 'READING', attempts: 3, averagePercent: 90 }], [])).toBeNull();
	});
});
