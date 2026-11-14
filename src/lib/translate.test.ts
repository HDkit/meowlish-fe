import { describe, expect, it } from 'vitest';
import { appendTranslation } from './translate';

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
