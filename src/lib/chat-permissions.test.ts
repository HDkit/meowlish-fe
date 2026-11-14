import { describe, expect, it } from 'vitest';
import { canCreateRoom, canManageRoom, latestOf } from './chat-permissions';

const learner = { isMod: false, isAdmin: false, userId: 'u1' };
const mod = { isMod: true, isAdmin: false, userId: 'mod-1' };
const admin = { isMod: false, isAdmin: true, userId: 'admin' };

describe('chat room permissions', () => {
	it('lets only mods and admins create rooms', () => {
		expect(canCreateRoom(learner)).toBe(false);
		expect(canCreateRoom(mod)).toBe(true);
		expect(canCreateRoom(admin)).toBe(true);
	});

	it('lets admins manage any room and mods only their own', () => {
		expect(canManageRoom(admin, { createdBy: 'someone' })).toBe(true);
		expect(canManageRoom(admin, {})).toBe(true);
		expect(canManageRoom(mod, { createdBy: 'mod-1' })).toBe(true);
		expect(canManageRoom(mod, { createdBy: 'mod-2' })).toBe(false);
		expect(canManageRoom(mod, {})).toBe(false);
		expect(canManageRoom(learner, { createdBy: 'u1' })).toBe(false);
	});
});

describe('latestOf', () => {
	it('picks the newer message', () => {
		const old = { createdAt: 1 };
		const fresh = { createdAt: 2 };
		expect(latestOf(old, fresh)).toBe(fresh);
		expect(latestOf(fresh, old)).toBe(fresh);
		expect(latestOf(null, old)).toBe(old);
		expect(latestOf(undefined, undefined)).toBeNull();
	});
});
