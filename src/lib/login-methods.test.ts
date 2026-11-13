import { describe, expect, it } from 'vitest';
import { loginMethodActions } from './login-methods';

const mail = { id: 'm', type: 'MAIL', mail: 'a@b.c' };
const google = { id: 'g', type: 'GOOGLE' };

describe('loginMethodActions', () => {
	it('offers only the missing method types', () => {
		expect(loginMethodActions([google], false)).toMatchObject({ canAddMail: true, canLinkGoogle: false });
		expect(loginMethodActions([mail], false)).toMatchObject({ canAddMail: false, canLinkGoogle: true });
		expect(loginMethodActions([mail, google], false)).toMatchObject({
			canAddMail: false,
			canLinkGoogle: false,
		});
	});

	it('changes the password only on the email method', () => {
		const actions = loginMethodActions([mail, google], false);
		expect(actions.canChangePassword(mail)).toBe(true);
		expect(actions.canChangePassword(google)).toBe(false);
	});

	it('never removes the last method', () => {
		expect(loginMethodActions([google], false).canRemove).toBe(false);
		expect(loginMethodActions([mail, google], false).canRemove).toBe(true);
	});

	it('keeps the demo account read-only', () => {
		const actions = loginMethodActions([mail], true);
		expect(actions).toMatchObject({ canAddMail: false, canLinkGoogle: false, canRemove: false });
		expect(actions.canChangePassword(mail)).toBe(false);
	});
});
