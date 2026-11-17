/**
 * Live notifications over SSE: GET /api/v1/notifications/stream/:recipientId (gateway → notification
 * service). Each push is `event: notification` with the same JSON as one item of the list endpoint.
 *
 * - A dropped connection (network, server restart) is retried by the browser itself, which sends
 *   `Last-Event-ID`; the server then replays what was missed, so nothing needs doing here.
 * - A refused connection (401 once the 15 min access cookie has expired, 403, 5xx) makes the browser
 *   give up for good (readyState CLOSED). Then the session is refreshed and a new stream opened after
 *   a backoff. A new EventSource can't send `Last-Event-ID`, so `onResync` runs once it is open and
 *   the caller reloads the list to catch what arrived in between.
 * - If the refresh says the session is gone, the stream stops (`onExpired`).
 */
import { refreshSession, type RefreshResult } from './api/auth-session';
import type { NotificationResponse } from './api/services/NotificationService';

/** Waits before reopening a refused stream; the last step repeats. */
export const STREAM_RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

export const notificationStreamUrl = (recipientId: string): string =>
	`/api/v1/notifications/stream/${encodeURIComponent(recipientId)}`;

/** The pushed notification, or null for anything that isn't one. */
export const parseStreamNotification = (raw: unknown): NotificationResponse | null => {
	if (typeof raw !== 'string') return null;
	try {
		const n = JSON.parse(raw) as Partial<NotificationResponse> | null;
		if (!n || typeof n.id !== 'string' || typeof n.recipientId !== 'string' || typeof n.createdAt !== 'string') {
			return null;
		}
		return n as NotificationResponse;
	} catch {
		return null;
	}
};

/** The parts of EventSource used here, so tests can pass a fake. */
export interface StreamSource {
	readonly readyState: number;
	onopen: ((ev: Event) => unknown) | null;
	onerror: ((ev: Event) => unknown) | null;
	addEventListener(type: 'notification', listener: (ev: MessageEvent) => void): void;
	close(): void;
}

const CLOSED = 2; // EventSource.CLOSED (not defined outside the browser)

export interface NotificationStreamOptions {
	recipientId: string;
	onNotification: (notification: NotificationResponse) => void;
	/** A new stream is open after a refused one: reload the list, pushes may have been missed. */
	onResync: () => void;
	/** The session is gone; the stream has stopped. */
	onExpired?: () => void;
	createSource?: (url: string) => StreamSource;
	refresh?: () => Promise<RefreshResult>;
	setTimer?: (fn: () => void, ms: number) => unknown;
	clearTimer?: (handle: unknown) => void;
}

/** Opens the stream and keeps it open until the returned function is called. */
export function openNotificationStream({
	recipientId,
	onNotification,
	onResync,
	onExpired,
	createSource = url => new EventSource(url, { withCredentials: true }),
	refresh = refreshSession,
	setTimer = (fn, ms) => setTimeout(fn, ms),
	clearTimer = handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
}: NotificationStreamOptions): () => void {
	let source: StreamSource | null = null;
	let timer: unknown = null;
	let failures = 0;
	let stopped = false;

	const connect = (resync: boolean) => {
		if (stopped) return;
		const current = createSource(notificationStreamUrl(recipientId));
		source = current;
		current.addEventListener('notification', ev => {
			const notification = parseStreamNotification(ev.data);
			if (notification && notification.recipientId === recipientId) onNotification(notification);
		});
		current.onopen = () => {
			failures = 0;
			if (resync) {
				resync = false;
				onResync();
			}
		};
		current.onerror = () => {
			// CONNECTING: the browser retries on its own (with Last-Event-ID). CLOSED: it gave up.
			if (stopped || source !== current || current.readyState !== CLOSED) return;
			current.close();
			source = null;
			void recover();
		};
	};

	const recover = async () => {
		const delay = STREAM_RETRY_DELAYS_MS[Math.min(failures, STREAM_RETRY_DELAYS_MS.length - 1)];
		failures += 1;
		// Most refusals are an expired access cookie: refresh it before trying again.
		const result = await refresh();
		if (stopped) return;
		if (result === 'expired') {
			stopped = true;
			onExpired?.();
			return;
		}
		timer = setTimer(() => {
			timer = null;
			connect(true);
		}, delay);
	};

	connect(false);

	return () => {
		stopped = true;
		if (timer !== null) clearTimer(timer);
		timer = null;
		source?.close();
		source = null;
	};
}
