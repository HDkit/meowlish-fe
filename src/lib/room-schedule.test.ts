import { describe, expect, it } from 'vitest';
import { applyRoomSchedule, savedRoomSchedule } from './room-schedule';
import type { ChatRoom } from '@/types/client';

const room: ChatRoom = {
	id: 'r1',
	name: 'IELTS',
	scheduledLiveUrl: 'https://youtube.com/live/old',
	scheduledDate: Date.parse('2026-11-18T12:00:00.000Z'),
};

describe('applyRoomSchedule', () => {
	it('takes the pushed URL and time', () => {
		const next = applyRoomSchedule(room, {
			roomId: 'r1',
			scheduledLiveUrl: 'https://twitch.tv/new',
			scheduledDate: '2026-11-20T12:00:00.000Z',
		});
		expect(next).toMatchObject({
			scheduledLiveUrl: 'https://twitch.tv/new',
			scheduledDate: Date.parse('2026-11-20T12:00:00.000Z'),
		});
	});

	it('clears what the event clears', () => {
		const next = applyRoomSchedule(room, { roomId: 'r1', scheduledLiveUrl: null, scheduledDate: null });
		expect(next.scheduledLiveUrl).toBeUndefined();
		expect(next.scheduledDate).toBeUndefined();
	});

	it('ignores another room’s event', () => {
		const event = { roomId: 'r2', scheduledLiveUrl: 'https://twitch.tv/x', scheduledDate: null };
		expect(applyRoomSchedule(room, event)).toBe(room);
	});
});

describe('savedRoomSchedule', () => {
	it('replaces the URL and the time', () => {
		const time = Date.parse('2026-11-20T12:00:00.000Z');
		const next = savedRoomSchedule(room, { url: 'https://twitch.tv/new', time: time });
		expect(next).toMatchObject({ scheduledLiveUrl: 'https://twitch.tv/new', scheduledDate: time });
	});

	it('keeps fields the form left empty, and clears the ones asked', () => {
		expect(savedRoomSchedule(room, {})).toMatchObject({
			scheduledLiveUrl: room.scheduledLiveUrl,
			scheduledDate: room.scheduledDate,
		});
		const cleared = savedRoomSchedule(room, { clearUrl: true, clearTime: true });
		expect(cleared.scheduledLiveUrl).toBeUndefined();
		expect(cleared.scheduledDate).toBeUndefined();
	});
});
