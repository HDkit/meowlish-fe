import { describe, expect, it } from 'vitest';
import { googleErrorMessage, googleFlowReturnPath } from './google-oauth-result';

describe('googleErrorMessage', () => {
	it('explains linking conflicts', () => {
		expect(googleErrorMessage('GOOGLE_ALREADY_LINKED')).toContain('đã liên kết');
		expect(googleErrorMessage('GOOGLE_ACCOUNT_IN_USE')).toContain('tài khoản khác');
	});

	it('has a generic message for unknown codes', () => {
		expect(googleErrorMessage('SOMETHING_NEW')).toContain('Vui lòng thử lại');
	});
});

describe('googleFlowReturnPath', () => {
	it('returns linking to the account page, success or not', () => {
		expect(googleFlowReturnPath('link', true)).toBe('/user');
		expect(googleFlowReturnPath('link', false)).toBe('/user');
	});

	it('sends a failed login back to the login page', () => {
		expect(googleFlowReturnPath(null, false)).toBe('/auth?mode=login');
		expect(googleFlowReturnPath(null, true)).toBeNull();
	});
});
