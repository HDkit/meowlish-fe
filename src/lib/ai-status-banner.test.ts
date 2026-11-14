import { describe, expect, it } from 'vitest';
import { isBannerHidden, noticeKey } from './ai-status-banner';

const notice = { title: 'Dịch vụ AI tạm thời không hoạt động', message: 'A', english: 'B' };

describe('AI status banner visibility', () => {
	it('shows the banner until the user hides it', () => {
		expect(isBannerHidden(null, notice)).toBe(false);
		expect(isBannerHidden(noticeKey(notice), notice)).toBe(true);
	});

	it('shows a changed notice again even if an older one was hidden', () => {
		const hiddenOld = noticeKey(notice);
		expect(isBannerHidden(hiddenOld, { ...notice, message: 'Bảo trì đến 20:00' })).toBe(false);
	});

	it('keys on the notice content, not on object identity', () => {
		expect(noticeKey({ ...notice })).toBe(noticeKey(notice));
	});
});
