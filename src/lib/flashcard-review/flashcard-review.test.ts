import { describe, expect, it } from 'vitest';
import {
	compareAnswer,
	diffWords,
	editSimilarity,
	expectedVariants,
	levenshtein,
	normalizeAnswer,
	tokenOverlap,
} from './compare';
import {
	applicableModes,
	buildDeck,
	countQualifying,
	seededRng,
	shuffle,
} from './deck';
import {
	buildRestartQueue,
	createSession,
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
	size: 'all',
	shuffle: false,
	ignoreAccents: false,
	...extra,
});

const opts = { ignoreAccents: false };

describe('normalizeAnswer', () => {
	it('ignores case, punctuation, apostrophes and extra whitespace', () => {
		expect(normalizeAnswer('  Don’t   STOP, now! ', opts)).toBe('dont stop now');
		expect(normalizeAnswer('well-known', opts)).toBe('well known');
	});
	it('keeps accents unless asked to drop them', () => {
		expect(normalizeAnswer('Con Mèo', opts)).toBe('con mèo');
		expect(normalizeAnswer('Con Mèo đen', { ignoreAccents: true })).toBe('con meo den');
	});
	it('treats composed and decomposed forms alike', () => {
		expect(normalizeAnswer('mèo', opts)).toBe(normalizeAnswer('mèo', opts));
	});
});

describe('similarity', () => {
	it('levenshtein', () => {
		expect(levenshtein('kitten', 'sitting')).toBe(3);
		expect(levenshtein('', 'abc')).toBe(3);
		expect(levenshtein('mèo', 'meo')).toBe(1);
	});
	it('editSimilarity and tokenOverlap are 0..1', () => {
		expect(editSimilarity('abc', 'abc')).toBe(1);
		expect(editSimilarity('', '')).toBe(1);
		expect(tokenOverlap('a b c', 'c b a')).toBe(1);
		expect(tokenOverlap('a b', 'c d')).toBe(0);
		expect(tokenOverlap('a a', 'a')).toBeCloseTo(2 / 3);
	});
	it('splits saved values into acceptable variants', () => {
		expect(expectedVariants('run (v); sprint')).toEqual(['run (v); sprint', 'run ; sprint', 'run', 'sprint']);
	});
});

describe('compareAnswer', () => {
	it('match / close / different / empty', () => {
		expect(compareAnswer('Beautiful!', 'beautiful', opts).verdict).toBe('match');
		expect(compareAnswer('beautifull', 'beautiful', opts).verdict).toBe('close');
		expect(compareAnswer('ugly', 'beautiful', opts).verdict).toBe('different');
		expect(compareAnswer('  ?! ', 'beautiful', opts).verdict).toBe('empty');
	});
	it('accepts any listed alternative', () => {
		expect(compareAnswer('sprint', 'run; sprint', opts).verdict).toBe('match');
		expect(compareAnswer('run', 'run (v)', opts).verdict).toBe('match');
	});
	it('accent toggle', () => {
		expect(compareAnswer('con meo', 'con mèo', opts).verdict).toBe('close');
		expect(compareAnswer('con meo', 'con mèo', { ignoreAccents: true }).verdict).toBe('match');
	});
	it('word overlap makes long definitions close', () => {
		expect(compareAnswer('một loại trái cây', 'loại trái cây ngọt', opts).verdict).toBe('close');
	});
});

describe('diffWords', () => {
	it('marks extra and missing words, keeping original spelling', () => {
		const d = diffWords('a big Cat', 'a cat sat', opts);
		expect(d.answer).toEqual([
			{ text: 'a', status: 'same' },
			{ text: 'big', status: 'extra' },
			{ text: 'Cat', status: 'same' },
		]);
		expect(d.expected.map(t => t.status)).toEqual(['same', 'same', 'missing']);
	});
	it('lone punctuation is never highlighted', () => {
		expect(diffWords('x', 'y - z', opts).expected[1]).toEqual({ text: '-', status: 'same' });
	});
});

