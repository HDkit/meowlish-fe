/** Part of speech options: stored as the English term (as in the seeded cards), shown in Vietnamese. */
export const PARTS_OF_SPEECH = [
	{ value: 'noun', label: 'Danh từ (noun)' },
	{ value: 'verb', label: 'Động từ (verb)' },
	{ value: 'adjective', label: 'Tính từ (adjective)' },
	{ value: 'adverb', label: 'Trạng từ (adverb)' },
	{ value: 'pronoun', label: 'Đại từ (pronoun)' },
	{ value: 'preposition', label: 'Giới từ (preposition)' },
	{ value: 'conjunction', label: 'Liên từ (conjunction)' },
	{ value: 'phrase', label: 'Cụm từ (phrase)' },
	{ value: 'idiom', label: 'Thành ngữ (idiom)' },
];

/** Options for a select: the known ones, plus `current` when a card holds another value. */
export const partOfSpeechOptions = (current: string) =>
	current && !PARTS_OF_SPEECH.some((p) => p.value === current)
		? [...PARTS_OF_SPEECH, { value: current, label: current }]
		: PARTS_OF_SPEECH;

/** Examples typed one per line → the card's list (blank lines dropped). */
export const parseExamples = (text: string): string[] =>
	text.split('\n').map((e) => e.trim()).filter(Boolean);

/**
 * The card image in the form: the uploaded file (`fileId`), or none. `changed` is set once the
 * user uploads or removes an image, so an untouched card (even one with only an old image URL)
 * keeps its image.
 */
export interface CardImageState {
	fileId: string | null;
	/** What to preview: the card's image URL, or a local object URL for a new upload. */
	previewUrl: string;
	changed: boolean;
}

/** Only http(s) URLs are shown (old cards may hold any text in `image`). */
export const isShowableImageUrl = (url?: string): url is string => !!url && /^(https?:|blob:)/.test(url);

/** The image of a card being edited (`image` is the URL the backend resolved, or an old URL). */
export const cardImageStateOf = (card?: { image?: string; imageFileId?: string }): CardImageState => ({
	fileId: card?.imageFileId ?? null,
	previewUrl: isShowableImageUrl(card?.image) ? card.image : '',
	changed: false,
});

/**
 * `imageFileId` for the update request: absent keeps the card's image, '' removes it (an old URL
 * image too), an id sets it.
 */
export const imageFileIdForUpdate = (state: CardImageState): string | undefined =>
	state.changed ? (state.fileId ?? '') : undefined;
