/**
 * Keeps an attempt's answers in sync with the backend, one queue per question.
 *
 * The UI calls `set()` on every change. Each question remembers what the user wants (`desired`)
 * and what the server has confirmed (`confirmed`); after a short idle delay it sends only the
 * difference, one request at a time, and loops until the two match. So typing "abc" sends one
 * POST "abc" instead of a burst of racing POST/DELETE pairs, and an older request can never land
 * after a newer one.
 *
 * Backend semantics (exam service `Attempt.answer` / `deleteAnswer`):
 * - single-answer types (MCQ, Fill, FillAny, Writing): POST replaces the value; DELETE without an
 *   answer clears it.
 * - multi-answer types: POST adds one key, DELETE removes one key.
 */

export type AnswerKind = 'single' | 'multi';

export interface AnswerApi {
	answer(questionId: string, answer: string): Promise<unknown>;
	/** `answer` undefined clears every answer of the question. */
	remove(questionId: string, answer?: string): Promise<unknown>;
}

export type SyncStatus =
	| { state: 'saved' }
	| { state: 'saving'; pending: number }
	| { state: 'error'; failed: string[]; message: string };

export interface AnswerSyncOptions {
	debounceMs?: number;
	/** Delays between retries of a failed request; its length is the number of retries. */
	retryDelaysMs?: number[];
	onStatus?: (status: SyncStatus) => void;
	/** Injected for tests. */
	sleep?: (ms: number) => Promise<void>;
}

type Entry = {
	kind: AnswerKind;
	desired: string[];
	confirmed: string[];
	timer?: ReturnType<typeof setTimeout>;
	running?: Promise<void>;
	error?: string;
};

const statusOf = (err: unknown): number | undefined => {
	const e = err as { status?: unknown; body?: { statusCode?: unknown } } | null;
	const status = e?.status ?? e?.body?.statusCode;
	return typeof status === 'number' ? status : undefined;
};

/** The attempt can no longer change (submitted: 409, time up: 403): retrying is pointless. */
const isFinal = (err: unknown) => {
	const status = statusOf(err);
	return status === 403 || status === 409 || status === 404;
};

