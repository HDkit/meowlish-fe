import { describe, expect, it } from 'vitest';
import { appendTranslation, parseGoogleTranslation } from './translate';

describe('appendTranslation', () => {
	it('fills an empty definition', () => {
		expect(appendTranslation('', 'chú ý tới')).toBe('chú ý tới');
		expect(appendTranslation('   ', 'chú ý tới')).toBe('chú ý tới');
	});

	it('adds to what is written, never replacing it', () => {
		expect(appendTranslation('để ý', 'chú ý tới')).toBe('để ý; chú ý tới');
		expect(appendTranslation('để ý;', 'chú ý tới')).toBe('để ý; chú ý tới');
	});

	it('does not repeat a translation already there', () => {
		expect(appendTranslation('Chú ý tới', 'chú ý tới')).toBe('Chú ý tới');
		expect(appendTranslation('để ý', '')).toBe('để ý');
	});
});

describe('parseGoogleTranslation', () => {
	it('joins the translated segments', () => {
		expect(parseGoogleTranslation([[['Trồng cây có thể giảm nhẹ ô nhiễm. ', 'Planting trees can mitigate pollution. '], ['Thật tốt.', 'Good.']], null, 'en'])).toBe(
			'Trồng cây có thể giảm nhẹ ô nhiễm. Thật tốt.',
		);
	});

	it('is empty for anything else', () => {
		expect(parseGoogleTranslation(null)).toBe('');
		expect(parseGoogleTranslation({ error: 'x' })).toBe('');
		expect(parseGoogleTranslation([null])).toBe('');
	});
});
