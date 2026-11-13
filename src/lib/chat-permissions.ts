import type { ChatRoom } from '@/types/client';

/**
 * Mirrors the gateway's rules for chat rooms (apps/gateway/src/live-gateway): mods and admins create
 * rooms; admins delete or reschedule any room, mods only the rooms they created. A room without a
 * recorded owner is admin-only.
 */
export const canCreateRoom = (who: { isMod: boolean; isAdmin: boolean }): boolean => who.isMod || who.isAdmin;

export const canManageRoom = (
	who: { isMod: boolean; isAdmin: boolean; userId?: string },
	room: Pick<ChatRoom, 'createdBy'>,
): boolean => who.isAdmin || (who.isMod && !!room.createdBy && room.createdBy === who.userId);

/** The newer of the room's server preview and a message seen live in this session. */
export const latestOf = <T extends { createdAt: number }>(a?: T | null, b?: T | null): T | null =>
	!a ? (b ?? null) : !b ? a : a.createdAt >= b.createdAt ? a : b;