describe('deck building', () => {
	const cards = [card('1', { notes: 'a note' }), card('2'), card('3', { definition: '  ' })];

	it('applicable modes need both fields', () => {
		expect(applicableModes(cards[0], ALL_MODES)).toEqual([...ALL_MODES]);
		expect(applicableModes(cards[1], ALL_MODES)).toEqual(['word-to-definition', 'definition-to-word']);
		expect(applicableModes(cards[2], ALL_MODES)).toEqual([]);
	});

	it('counts qualifying cards per mode selection', () => {
		expect(countQualifying(cards, ALL_MODES)).toBe(2);
		expect(countQualifying(cards, ['note-to-word'])).toBe(1);
		expect(countQualifying([...cards, cards[0]], ['note-to-word'])).toBe(1);
	});

	it('one question per card, in order when not shuffled', () => {
		const deck = buildDeck(cards, { modes: ['note-to-word', 'word-to-definition'], size: 'all', shuffle: false }, seededRng(1));
		expect(deck.map(q => q.cardId)).toEqual(['1', '2']);
		expect(deck[1].mode).toBe('word-to-definition');
	});

	it('cuts to the size and shuffles reproducibly', () => {
		const many = Array.from({ length: 30 }, (_, i) => card(String(i)));
		const a = buildDeck(many, { modes: ['word-to-definition'], size: 10, shuffle: true }, seededRng(42));
		const b = buildDeck(many, { modes: ['word-to-definition'], size: 10, shuffle: true }, seededRng(42));
		expect(a).toHaveLength(10);
		expect(a).toEqual(b);
		expect(a.map(q => q.cardId)).not.toEqual(many.slice(0, 10).map(c => c.id));
	});

	it('mixes modes across cards', () => {
		const many = Array.from({ length: 40 }, (_, i) => card(String(i)));
		const modes = new Set(buildDeck(many, settings(), seededRng(7)).map(q => q.mode));
		expect(modes).toEqual(new Set(['word-to-definition', 'definition-to-word']));
	});

	it('shuffle keeps every element', () => {
		const out = shuffle([1, 2, 3, 4, 5], seededRng(3));
		expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
	});
});

describe('session reducer', () => {
	const cards = [card('1'), card('2')];
	const start = (): ReviewSession =>
		createSession('u1', cards, settings({ modes: ['word-to-definition'] }), seededRng(1))!;

	it('returns null when no card qualifies', () => {
		expect(createSession('u1', cards, settings({ modes: ['note-to-word'] }), seededRng(1))).toBeNull();
	});

	it('plays through submit → grade → next → summary', () => {
		let s = start();
		expect(s.phase).toBe('playing');
		s = reviewReducer(s, { type: 'submit', answer: 'Nghĩa 1' });
		expect(s.phase).toBe('reveal');
		expect(s.answers['1:word-to-definition']).toMatchObject({ verdict: 'match', grade: 'correct' });
		s = reviewReducer(s, { type: 'grade', grade: 'incorrect' });
		expect(s.answers['1:word-to-definition'].grade).toBe('incorrect');
		// submitting again while revealing is ignored
		expect(reviewReducer(s, { type: 'submit', answer: 'x' })).toBe(s);
		s = reviewReducer(s, { type: 'next' });
		expect(s).toMatchObject({ phase: 'playing', index: 1 });
		s = reviewReducer(s, { type: 'skip' });
		expect(s.answers['2:word-to-definition']).toMatchObject({ skipped: true, grade: 'incorrect' });
		s = reviewReducer(s, { type: 'next' });
		expect(s.phase).toBe('summary');
		expect(summarize(s)).toMatchObject({ total: 2, correct: 0 });
	});

	it('pre-grades close answers as correct and different ones as incorrect', () => {
		let s = reviewReducer(start(), { type: 'submit', answer: 'nghia 1' });
		expect(s.answers['1:word-to-definition']).toMatchObject({ verdict: 'close', grade: 'correct' });
		s = reviewReducer(reviewReducer(s, { type: 'next' }), { type: 'submit', answer: 'nope' });
		expect(s.answers['2:word-to-definition']).toMatchObject({ verdict: 'different', grade: 'incorrect' });
	});

	it('updates the session copy of a card', () => {
		const s = reviewReducer(start(), { type: 'updateCard', card: card('1', { definition: 'mới' }) });
		expect(s.cards['1'].definition).toBe('mới');
		expect(reviewReducer(s, { type: 'updateCard', card: card('zzz') })).toBe(s);
	});

	it('restarts with missed cards or all cards', () => {
		let s = start();
		s = reviewReducer(reviewReducer(s, { type: 'submit', answer: 'nghĩa 1' }), { type: 'next' });
		s = reviewReducer(reviewReducer(s, { type: 'submit', answer: 'wrong' }), { type: 'next' });
		const missed = buildRestartQueue(s, 'missed', seededRng(2));
		expect(missed.map(q => q.cardId)).toEqual(['2']);
		const again = reviewReducer(s, { type: 'restart', queue: missed });
		expect(again).toMatchObject({ phase: 'playing', index: 0, round: 2, answers: {} });
		expect(buildRestartQueue(s, 'all', seededRng(2))).toHaveLength(2);
		expect(reviewReducer(s, { type: 'restart', queue: [] })).toBe(s);
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
