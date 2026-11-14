import { describe, expect, it } from 'vitest';
import { USERNAME_RULE, usernameError } from './username';

describe('usernameError', () => {
	it('accepts the backend charset', () => {
		expect(usernameError('nguyen.van_a-1')).toBeUndefined();
		expect(usernameError('abc')).toBeUndefined();
	});

	it('refuses spaces, upper case, accents and bad lengths', () => {
		for (const bad of ['Nguyễn Văn A', 'John', 'ab', 'a'.repeat(31), 'a+b@c']) expect(usernameError(bad)).toBe(USERNAME_RULE);
	});

	it('requires a value', () => {
		expect(usernameError('  ')).toBe('Tên đăng nhập là bắt buộc');
	});
});
