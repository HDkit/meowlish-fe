import { extractApiErrorMessage } from './api-response';
import { refreshSession, type RefreshResult } from './api/auth-session';

/**
 * Change-password flow (POST /auth/credentials/mail/password). The gateway needs the
 * mail credential's ID, the current password and the new one; a wrong current
 * password is a 401.
 */
export type PasswordChangeForm = {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
};

export type UpdateMailPasswordBody = { id: string; currentPassword: string; password: string };

export const CURRENT_PASSWORD_INCORRECT = 'Mật khẩu hiện tại không đúng';
export const NO_MAIL_CREDENTIAL = 'Tài khoản chưa có phương thức đăng nhập bằng email';
export const SESSION_EXPIRED = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';

export const validatePasswordChange = (form: PasswordChangeForm): string | null => {
	if (!form.currentPassword) return 'Vui lòng nhập mật khẩu hiện tại';
	if (!form.newPassword) return 'Vui lòng nhập mật khẩu mới';
	if (form.newPassword.length < 6) return 'Mật khẩu mới phải có ít nhất 6 ký tự';
	if (form.newPassword !== form.confirmPassword) return 'Mật khẩu xác nhận không khớp';
	if (form.newPassword === form.currentPassword) return 'Mật khẩu mới phải khác mật khẩu hiện tại';
	return null;
};

/** Backend LoginType values are 'MAIL' / 'GOOGLE'; compare case-insensitively. */
export const isCredentialType = (type: string | undefined, expected: 'MAIL' | 'GOOGLE'): boolean =>
	type?.toUpperCase() === expected;

/** The password belongs to the mail credential, not to the identity. No mail credential -> null. */
export const findMailCredentialId = (credentials: ReadonlyArray<{ id: string; type?: string }>): string | null =>
	credentials.find((c) => isCredentialType(c.type, 'MAIL'))?.id ?? null;

export const passwordChangeErrorMessage = (err: unknown): string => {
	const status = (err as any)?.status ?? (err as any)?.statusCode;
	if (status === 401) return CURRENT_PASSWORD_INCORRECT;
	return extractApiErrorMessage(err, 'Không thể đổi mật khẩu.');
};

export type PasswordChangeResult = { ok: true } | { ok: false; message: string };

export const submitPasswordChange = async (
	form: PasswordChangeForm,
	credentialId: string | null,
	update: (body: UpdateMailPasswordBody) => Promise<unknown>,
	refresh: () => Promise<RefreshResult> = refreshSession,
): Promise<PasswordChangeResult> => {
	const invalid = validatePasswordChange(form);
	if (invalid) return { ok: false, message: invalid };
	if (!credentialId) return { ok: false, message: NO_MAIL_CREDENTIAL };
	// The password route never refreshes on a 401 (that 401 means a wrong current password),
	// so make sure the access cookie is fresh first and an expiry isn't misreported.
	if ((await refresh()) === 'expired') return { ok: false, message: SESSION_EXPIRED };
	try {
		await update({ id: credentialId, currentPassword: form.currentPassword, password: form.newPassword });
		return { ok: true };
	} catch (err) {
		return { ok: false, message: passwordChangeErrorMessage(err) };
	}
};
