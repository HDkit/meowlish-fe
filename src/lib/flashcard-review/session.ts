import { compareAnswer } from './compare';
import { answerField, applicableModes, buildDeck, cardField, shuffle } from './deck';
import type { Grade, Question, ReviewCard, ReviewSettings, Rng, Verdict } from './types';

export const SESSION_VERSION = 1;

export interface AnswerRecord {
	answer: string;
	skipped: boolean;
	/** Automatic comparison at submit time; pre-selects the grade. */
	verdict: Verdict;
	/** The player's self-grade: this is what counts. */
	grade: Grade;
}

export type Phase = 'playing' | 'reveal' | 'summary';

export interface ReviewSession {
	version: typeof SESSION_VERSION;
	/** Whose session this is; a stored session of another user is ignored. */
	userId: string;
	settings: ReviewSettings;
	/** Session copies of the cards, by id (edits update these). */
	cards: Record<string, ReviewCard>;
	/** The cards picked for this session (what "Ôn lại tất cả" replays). */
	deckCardIds: string[];
	round: number;
	queue: Question[];
	index: number;
	phase: Phase;
	answers: Record<string, AnswerRecord>;
}

export type ReviewAction =
	| { type: 'submit'; answer: string }
	| { type: 'skip' }
	| { type: 'grade'; grade: Grade }
	| { type: 'next' }
	| { type: 'updateCard'; card: ReviewCard }
	| { type: 'setIgnoreAccents'; ignoreAccents: boolean }
	| { type: 'restart'; queue: Question[] };

export function gradeFor(verdict: Verdict): Grade {
	return verdict === 'match' || verdict === 'close' ? 'correct' : 'incorrect';
}

export function createSession(
	userId: string,
	cards: readonly ReviewCard[],
	settings: ReviewSettings,
	rng: Rng,
): ReviewSession | null {
	const queue = buildDeck(cards, settings, rng);
	if (queue.length === 0) return null;
	const all = new Map(cards.map(c => [c.id, c]));
	const byId: Record<string, ReviewCard> = {};
	for (const q of queue) {
		const card = all.get(q.cardId);
		if (card) byId[q.cardId] = card;
	}
	return {
		version: SESSION_VERSION,
		userId: userId,
		settings: settings,
		cards: byId,
		deckCardIds: queue.map(q => q.cardId),
		round: 1,
		queue: queue,
		index: 0,
		phase: 'playing',
		answers: {},
	};
}

export function currentQuestion(s: ReviewSession): Question | undefined {
	return s.phase === 'summary' ? undefined : s.queue[s.index];
}

export function expectedAnswer(s: ReviewSession, q: Question): string {
	const card = s.cards[q.cardId];
	return card ? cardField(card, answerField(q.mode)) : '';
}

export function reviewReducer(s: ReviewSession, action: ReviewAction): ReviewSession {
	const q = currentQuestion(s);
	switch (action.type) {
		case 'submit': {
			if (s.phase !== 'playing' || !q) return s;
			const { verdict } = compareAnswer(action.answer, expectedAnswer(s, q), s.settings);
			const record: AnswerRecord = {
				answer: action.answer,
				skipped: false,
				verdict: verdict,
				grade: gradeFor(verdict),
			};
			return { ...s, phase: 'reveal', answers: { ...s.answers, [q.key]: record } };
		}
		case 'skip': {
			if (s.phase !== 'playing' || !q) return s;
			const record: AnswerRecord = { answer: '', skipped: true, verdict: 'empty', grade: 'incorrect' };
			return { ...s, phase: 'reveal', answers: { ...s.answers, [q.key]: record } };
		}
		case 'grade': {
			const record = q && s.answers[q.key];
			if (s.phase !== 'reveal' || !q || !record) return s;
			return { ...s, answers: { ...s.answers, [q.key]: { ...record, grade: action.grade } } };
		}
		case 'next': {
			if (s.phase !== 'reveal') return s;
			const index = s.index + 1;
			return index >= s.queue.length
				? { ...s, index: s.queue.length, phase: 'summary' }
				: { ...s, index: index, phase: 'playing' };
		}
		case 'updateCard': {
			if (!s.cards[action.card.id]) return s;
			return { ...s, cards: { ...s.cards, [action.card.id]: action.card } };
		}
		case 'setIgnoreAccents':
			return { ...s, settings: { ...s.settings, ignoreAccents: action.ignoreAccents } };
		case 'restart': {
			if (action.queue.length === 0) return s;
			return { ...s, queue: action.queue, index: 0, phase: 'playing', answers: {}, round: s.round + 1 };
		}
	}
}

export interface SessionSummary {
	total: number;
	correct: number;
	missed: Question[];
}

export function summarize(s: ReviewSession): SessionSummary {
	const missed = s.queue.filter(q => s.answers[q.key]?.grade !== 'correct');
	return { total: s.queue.length, correct: s.queue.length - missed.length, missed: missed };
}

/**
 * The queue for the next round. 'missed' asks the cards graded wrong again, each in the same mode;
 * 'all' rebuilds the session's whole deck (modes picked again). Shuffled when the settings say so.
 * Cards that an edit made unaskable in a mode are dropped/reassigned.
 */
export function buildRestartQueue(s: ReviewSession, scope: 'missed' | 'all', rng: Rng): Question[] {
	if (scope === 'all') {
		const cards = s.deckCardIds.map(id => s.cards[id]).filter((c): c is ReviewCard => !!c);
		return buildDeck(cards, { ...s.settings, size: 'all' }, rng);
	}
	const missed = summarize(s).missed.filter(q => {
		const card = s.cards[q.cardId];
		return !!card && applicableModes(card, [q.mode]).length > 0;
	});
	return s.settings.shuffle ? shuffle(missed, rng) : missed;
}

/** Shape check for a session read back from storage. */
export function isReviewSession(value: unknown): value is ReviewSession {
	if (!value || typeof value !== 'object') return false;
	const v = value as Partial<ReviewSession>;
	return (
		v.version === SESSION_VERSION &&
		typeof v.userId === 'string' &&
		!!v.settings &&
		Array.isArray(v.settings.modes) &&
		!!v.cards &&
		typeof v.cards === 'object' &&
		Array.isArray(v.deckCardIds) &&
		Array.isArray(v.queue) &&
		typeof v.index === 'number' &&
		(v.phase === 'playing' || v.phase === 'reveal' || v.phase === 'summary') &&
		!!v.answers &&
		typeof v.answers === 'object' &&
		v.queue.every(q => !!q && typeof q.cardId === 'string' && !!v.cards?.[q.cardId]) &&
		(v.phase === 'summary' || v.index < v.queue.length)
	);
}
