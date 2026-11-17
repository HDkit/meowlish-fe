import type { ChatRoom } from '@/types/client';

/** socket.io `room-schedule` from the live service: the room's schedule as saved, null when cleared. */
export type RoomScheduleEvent = {
	roomId: string;
	scheduledLiveUrl: string | null;
	/** ISO date-time */
	scheduledDate: string | null;
};

/** The room with the pushed schedule, or the room unchanged when the event is for another room. */
export function applyRoomSchedule(room: ChatRoom, event: RoomScheduleEvent): ChatRoom {
	if (event.roomId !== room.id) return room;
	const date = event.scheduledDate ? Date.parse(event.scheduledDate) : NaN;
	return {
		...room,
		scheduledLiveUrl: event.scheduledLiveUrl || undefined,
		scheduledDate: Number.isNaN(date) ? undefined : date,
	};
}

/**
 * The room after its own schedule form was saved: fields cleared, replaced, or left alone when the
 * form left them empty. `time` is a timestamp in milliseconds.
 */
export function savedRoomSchedule(
	room: ChatRoom,
	form: { url?: string; time?: number; clearUrl?: boolean; clearTime?: boolean },
): ChatRoom {
	return {
		...room,
		scheduledLiveUrl: form.clearUrl ? undefined : form.url || room.scheduledLiveUrl,
		scheduledDate: form.clearTime ? undefined : (form.time ?? room.scheduledDate),
	};
}
