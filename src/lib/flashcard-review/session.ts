import { answerField, buildDeck, cardField } from './deck';
import type { Question, ReviewCard, ReviewSettings, Rng } from './types';

/** Bumped when the stored shape changes, so an older saved session is ignored. */
export const SESSION_VERSION = 2;

/** What the player wrote for a question. Nothing is scored: they compare it with the card themselves. */
export interface AnswerRecord {
	answer: string;
	skipped: boolean;
}

export type Phase = 'playing' | 'reveal' | 'summary';

export interface ReviewSession {
	version: typeof SESSION_VERSION;
	/** Whose session this is; a stored session of another user is ignored. */
	userId: string;
	settings: ReviewSettings;
	/** Session copies of the cards, by id (edits update these). */
	cards: Record<string, ReviewCard>;
	/** Every card of the selected lists (what "Ôn lại từ đầu" replays). */
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
	| { type: 'next' }
	| { type: 'updateCard'; card: ReviewCard }
	| { type: 'restart'; queue: Question[] };

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

/** The saved value the player compares their answer with. */
export function expectedAnswer(s: ReviewSession, q: Question): string {
	const card = s.cards[q.cardId];
	return card ? cardField(card, answerField(q.mode)) : '';
}

export function reviewReducer(s: ReviewSession, action: ReviewAction): ReviewSession {
	const q = currentQuestion(s);
	switch (action.type) {
		case 'submit': {
			if (s.phase !== 'playing' || !q) return s;
			const record: AnswerRecord = { answer: action.answer, skipped: false };
			return { ...s, phase: 'reveal', answers: { ...s.answers, [q.key]: record } };
		}
		case 'skip': {
			if (s.phase !== 'playing' || !q) return s;
			const record: AnswerRecord = { answer: '', skipped: true };
			return { ...s, phase: 'reveal', answers: { ...s.answers, [q.key]: record } };
		}
		case 'next': {
			if (s.phase !== 'reveal') return s;
			const index = s.index + 1;
			return index >= s.queue.length ?
					{ ...s, index: s.queue.length, phase: 'summary' }
				:	{ ...s, index: index, phase: 'playing' };
		}
		case 'updateCard': {
			if (!s.cards[action.card.id]) return s;
			return { ...s, cards: { ...s.cards, [action.card.id]: action.card } };
		}
		case 'restart': {
			if (action.queue.length === 0) return s;
			return { ...s, queue: action.queue, index: 0, phase: 'playing', answers: {}, round: s.round + 1 };
		}
	}
}

/** How the round went: how many cards were gone through, and how many were skipped. */
export function summarize(s: ReviewSession): { total: number; skipped: number } {
	return { total: s.queue.length, skipped: s.queue.filter(q => s.answers[q.key]?.skipped).length };
}

/** A new round over every card of the session (modes picked again, shuffled when asked). */
export function buildRestartQueue(s: ReviewSession, rng: Rng): Question[] {
	const cards = s.deckCardIds.map(id => s.cards[id]).filter((c): c is ReviewCard => !!c);
	return buildDeck(cards, s.settings, rng);
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
