/** The fields of an attempt (history entry, exam attempt list, …) that decide where it opens. */
export type AttemptLinkTarget = { id: string; endedAt?: string | Date | null };

/** An attempt is finished once it has been submitted (`endedAt` set). */
export const isAttemptFinished = (attempt: Pick<AttemptLinkTarget, 'endedAt'>): boolean => !!attempt.endedAt;

/**
 * Where an attempt opens: an unfinished one goes back to the test screen to carry on (an expired
 * one is submitted there), a submitted one to its result.
 */
export const attemptHref = (attempt: AttemptLinkTarget): string =>
	isAttemptFinished(attempt) ? `/results/${encodeURIComponent(attempt.id)}` : `/test/do/${encodeURIComponent(attempt.id)}`;
