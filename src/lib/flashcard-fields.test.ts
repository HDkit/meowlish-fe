import { describe, expect, it } from 'vitest';
import { parseExamples, partOfSpeechOptions } from './flashcard-fields';

describe('flashcard fields', () => {
	it('splits examples by line and drops blank ones', () => {
		expect(parseExamples(' First one. \n\n Second one.\n')).toEqual(['First one.', 'Second one.']);
	});

	it("keeps a card's unknown part of speech selectable", () => {
		expect(partOfSpeechOptions('noun').some((o) => o.value === 'determiner')).toBe(false);
		expect(partOfSpeechOptions('determiner').at(-1)).toEqual({ value: 'determiner', label: 'determiner' });
	});
});
