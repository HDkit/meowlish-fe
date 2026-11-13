/** A flashcard as the review session keeps it (a plain, serializable copy). */
export interface ReviewCard {
	id: string;
	listId: string;
	listName: string;
	authorId: string;
	word: string;
	definition: string;
	notes?: string;
	pronunciation?: string;
	partOfSpeech?: string;
	examples: string[];
}

/** Which field is shown, and which one the player types. */
export type PromptMode = 'word-to-definition' | 'definition-to-word' | 'note-to-word';

export type CardField = 'word' | 'definition' | 'notes';

export const ALL_MODES: readonly PromptMode[] = [
	'word-to-definition',
	'definition-to-word',
	'note-to-word',
];

export type DeckSize = 'all' | 10 | 20 | 50;

export interface ReviewSettings {
	listIds: string[];
	modes: PromptMode[];
	size: DeckSize;
	shuffle: boolean;
	/** Compare answers without Vietnamese/other diacritics ("con meo" == "con mèo"). */
	ignoreAccents: boolean;
}

/** Random number source in [0, 1); injectable so decks are reproducible in tests. */
export type Rng = () => number;

export interface Question {
	/** Unique within a round: `${cardId}:${mode}`. */
	key: string;
	cardId: string;
	mode: PromptMode;
}

export type Verdict = 'match' | 'close' | 'different' | 'empty';

export type Grade = 'correct' | 'incorrect';
