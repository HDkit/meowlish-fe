import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnswerSync, type SyncStatus } from './answer-sync';

type Call = { op: 'answer' | 'remove'; q: string; a?: string };

/** Fake backend: records calls, keeps per-question answers, can fail on demand. */
const fakeApi = () => {
	const calls: Call[] = [];
	const server: Record<string, string[]> = {};
	const failures: Array<{ status: number }> = [];
	let gate: Promise<void> | undefined;
	const maybeFail = () => {
		const f = failures.shift();
		if (f) throw { status: f.status, body: { error: `HTTP ${f.status}` } };
	};
	return {
		calls,
		server,
		failNext: (...statuses: number[]) => failures.push(...statuses.map((s) => ({ status: s }))),
		hold: () => {
			let release!: () => void;
			gate = new Promise<void>((r) => (release = r));
			return () => {
				gate = undefined;
				release();
			};
		},
		api: {
			async answer(q: string, a: string) {
				calls.push({ op: 'answer', q: q, a: a });
				if (gate) await gate;
				maybeFail();
				server[q] = [...(server[q] ?? []), a];
			},
			async remove(q: string, a?: string) {
				calls.push({ op: 'remove', q: q, a: a });
				if (gate) await gate;
				maybeFail();
				server[q] = a === undefined ? [] : (server[q] ?? []).filter((x) => x !== a);
			},
		},
	};
};

const make = (api: ReturnType<typeof fakeApi>['api'], onStatus?: (s: SyncStatus) => void) =>
	new AnswerSync(api, { debounceMs: 800, retryDelaysMs: [10, 10], sleep: () => Promise.resolve(), onStatus });

describe('AnswerSync', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('sends one request with the final text after typing', async () => {
		const f = fakeApi();
		const sync = make(f.api);
		for (const text of ['a', 'ab', 'abc']) sync.set('w1', 'single', [text]);
		await vi.advanceTimersByTimeAsync(800);
		expect(f.calls).toEqual([{ op: 'answer', q: 'w1', a: 'abc' }]);
		expect(sync.hasPending).toBe(false);
	});

	it('never lets an older value land after a newer one', async () => {
		const f = fakeApi();
		const sync = make(f.api);
		const release = f.hold();
		sync.set('w1', 'single', ['first']);
		await vi.advanceTimersByTimeAsync(800); // "first" in flight, held
		sync.set('w1', 'single', ['second']);
		await vi.advanceTimersByTimeAsync(800);
		release();
		await sync.flushAll();
		expect(f.calls.map((c) => c.a)).toEqual(['first', 'second']);
		expect(sync.hasPending).toBe(false);
	});

	it('clears a single answer with one DELETE and skips no-op changes', async () => {
		const f = fakeApi();
		const sync = make(f.api);
		sync.seed('q1', 'single', ['A']);
		sync.set('q1', 'single', ['A']);
		await vi.advanceTimersByTimeAsync(800);
		expect(f.calls).toEqual([]);
		sync.set('q1', 'single', ['']);
		await vi.advanceTimersByTimeAsync(800);
		expect(f.calls).toEqual([{ op: 'remove', q: 'q1', a: undefined }]);
	});

	it('sends only the added and removed keys of a multi-choice answer', async () => {
		const f = fakeApi();
		const sync = make(f.api);
		sync.seed('m1', 'multi', ['A', 'B']);
		sync.set('m1', 'multi', ['B', 'C']);
		await vi.advanceTimersByTimeAsync(800);
		expect(f.calls).toEqual([
			{ op: 'remove', q: 'm1', a: 'A' },
			{ op: 'answer', q: 'm1', a: 'C' },
		]);
	});

	it('retries transient failures (409 version conflicts are final, 500s are not)', async () => {
		const f = fakeApi();
		const sync = make(f.api);
		f.failNext(500, 503);
		sync.set('q1', 'single', ['B']);
		await vi.advanceTimersByTimeAsync(800);
		await sync.flushAll();
		expect(f.server.q1).toEqual(['B']);
		expect(sync.hasPending).toBe(false);
	});

	it('reports a submitted attempt as a save error instead of retrying', async () => {
		const f = fakeApi();
		const statuses: SyncStatus[] = [];
		const sync = make(f.api, (s) => statuses.push(s));
		f.failNext(409);
		sync.set('q1', 'single', ['B']);
		const result = await sync.flushAll();
		expect(result).toEqual({ ok: false, failed: ['q1'] });
		expect(f.calls).toHaveLength(1);
		expect(statuses.at(-1)).toEqual({ state: 'error', failed: ['q1'], message: 'HTTP 409' });
	});

	it('flushAll sends what is still waiting for its debounce, then resolves', async () => {
		const f = fakeApi();
		const sync = make(f.api);
		sync.set('w1', 'single', ['essay']);
		sync.set('m1', 'multi', ['A']);
		expect(sync.hasPending).toBe(true);
		const result = await sync.flushAll();
		expect(result.ok).toBe(true);
		expect(f.server).toEqual({ w1: ['essay'], m1: ['A'] });
	});

	it('ignores changes after close()', async () => {
		const f = fakeApi();
		const sync = make(f.api);
		sync.close();
		sync.set('q1', 'single', ['A']);
		await vi.advanceTimersByTimeAsync(800);
		expect(f.calls).toEqual([]);
	});
});
