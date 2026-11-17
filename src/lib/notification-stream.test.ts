import { describe, expect, it, vi } from 'vitest';
import {
	STREAM_RETRY_DELAYS_MS,
	notificationStreamUrl,
	openNotificationStream,
	parseStreamNotification,
	type StreamSource,
} from './notification-stream';
import type { RefreshResult } from './api/auth-session';

class FakeSource implements StreamSource {
	readyState = 0;
	onopen: ((ev: Event) => unknown) | null = null;
	onerror: ((ev: Event) => unknown) | null = null;
	closed = false;
	private listeners: ((ev: MessageEvent) => void)[] = [];

	constructor(readonly url: string) {}

	addEventListener(_type: 'notification', listener: (ev: MessageEvent) => void) {
		this.listeners.push(listener);
	}
	close() {
		this.closed = true;
		this.readyState = 2;
	}
	open() {
		this.readyState = 1;
		this.onopen?.(new Event('open'));
	}
	push(data: string) {
		this.listeners.forEach(l => l({ data: data } as MessageEvent));
	}
	/** The browser gave up (non-200 answer): readyState CLOSED, then error. */
	refuse() {
		this.readyState = 2;
		this.onerror?.(new Event('error'));
	}
	/** A dropped connection the browser retries itself. */
	drop() {
		this.readyState = 0;
		this.onerror?.(new Event('error'));
	}
}

const notification = (id: string, recipientId = 'u1') =>
	JSON.stringify({
		id: id,
		recipientId: recipientId,
		type: 'system',
		title: 'Xin chào',
		message: 'Tin mới',
		isRead: false,
		createdAt: '2026-11-17T00:00:00.000Z',
	});

const setup = (refreshResults: RefreshResult[] = ['refreshed']) => {
	const sources: FakeSource[] = [];
	const timers: { fn: () => void; ms: number }[] = [];
	const onNotification = vi.fn();
	const onResync = vi.fn();
	const onExpired = vi.fn();
	const refresh = vi.fn(async () => refreshResults.shift() ?? 'refreshed');
	const stop = openNotificationStream({
		recipientId: 'u1',
		onNotification: onNotification,
		onResync: onResync,
		onExpired: onExpired,
		createSource: url => {
			const s = new FakeSource(url);
			sources.push(s);
			return s;
		},
		refresh: refresh,
		setTimer: (fn, ms) => timers.push({ fn: fn, ms: ms }),
		clearTimer: () => undefined,
	});
	const flush = () => new Promise(resolve => setTimeout(resolve, 0));
	return { sources, timers, onNotification, onResync, onExpired, refresh, stop, flush };
};

describe('parseStreamNotification', () => {
	it('reads a pushed notification', () => {
		expect(parseStreamNotification(notification('n1'))?.id).toBe('n1');
	});

	it('ignores anything else', () => {
		expect(parseStreamNotification('not json')).toBeNull();
		expect(parseStreamNotification('{"id":1}')).toBeNull();
		expect(parseStreamNotification(undefined)).toBeNull();
	});
});

describe('openNotificationStream', () => {
	it('subscribes to the caller’s own stream and forwards pushes', () => {
		const { sources, onNotification } = setup();
		expect(sources[0].url).toBe(notificationStreamUrl('u1'));
		expect(notificationStreamUrl('a/b')).toBe('/api/v1/notifications/stream/a%2Fb');
		sources[0].open();
		sources[0].push(notification('n1'));
		sources[0].push(notification('n2', 'someone-else'));
		sources[0].push('garbage');
		expect(onNotification).toHaveBeenCalledTimes(1);
		expect(onNotification.mock.calls[0][0].id).toBe('n1');
	});

	it('leaves dropped connections to the browser’s own retry', async () => {
		const { sources, refresh, flush } = setup();
		sources[0].open();
		sources[0].drop();
		await flush();
		expect(refresh).not.toHaveBeenCalled();
		expect(sources).toHaveLength(1);
	});

	it('refreshes the session after a refusal, reopens and asks for a resync', async () => {
		const { sources, timers, refresh, onResync, flush } = setup();
		sources[0].open();
		sources[0].refuse();
		await flush();
		expect(refresh).toHaveBeenCalledTimes(1);
		expect(sources[0].closed).toBe(true);
		expect(timers[0].ms).toBe(STREAM_RETRY_DELAYS_MS[0]);

		timers[0].fn();
		expect(sources).toHaveLength(2);
		expect(onResync).not.toHaveBeenCalled();
		sources[1].open();
		expect(onResync).toHaveBeenCalledTimes(1);
	});

	it('backs off while the stream keeps being refused, and resets once it opens', async () => {
		const { sources, timers, flush } = setup(['unavailable', 'unavailable', 'refreshed']);
		sources[0].refuse();
		await flush();
		timers[0].fn();
		sources[1].refuse();
		await flush();
		timers[1].fn();
		sources[2].open();
		sources[2].refuse();
		await flush();
		expect(timers.map(t => t.ms)).toEqual([
			STREAM_RETRY_DELAYS_MS[0],
			STREAM_RETRY_DELAYS_MS[1],
			STREAM_RETRY_DELAYS_MS[0],
		]);
	});

	it('stops when the session is gone', async () => {
		const { sources, timers, onExpired, flush } = setup(['expired']);
		sources[0].refuse();
		await flush();
		expect(onExpired).toHaveBeenCalledTimes(1);
		expect(timers).toHaveLength(0);
	});

	it('closes the stream and reopens nothing once stopped', async () => {
		const { sources, timers, stop, flush } = setup();
		sources[0].open();
		stop();
		expect(sources[0].closed).toBe(true);
		sources[0].refuse();
		await flush();
		expect(timers).toHaveLength(0);
	});
});
