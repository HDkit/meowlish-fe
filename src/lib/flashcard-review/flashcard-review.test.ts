import { describe, expect, it } from 'vitest';
import { applicableModes, buildDeck, seededRng, shuffle } from './deck';
import {
	buildRestartQueue,
	createSession,
	expectedAnswer,
	isReviewSession,
	reviewReducer,
	summarize,
	type ReviewSession,
} from './session';
import { clearSession, loadSession, saveSession, SESSION_STORAGE_KEY } from './storage';
import { ALL_MODES, type ReviewCard, type ReviewSettings } from './types';

const card = (id: string, extra: Partial<ReviewCard> = {}): ReviewCard => ({
	id: id,
	listId: 'l1',
	listName: 'List 1',
	authorId: 'u1',
	word: `word-${id}`,
	definition: `nghĩa ${id}`,
	examples: [],
	...extra,
});

const settings = (extra: Partial<ReviewSettings> = {}): ReviewSettings => ({
	listIds: ['l1'],
	modes: [...ALL_MODES],
	shuffle: false,
	...extra,
});

describe('deck', () => {
	const cards = [card('1', { notes: 'ghi chú 1' }), card('2'), card('3')];

	it('knows which modes a card supports', () => {
		expect(applicableModes(cards[0], ALL_MODES)).toEqual([...ALL_MODES]);
		expect(applicableModes(cards[1], ALL_MODES)).not.toContain('note-to-word');
	});

	it('asks EVERY card of the selected lists, once', () => {
		const deck = buildDeck([...cards, cards[0]], settings(), seededRng(1));
		expect(deck.map(q => q.cardId)).toEqual(['1', '2', '3']);
	});

	it('falls back to "Từ → Nghĩa" for a card none of the chosen modes fits', () => {
		const deck = buildDeck(cards, settings({ modes: ['note-to-word'] }), seededRng(1));
		expect(deck.map(q => q.mode)).toEqual(['note-to-word', 'word-to-definition', 'word-to-definition']);
	});

	it('shuffles reproducibly and keeps every card', () => {
		const many = Array.from({ length: 30 }, (_, i) => card(String(i)));
		const a = buildDeck(many, settings({ shuffle: true }), seededRng(7));
		const b = buildDeck(many, settings({ shuffle: true }), seededRng(7));
		expect(a).toEqual(b);
		expect(a).toHaveLength(30);
		expect(a.map(q => q.cardId)).not.toEqual(many.map(c => c.id));
		expect(shuffle([1, 2, 3], seededRng(3)).sort()).toEqual([1, 2, 3]);
	});
});

describe('session (no scoring)', () => {
	const start = (): ReviewSession =>
		createSession('u1', [card('1'), card('2')], settings({ modes: ['word-to-definition'] }), seededRng(1))!;

	it('records what the player wrote, reveals the saved value, then moves on', () => {
		let s = start();
		s = reviewReducer(s, { type: 'submit', answer: 'my guess' });
		expect(s.phase).toBe('reveal');
		expect(s.answers['1:word-to-definition']).toEqual({ answer: 'my guess', skipped: false });
		expect(expectedAnswer(s, s.queue[0])).toBe('nghĩa 1');
		s = reviewReducer(s, { type: 'next' });
		expect(s).toMatchObject({ phase: 'playing', index: 1 });
		s = reviewReducer(reviewReducer(s, { type: 'skip' }), { type: 'next' });
		expect(s.phase).toBe('summary');
		expect(summarize(s)).toEqual({ total: 2, skipped: 1 });
	});

	it('updates the session copy of a card', () => {
		const s = reviewReducer(start(), { type: 'updateCard', card: card('1', { definition: 'mới' }) });
		expect(s.cards['1'].definition).toBe('mới');
		expect(reviewReducer(s, { type: 'updateCard', card: card('zzz') })).toBe(s);
	});

	it('restarts over every card', () => {
		let s = start();
		s = reviewReducer(reviewReducer(s, { type: 'submit', answer: 'x' }), { type: 'next' });
		s = reviewReducer(reviewReducer(s, { type: 'submit', answer: 'y' }), { type: 'next' });
		const queue = buildRestartQueue(s, seededRng(2));
		expect(queue).toHaveLength(2);
		expect(reviewReducer(s, { type: 'restart', queue: queue })).toMatchObject({
			phase: 'playing',
			index: 0,
			round: 2,
			answers: {},
		});
		expect(reviewReducer(s, { type: 'restart', queue: [] })).toBe(s);
	});

	it('rejects sessions stored by an older version', () => {
		expect(isReviewSession({ ...start(), version: 1 })).toBe(false);
		expect(isReviewSession(start())).toBe(true);
	});
});

describe('storage', () => {
	const memory = () => {
		const map = new Map<string, string>();
		return {
			getItem: (k: string) => map.get(k) ?? null,
			setItem: (k: string, v: string) => void map.set(k, v),
			removeItem: (k: string) => void map.delete(k),
		};
	};
	const session = createSession('u1', [card('1')], settings(), seededRng(1))!;

	it('round-trips a session for the same user only', () => {
		const st = memory();
		saveSession(session, st);
		expect(isReviewSession(loadSession('u1', st))).toBe(true);
		expect(loadSession('u2', st)).toBeNull();
		clearSession(st);
		expect(loadSession('u1', st)).toBeNull();
	});

	it('ignores malformed data and throwing storage', () => {
		const st = memory();
		st.setItem(SESSION_STORAGE_KEY, '{not json');
		expect(loadSession('u1', st)).toBeNull();
		st.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...session, phase: 'weird' }));
		expect(loadSession('u1', st)).toBeNull();
		const broken = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('quota');
			},
			removeItem: () => {
				throw new Error('blocked');
			},
		};
		expect(loadSession('u1', broken)).toBeNull();
		expect(() => saveSession(session, broken)).not.toThrow();
		expect(() => clearSession(broken)).not.toThrow();
		expect(loadSession('u1', null)).toBeNull();
	});
});
