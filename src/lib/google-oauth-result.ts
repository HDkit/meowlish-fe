/** `?error=` codes the gateway's Google callback puts on /auth/callback (GoogleOAuthError). */
const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
	ACCESS_DENIED: 'Bạn đã hủy đăng nhập bằng Google.',
	SESSION_EXPIRED: 'Phiên liên kết Google đã hết hạn. Vui lòng thử lại.',
	GOOGLE_ALREADY_LINKED: 'Tài khoản của bạn đã liên kết với một tài khoản Google.',
	GOOGLE_ACCOUNT_IN_USE: 'Tài khoản Google này đã được liên kết với một tài khoản khác.',
	FORBIDDEN: 'Tài khoản này không thể thực hiện thao tác với Google (bị khóa hoặc là tài khoản demo).',
};

export const googleErrorMessage = (code: string): string =>
	GOOGLE_ERROR_MESSAGES[code] ?? 'Không thể hoàn tất thao tác với Google. Vui lòng thử lại.';

/** Where /auth/callback goes afterwards: linking starts and ends on the account page. */
export const googleFlowReturnPath = (flow: string | null, ok: boolean): string | null => {
	if (flow === 'link') return '/user';
	return ok ? null : '/auth?mode=login';
};
