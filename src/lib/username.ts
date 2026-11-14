/**
 * Usernames a user chooses (register, or changing it): 3-30 characters of lowercase letters,
 * digits, ".", "_" or "-", the rule of the backend (`libs/utils` `USERNAME_PATTERN`). Usernames
 * from before the rule stay valid until they are changed, so only check a new value.
 */
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

export const USERNAME_RULE = 'Tên đăng nhập gồm 3–30 ký tự: chữ thường không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang';

/** The error to show for a username, or undefined when it is allowed. */
export const usernameError = (username: string): string | undefined => {
	if (!username.trim()) return 'Tên đăng nhập là bắt buộc';
	return USERNAME_PATTERN.test(username) ? undefined : USERNAME_RULE;
};
