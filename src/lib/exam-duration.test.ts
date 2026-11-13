import { describe, expect, it } from 'vitest';
import { minutesInputToSeconds, secondsToMinutesInput } from './exam-duration';

describe('exam duration', () => {
	it('shows seconds as whole minutes', () => {
		expect(secondsToMinutesInput(3600)).toBe('60');
		expect(secondsToMinutesInput(90)).toBe('2');
		expect(secondsToMinutesInput(20)).toBe('1');
		expect(secondsToMinutesInput(undefined)).toBe('60');
	});

	it('sends minutes as seconds', () => {
		expect(minutesInputToSeconds('45')).toBe(2700);
		expect(minutesInputToSeconds(' 120 ')).toBe(7200);
	});

	it('rejects empty, fractional and non-positive input', () => {
		expect(minutesInputToSeconds('')).toBeNull();
		expect(minutesInputToSeconds('0')).toBeNull();
		expect(minutesInputToSeconds('-5')).toBeNull();
		expect(minutesInputToSeconds('1.5')).toBeNull();
		expect(minutesInputToSeconds('abc')).toBeNull();
	});

	it('keeps the original seconds when the minutes were not changed', () => {
		expect(minutesInputToSeconds('2', 90)).toBe(90);
		expect(minutesInputToSeconds('3', 90)).toBe(180);
	});
});
