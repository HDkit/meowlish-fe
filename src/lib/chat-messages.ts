import type { ChatMessage } from '@/types/client';

/** Prefix of the id a sent message gets until the server confirms it. */
export const LOCAL_ID_PREFIX = 'local-';

/** How far the stored message's time may be from the optimistic copy's (clock skew, latency). */
const MATCH_WINDOW_MS = 60_000;

/**
 * A room's messages, oldest first, without duplicates: by id, and dropping an optimistic copy
 * (`local-…`) once the real message (same sender and text, sent within a minute) is there, e.g.
 * from the chat history or a server without acknowledgements.
 */
export function roomMessages(all: readonly ChatMessage[], roomId: string): ChatMessage[] {
	const seen = new Set<string>();
	const inRoom = all.filter(m => m.roomId === roomId && !seen.has(m.id) && seen.add(m.id));
	const real = inRoom.filter(m => !m.id.startsWith(LOCAL_ID_PREFIX));
	return inRoom
		.filter(
			m =>
				!m.id.startsWith(LOCAL_ID_PREFIX) ||
				!real.some(
					r => r.uid === m.uid && r.message === m.message && Math.abs(r.createdAt - m.createdAt) <= MATCH_WINDOW_MS,
				),
		)
		.sort((a, b) => a.createdAt - b.createdAt);
}