const messageOf = (err: unknown): string => {
	const e = err as { body?: { error?: unknown; message?: unknown }; message?: unknown } | null;
	const text = e?.body?.error ?? e?.body?.message ?? e?.message;
	return typeof text === 'string' && text ? text : 'Không thể lưu câu trả lời';
};

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export class AnswerSync {
	private readonly entries = new Map<string, Entry>();
	private readonly debounceMs: number;
	private readonly retryDelaysMs: number[];
	private readonly sleep: (ms: number) => Promise<void>;
	private closed = false;

	constructor(
		private readonly api: AnswerApi,
		private readonly options: AnswerSyncOptions = {},
	) {
		this.debounceMs = options.debounceMs ?? 800;
		this.retryDelaysMs = options.retryDelaysMs ?? [1000, 2000, 4000];
		this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
	}

	/** What the server already has (answers restored when the attempt loads). */
	seed(questionId: string, kind: AnswerKind, answers: string[]): void {
		this.entries.set(questionId, { kind: kind, desired: [...answers], confirmed: [...answers] });
	}

	/** Records the user's current answers for a question and schedules a save. */
	set(questionId: string, kind: AnswerKind, answers: string[]): void {
		if (this.closed) return;
		const entry = this.entries.get(questionId) ?? { kind: kind, desired: [], confirmed: [] };
		entry.kind = kind;
		entry.desired = kind === 'single' ? answers.filter((a) => a !== '').slice(0, 1) : [...answers];
		entry.error = undefined;
		this.entries.set(questionId, entry);
		clearTimeout(entry.timer);
		entry.timer = setTimeout(() => void this.drain(questionId), this.debounceMs);
		this.report();
	}

	/** True while any question has changes the server hasn't confirmed. */
	get hasPending(): boolean {
		for (const entry of this.entries.values()) if (!same(entry.desired, entry.confirmed)) return true;
		return false;
	}

	/**
	 * Sends every pending change now and waits for all of them (including requests already in
	 * flight). Resolves with the questions that still could not be saved.
	 */
	async flushAll(): Promise<{ ok: boolean; failed: string[] }> {
		const ids = [...this.entries.keys()];
		for (const id of ids) clearTimeout(this.entries.get(id)?.timer);
		await Promise.all(ids.map((id) => this.drain(id)));
		const failed = ids.filter((id) => {
			const entry = this.entries.get(id);
			return entry && !same(entry.desired, entry.confirmed);
		});
		return { ok: failed.length === 0, failed: failed };
	}

	/** Stops accepting changes (after submit). Pending work still finishes. */
	close(): void {
		this.closed = true;
		for (const entry of this.entries.values()) clearTimeout(entry.timer);
	}

	/** One worker per question: re-checks after each request, so late edits are never lost. */
	private drain(questionId: string): Promise<void> {
		const entry = this.entries.get(questionId);
		if (!entry) return Promise.resolve();
		if (entry.running) {
			// a worker is already looping; it picks up the latest `desired` before it stops
			return entry.running;
		}
		const run = (async () => {
			while (!same(entry.desired, entry.confirmed)) {
				const target = [...entry.desired];
				try {
					await this.sendWithRetry(questionId, entry, target);
				} catch (err) {
					entry.error = messageOf(err);
					return;
				}
			}
		})();
		entry.running = run;
		// Cleared after the assignment above: a worker with nothing to send finishes synchronously,
		// and clearing inside it would leave this settled promise in `running` forever.
		void run.finally(() => {
			if (entry.running === run) entry.running = undefined;
			this.report();
		});
		this.report();
		return run;
	}

	/** Moves the server from `entry.confirmed` to `target`, updating `confirmed` as it goes. */
	private async sendWithRetry(questionId: string, entry: Entry, target: string[]): Promise<void> {
		const step = async () => {
			if (entry.kind === 'single') {
				if (target.length === 0) {
					await this.removeTolerant(questionId);
					entry.confirmed = [];
				} else {
					await this.api.answer(questionId, target[0]);
					entry.confirmed = [target[0]];
				}
				return;
			}
			for (const key of entry.confirmed.filter((k) => !target.includes(k))) {
				await this.removeTolerant(questionId, key);
				entry.confirmed = entry.confirmed.filter((k) => k !== key);
			}
			for (const key of target.filter((k) => !entry.confirmed.includes(k))) {
				await this.api.answer(questionId, key);
				entry.confirmed = [...entry.confirmed, key];
			}
		};
		for (let attempt = 0; ; attempt++) {
			try {
				await step();
				return;
			} catch (err) {
				if (isFinal(err) || attempt >= this.retryDelaysMs.length) throw err;
				await this.sleep(this.retryDelaysMs[attempt]);
			}
		}
	}

	/** Removing something the server doesn't have (404 "Answer not found") is already done. */
	private async removeTolerant(questionId: string, answer?: string): Promise<void> {
		try {
			await this.api.remove(questionId, answer);
		} catch (err) {
			if (statusOf(err) !== 404) throw err;
		}
	}

	private report(): void {
		const onStatus = this.options.onStatus;
		if (!onStatus) return;
		const failed: string[] = [];
		let pending = 0;
		let message = '';
		for (const [id, entry] of this.entries) {
			if (entry.error) {
				failed.push(id);
				message = entry.error;
			} else if (!same(entry.desired, entry.confirmed)) pending++;
		}
		if (failed.length > 0) onStatus({ state: 'error', failed: failed, message: message });
		else if (pending > 0) onStatus({ state: 'saving', pending: pending });
		else onStatus({ state: 'saved' });
	}
}

/**
 * Sync engines of attempts whose saves may still be running, so another page (e.g. the exam page's
 * "submit and start new") can wait for them before ending the attempt. A test page registers its
 * engine and leaves it here after unmounting until its last flush has finished.
 */
const liveSyncs = new Map<string, AnswerSync>();

export const registerAttemptSync = (attemptId: string, sync: AnswerSync): (() => void) => {
	liveSyncs.set(attemptId, sync);
	return () => {
		void sync.flushAll().finally(() => {
			if (liveSyncs.get(attemptId) === sync) liveSyncs.delete(attemptId);
		});
	};
};

/** Waits until every answer of `attemptId` saved on this page load has reached the server. */
export const flushAttemptSaves = async (attemptId: string): Promise<void> => {
	await liveSyncs.get(attemptId)?.flushAll();
};
