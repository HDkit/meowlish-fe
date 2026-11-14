import { describe, expect, it } from 'vitest';
import { attemptHref, isAttemptFinished } from './attempt-href';

describe('attemptHref', () => {
	it('sends an unfinished attempt back to the test screen', () => {
		expect(attemptHref({ id: 'a1' })).toBe('/test/do/a1');
		expect(attemptHref({ id: 'a1', endedAt: null })).toBe('/test/do/a1');
		expect(attemptHref({ id: 'a1', endedAt: '' })).toBe('/test/do/a1');
	});

	it('sends a submitted attempt to its result', () => {
		expect(attemptHref({ id: 'a1', endedAt: '2026-11-13T12:00:00Z' })).toBe('/results/a1');
		expect(attemptHref({ id: 'a1', endedAt: new Date('2026-11-13T12:00:00Z') })).toBe('/results/a1');
	});

	it('keeps seeded ids intact and escapes anything else', () => {
		expect(attemptHref({ id: 'seed-attempt-demo-toeic-lr2-2' })).toBe('/test/do/seed-attempt-demo-toeic-lr2-2');
		expect(attemptHref({ id: 'a/b', endedAt: '2026-11-13T12:00:00Z' })).toBe('/results/a%2Fb');
	});
});

describe('isAttemptFinished', () => {
	it('is true only once the attempt has an end time', () => {
		expect(isAttemptFinished({})).toBe(false);
		expect(isAttemptFinished({ endedAt: '2026-11-13T12:00:00Z' })).toBe(true);
	});
});
