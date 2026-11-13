import { isCredentialType } from './change-password';

/** A sign-in method from GET /auth/credentials. `mail` is set only for MAIL credentials. */
export type LoginMethod = { id: string; type?: string; mail?: string };

/**
 * What the account page may offer for the sign-in methods. The backend allows one method per type
 * (one email, one Google account), refuses to remove the last one, and keeps the demo account's
 * methods read-only. A password exists only on the email method.
 */
export const loginMethodActions = (methods: ReadonlyArray<LoginMethod>, isDemo: boolean) => {
	const hasMail = methods.some((m) => isCredentialType(m.type, 'MAIL'));
	const hasGoogle = methods.some((m) => isCredentialType(m.type, 'GOOGLE'));
	return {
		canAddMail: !isDemo && !hasMail,
		canLinkGoogle: !isDemo && !hasGoogle,
		canRemove: !isDemo && methods.length > 1,
		canChangePassword: (method: LoginMethod) => !isDemo && isCredentialType(method.type, 'MAIL'),
	};
};
