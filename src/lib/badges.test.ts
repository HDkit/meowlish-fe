import { describe, expect, it } from 'vitest';
import { buildBadgeViews, familyValue, nextBadge } from './badges';

const progress = {
	loginProgress: { total: 27, streak: 2, longestStreak: 12 },
	submissionProgress: { total: 15, goodScore: 3, perfectScore: 0 },
};

describe('badges', () => {
	it('measures streak badges by the longest streak', () => {
		expect(familyValue('loginStreak', progress)).toBe(12);
		expect(familyValue('attempts', null)).toBe(0);
	});

	it('marks earned badges and shows progress on locked ones', () => {
		const views = buildBadgeViews([], [{ name: 'TENTH_COMPLETE_ATTEMPT', date: '2026-11-01' }], progress);
		expect(views).toHaveLength(17);
		const tenth = views.find((b) => b.name === 'TENTH_COMPLETE_ATTEMPT')!;
		expect(tenth).toMatchObject({ earned: true, earnedAt: '2026-11-01', current: 10, title: 'Khởi động' });
		const hundredth = views.find((b) => b.name === 'HUNDREDTH_COMPLETE_ATTEMPT')!;
		expect(hundredth).toMatchObject({ earned: false, current: 15, target: 100 });
		expect(views.find((b) => b.name === 'LOGIN_ONE_MONTH')!.current).toBe(27);
	});

	it('keeps unknown backend badges with their own texts', () => {
		const views = buildBadgeViews([{ name: 'NEW_THING', displayName: 'New', description: 'Desc' }], [], progress);
		expect(views.find((b) => b.name === 'NEW_THING')).toMatchObject({ title: 'New', description: 'Desc' });
	});

	it('suggests the locked badge closest to done', () => {
		const views = buildBadgeViews([], [], progress);
		// 27/30 login days is the closest
		expect(nextBadge(views)?.name).toBe('LOGIN_ONE_MONTH');
	});
});
