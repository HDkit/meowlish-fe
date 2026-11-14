/**
 * Shared demo account for public testers (seeded by the backend's auth seed). The credentials
 * are public by design: the backend refuses password, sign-in method, username and phone
 * changes for it, and a reseed restores the password. Override or hide per deployment:
 * NEXT_PUBLIC_DEMO_EMAIL / NEXT_PUBLIC_DEMO_PASSWORD, NEXT_PUBLIC_DEMO_ACCOUNT=false.
 */
export const DEMO_ACCOUNT = {
	enabled: process.env.NEXT_PUBLIC_DEMO_ACCOUNT !== 'false',
	email: process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@lingriser.test',
	password: process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'Demo@12345',
};

export const DEMO_READ_ONLY_NOTICE =
	'Đây là tài khoản demo dùng chung: không thể đổi mật khẩu, tên đăng nhập hay phương thức đăng nhập. Dữ liệu có thể bị người khác thay đổi hoặc được đặt lại bất cứ lúc nào.';
