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
