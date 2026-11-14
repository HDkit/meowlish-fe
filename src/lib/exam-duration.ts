/**
 * Exams store `duration` in seconds (exam service, and the test timer reads it as seconds), while
 * the editor asks for minutes.
 */

/** Seconds from the API -> the minutes shown in the editor's input. */
export const secondsToMinutesInput = (seconds: number | null | undefined): string => {
	if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return '60';
	return String(Math.max(1, Math.round(seconds / 60)));
};

/**
 * The editor's minutes -> seconds for the API, or null when not a positive whole number of minutes.
 * When the input still shows what `originalSeconds` was displayed as, the original value is kept,
 * so saving other fields doesn't round a 90-second exam to 2 minutes.
 */
export const minutesInputToSeconds = (input: string, originalSeconds?: number | null): number | null => {
	const minutes = Number(input.trim());
	if (!input.trim() || !Number.isInteger(minutes) || minutes <= 0) return null;
	if (originalSeconds && secondsToMinutesInput(originalSeconds) === String(minutes)) return originalSeconds;
	return minutes * 60;
};
