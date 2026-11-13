import { describe, expect, it } from 'vitest';
import { pageWindow } from './pagination';

describe('pageWindow', () => {
	it('shows first, last and neighbours with gaps', () => {
		expect(pageWindow(1, 1)).toEqual([1]);
		expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
		expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
		expect(pageWindow(1, 10)).toEqual([1, 2, null, 10]);
	});
});
