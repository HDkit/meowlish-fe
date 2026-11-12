import { describe, expect, it, vi } from 'vitest';
import {
	CURRENT_PASSWORD_INCORRECT,
	findMailCredentialId,
	submitPasswordChange,
	validatePasswordChange,
} from './change-password';

const form = { currentPassword: 'Old-pass1!', newPassword: 'New-pass1!', confirmPassword: 'New-pass1!' };

describe('validatePasswordChange', () => {
	it('requires the current password', () => {
		expect(validatePasswordChange({ ...form, currentPassword: '' })).toBe('Vui lòng nhập mật khẩu hiện tại');
	});

	it('rejects a mismatched confirmation', () => {
		expect(validatePasswordChange({ ...form, confirmPassword: 'other' })).toBe('Mật khẩu xác nhận không khớp');
	});

	it('accepts a complete form', () => {
		expect(validatePasswordChange(form)).toBeNull();
	});
});

describe('findMailCredentialId', () => {
	it('picks the mail credential, not the identity or the google one', () => {
		expect(findMailCredentialId([{ id: 'g', type: 'google' }, { id: 'm', type: 'mail' }])).toBe('m');
		expect(findMailCredentialId([{ id: 'g', type: 'google' }])).toBeNull();
	});
});

describe('submitPasswordChange', () => {
	it('sends the credential id, the current password and the new password', async () => {
		const update = vi.fn().mockResolvedValue({ data: null });
		await expect(submitPasswordChange(form, 'cred-1', update)).resolves.toEqual({ ok: true });
		expect(update).toHaveBeenCalledWith({ id: 'cred-1', currentPassword: 'Old-pass1!', password: 'New-pass1!' });
	});

	it('shows a 401 as an incorrect current password', async () => {
		const update = vi.fn().mockRejectedValue({ status: 401, body: { error: 'Wrong password' } });
		await expect(submitPasswordChange(form, 'cred-1', update)).resolves.toEqual({
			ok: false,
			message: CURRENT_PASSWORD_INCORRECT,
		});
	});

	it('does not call the API when the form is invalid', async () => {
		const update = vi.fn();
		const result = await submitPasswordChange({ ...form, currentPassword: '' }, 'cred-1', update);
		expect(result.ok).toBe(false);
		expect(update).not.toHaveBeenCalled();
	});

	it('does not call the API without a mail credential', async () => {
		const update = vi.fn();
		expect((await submitPasswordChange(form, null, update)).ok).toBe(false);
		expect(update).not.toHaveBeenCalled();
	});
});
