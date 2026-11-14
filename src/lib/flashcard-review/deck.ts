import type { CardField, PromptMode, Question, ReviewCard, ReviewSettings, Rng } from './types';

export const MODE_LABELS: Record<PromptMode, string> = {
	'word-to-definition': 'Từ → Nghĩa',
	'definition-to-word': 'Nghĩa → Từ',
	'note-to-word': 'Ghi chú → Từ',
};

export const FIELD_LABELS: Record<CardField, string> = {
	word: 'Từ tiếng Anh',
	definition: 'Nghĩa',
	notes: 'Ghi chú',
};

export function promptField(mode: PromptMode): CardField {
	if (mode === 'word-to-definition') return 'word';
	if (mode === 'definition-to-word') return 'definition';
	return 'notes';
}

export function answerField(mode: PromptMode): CardField {
	return mode === 'word-to-definition' ? 'definition' : 'word';
}

export function cardField(card: ReviewCard, field: CardField): string {
	return (field === 'notes' ? card.notes : card[field])?.trim() ?? '';
}

/** The selected modes this card can be asked in (both fields of the mode must be filled). */
export function applicableModes(card: ReviewCard, modes: readonly PromptMode[]): PromptMode[] {
	return modes.filter(
		mode => cardField(card, promptField(mode)) !== '' && cardField(card, answerField(mode)) !== '',
	);
}

/** Deterministic PRNG (mulberry32) for tests and reproducible decks. */
export function seededRng(seed: number): Rng {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Fisher-Yates; returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/** Cards de-duplicated by id (a card belongs to one list, but be safe), order kept. */
export function uniqueCards(cards: readonly ReviewCard[]): ReviewCard[] {
	const seen = new Set<string>();
	return cards.filter(c => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

function pick<T>(items: readonly T[], rng: Rng): T {
	return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}

/** Every card has a word and a definition, so this mode always works. */
const FALLBACK_MODE: PromptMode = 'word-to-definition';

/**
 * One question for EVERY card of the selected lists. With several modes selected, each card gets
 * one of the selected modes it supports at random ("mixed"); a card none of them fits (e.g. only
 * "Ghi chú → Từ" chosen and the card has no note) falls back to "Từ → Nghĩa". Shuffled when asked.
 */
export function buildDeck(
	cards: readonly ReviewCard[],
	settings: Pick<ReviewSettings, 'modes' | 'shuffle'>,
	rng: Rng,
): Question[] {
	const questions: Question[] = [];
	for (const card of uniqueCards(cards)) {
		const modes = applicableModes(card, settings.modes);
		const mode = modes.length > 0 ? pick(modes, rng) : FALLBACK_MODE;
		questions.push({ key: `${card.id}:${mode}`, cardId: card.id, mode: mode });
	}
	return settings.shuffle ? shuffle(questions, rng) : questions;
}
