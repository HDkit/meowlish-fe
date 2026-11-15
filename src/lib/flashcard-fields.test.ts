import { describe, expect, it } from 'vitest';
import {
	cardImageStateOf,
	imageFileIdForUpdate,
	isShowableImageUrl,
	parseExamples,
	partOfSpeechOptions,
} from './flashcard-fields';

describe('flashcard fields', () => {
	it('splits examples by line and drops blank ones', () => {
		expect(parseExamples(' First one. \n\n Second one.\n')).toEqual(['First one.', 'Second one.']);
	});

	it("keeps a card's unknown part of speech selectable", () => {
		expect(partOfSpeechOptions('noun').some((o) => o.value === 'determiner')).toBe(false);
		expect(partOfSpeechOptions('determiner').at(-1)).toEqual({ value: 'determiner', label: 'determiner' });
	});
});

describe('card image state', () => {
	it('starts from the card: its file and its URL (old URL-only cards included)', () => {
		expect(cardImageStateOf({ image: 'https://cdn/public/f1', imageFileId: 'f1' })).toEqual({
			fileId: 'f1',
			previewUrl: 'https://cdn/public/f1',
			changed: false,
		});
		expect(cardImageStateOf({ image: 'https://example.com/a.png' })).toEqual({
			fileId: null,
			previewUrl: 'https://example.com/a.png',
			changed: false,
		});
		expect(cardImageStateOf({ image: 'not a url' }).previewUrl).toBe('');
		expect(cardImageStateOf()).toEqual({ fileId: null, previewUrl: '', changed: false });
	});

	it('shows only http(s) and local blob URLs', () => {
		expect(isShowableImageUrl('https://cdn/x.png')).toBe(true);
		expect(isShowableImageUrl('blob:http://localhost/1')).toBe(true);
		expect(isShowableImageUrl('javascript:alert(1)')).toBe(false);
		expect(isShowableImageUrl(undefined)).toBe(false);
	});

	it('sends nothing for an untouched image, the new id after an upload, "" after removing', () => {
		const untouched = cardImageStateOf({ image: 'https://example.com/a.png' });
		expect(imageFileIdForUpdate(untouched)).toBeUndefined();
		expect(imageFileIdForUpdate({ fileId: 'f2', previewUrl: 'blob:x', changed: true })).toBe('f2');
		expect(imageFileIdForUpdate({ fileId: null, previewUrl: '', changed: true })).toBe('');
	});
});
