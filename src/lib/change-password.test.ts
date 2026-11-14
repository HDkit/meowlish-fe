import { describe, expect, it, vi } from 'vitest';
import {
	CURRENT_PASSWORD_INCORRECT,
	NO_MAIL_CREDENTIAL,
	SESSION_EXPIRED,
	findMailCredentialId,
	submitPasswordChange,
	validatePasswordChange,
} from './change-password';

const refreshed = () => Promise.resolve('refreshed' as const);
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
	it('picks the MAIL credential (backend LoginType values), case-insensitively', () => {
		expect(findMailCredentialId([{ id: 'g', type: 'GOOGLE' }, { id: 'm', type: 'MAIL' }])).toBe('m');
		expect(findMailCredentialId([{ id: 'm', type: 'mail' }])).toBe('m');
	});

	it('never falls back to the Google credential', () => {
		expect(findMailCredentialId([{ id: 'g', type: 'GOOGLE' }])).toBeNull();
		expect(findMailCredentialId([{ id: 'x', type: 'OTHER' }])).toBeNull();
	});
});

describe('submitPasswordChange', () => {
	it('sends the credential id, the current password and the new password', async () => {
		const update = vi.fn().mockResolvedValue({ data: null });
		await expect(submitPasswordChange(form, 'cred-1', update, refreshed)).resolves.toEqual({ ok: true });
		expect(update).toHaveBeenCalledWith({ id: 'cred-1', currentPassword: 'Old-pass1!', password: 'New-pass1!' });
	});

	it('shows a 401 as an incorrect current password', async () => {
		const update = vi.fn().mockRejectedValue({ status: 401, body: { error: 'Wrong password' } });
		await expect(submitPasswordChange(form, 'cred-1', update, refreshed)).resolves.toEqual({
			ok: false,
			message: CURRENT_PASSWORD_INCORRECT,
		});
	});

	it('does not call the API when the form is invalid', async () => {
		const update = vi.fn();
		const result = await submitPasswordChange({ ...form, currentPassword: '' }, 'cred-1', update, refreshed);
		expect(result.ok).toBe(false);
		expect(update).not.toHaveBeenCalled();
	});

	it('does not call the API without a mail credential', async () => {
		const update = vi.fn();
		expect(await submitPasswordChange(form, null, update, refreshed)).toEqual({ ok: false, message: NO_MAIL_CREDENTIAL });
		expect(update).not.toHaveBeenCalled();
	});

	it('refreshes the session before submitting', async () => {
		const order: string[] = [];
		const refresh = vi.fn(async () => {
			order.push('refresh');
			return 'refreshed' as const;
		});
		const update = vi.fn(async () => {
			order.push('update');
		});
		await submitPasswordChange(form, 'cred-1', update, refresh);
		expect(order).toEqual(['refresh', 'update']);
	});

	it('reports an expired session instead of a wrong password', async () => {
		const update = vi.fn();
		const result = await submitPasswordChange(form, 'cred-1', update, async () => 'expired' as const);
		expect(result).toEqual({ ok: false, message: SESSION_EXPIRED });
		expect(update).not.toHaveBeenCalled();
	});

	it('still submits when the refresh is unavailable (429/network)', async () => {
		const update = vi.fn().mockResolvedValue(undefined);
		const result = await submitPasswordChange(form, 'cred-1', update, async () => 'unavailable' as const);
		expect(result).toEqual({ ok: true });
	});
});
