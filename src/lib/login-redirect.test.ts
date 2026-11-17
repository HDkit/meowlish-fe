import { describe, expect, it } from 'vitest';
import { loginUrl, postLoginPath, safeReturnPath } from './login-redirect';

describe('safeReturnPath', () => {
	it('keeps paths on this site', () => {
		expect(safeReturnPath('/blog/meo-hoc-tieng-anh')).toBe('/blog/meo-hoc-tieng-anh');
		expect(safeReturnPath('/blog?tags=ielts#comments')).toBe('/blog?tags=ielts#comments');
	});

	it('rejects other sites, so next is not an open redirect', () => {
		expect(safeReturnPath('https://evil.example')).toBeNull();
		expect(safeReturnPath('//evil.example')).toBeNull();
		expect(safeReturnPath('/\\evil.example')).toBeNull();
		expect(safeReturnPath('javascript:alert(1)')).toBeNull();
	});

	it('rejects the auth pages and empty values', () => {
		expect(safeReturnPath('/auth')).toBeNull();
		expect(safeReturnPath('/auth?mode=login')).toBeNull();
		expect(safeReturnPath('/auth/callback')).toBeNull();
		expect(safeReturnPath('')).toBeNull();
		expect(safeReturnPath(null)).toBeNull();
	});

	it('does not mistake other pages for the auth pages', () => {
		expect(safeReturnPath('/authors')).toBe('/authors');
	});
});

describe('loginUrl', () => {
	it('carries the page to return to', () => {
		expect(loginUrl('/blog/abc#comments')).toBe('/auth?mode=login&next=%2Fblog%2Fabc%23comments');
	});

	it('drops an unsafe page', () => {
		expect(loginUrl('//evil.example')).toBe('/auth?mode=login');
		expect(loginUrl()).toBe('/auth?mode=login');
	});
});

describe('postLoginPath', () => {
	it('returns to the requested page', () => {
		expect(postLoginPath('/blog/abc', false)).toBe('/blog/abc');
	});

	it('falls back to the home page of the role', () => {
		expect(postLoginPath(null, true)).toBe('/dashboard');
		expect(postLoginPath('//evil.example', false)).toBe('/test-selection');
	});
});
