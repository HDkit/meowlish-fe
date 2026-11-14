import { describe, expect, it } from 'vitest';
import { roomMessages } from './chat-messages';

const msg = (id: string, message: string, createdAt: number, uid = 'me', roomId = 'r1') => ({
	id: id,
	roomId: roomId,
	uid: uid,
	message: message,
	createdAt: createdAt,
});

describe('roomMessages', () => {
	it('drops the optimistic copy once the real message is there', () => {
		const shown = roomMessages([msg('local-1', 'hi', 1000), msg('real-1', 'hi', 1800)], 'r1');
		expect(shown.map(m => m.id)).toEqual(['real-1']);
	});

	it('keeps an optimistic message until it is confirmed, and same text sent again later', () => {
		expect(roomMessages([msg('local-1', 'hi', 1000)], 'r1')).toHaveLength(1);
		const later = roomMessages([msg('real-1', 'hi', 1000), msg('local-2', 'hi', 500_000)], 'r1');
		expect(later.map(m => m.id)).toEqual(['real-1', 'local-2']);
	});

	it("does not merge someone else's identical message, and sorts by time", () => {
		const shown = roomMessages([msg('real-2', 'ok', 3000, 'other'), msg('local-1', 'ok', 2000)], 'r1');
		expect(shown.map(m => m.id)).toEqual(['local-1', 'real-2']);
	});

	it('keeps only the room and removes repeated ids', () => {
		const shown = roomMessages([msg('a', 'x', 1), msg('a', 'x', 1), msg('b', 'y', 2, 'me', 'r2')], 'r1');
		expect(shown.map(m => m.id)).toEqual(['a']);
	});
});
