import { describe, expect, it } from 'vitest';
import { CURRENT_VERSION, RELEASES } from './changelog';
import { AWAY_THRESHOLD_MS, isSuppressedRoute, shouldShowWhatsNew } from './whats-new';

const NOW = Date.UTC(2026, 10, 12);
const DAY = 24 * 60 * 60 * 1000;
const base = { currentVersion: '0.8.0', now: NOW };

describe('shouldShowWhatsNew', () => {
	it('shows on a first visit', () => {
		expect(shouldShowWhatsNew({ ...base, lastSeenVersion: null, lastVisitAt: null })).toBe(true);
	});

	it('shows when a newer version was released', () => {
		expect(shouldShowWhatsNew({ ...base, lastSeenVersion: '0.7.0', lastVisitAt: NOW - DAY })).toBe(true);
	});

	it('shows again after a long absence', () => {
		expect(shouldShowWhatsNew({ ...base, lastSeenVersion: '0.8.0', lastVisitAt: NOW - AWAY_THRESHOLD_MS })).toBe(true);
	});

	it('stays hidden for a recent visitor on the current version', () => {
		expect(shouldShowWhatsNew({ ...base, lastSeenVersion: '0.8.0', lastVisitAt: NOW - DAY })).toBe(false);
	});
});

describe('isSuppressedRoute', () => {
	it('never interrupts an exam in progress or the changelog itself', () => {
		expect(isSuppressedRoute('/test/do/3')).toBe(true);
		expect(isSuppressedRoute('/changelog')).toBe(true);
		expect(isSuppressedRoute('/dashboard')).toBe(false);
		expect(isSuppressedRoute('/test/3')).toBe(false);
	});
});

describe('changelog data', () => {
	it('lists releases newest first with unique versions', () => {
		const dates = RELEASES.map(r => r.date);
		expect([...dates].sort().reverse()).toEqual(dates);
		expect(new Set(RELEASES.map(r => r.version)).size).toBe(RELEASES.length);
	});

	it('keeps package.json in sync with the current release', async () => {
		const pkg = await import('../../package.json');
		expect(pkg.version).toBe(CURRENT_VERSION);
	});

	it('speaks to users, not developers', () => {
		const jargon = /\b(api|id|ids|grpc|dto|schema|migration|refactor|cursor|queue|cookie|httponly|hydration|seo|next\.js|react|radix|playwright|vitest|e2e|429|404|409|backend|frontend|endpoint|cache)\b/i;
		for (const release of RELEASES) {
			for (const text of [release.title, release.summary ?? '', ...release.changes.map(c => c.text)]) {
				expect(text, `v${release.version}: ${text}`).not.toMatch(jargon);
			}
		}
	});
});
