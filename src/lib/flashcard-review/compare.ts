import type { Verdict } from './types';

export interface CompareOptions {
	ignoreAccents: boolean;
}

/** Similarity at or above this (0..1) counts as "Gần đúng". */
export const CLOSE_THRESHOLD = 0.75;

const APOSTROPHES = /['’‘`´]/g;
// punctuation and symbols become word breaks
const PUNCTUATION = /[\p{P}\p{S}]+/gu;
const COMBINING_MARKS = /\p{M}+/gu;

export function stripAccents(text: string): string {
	return text.normalize('NFD').replace(COMBINING_MARKS, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

/**
 * Lower case, NFC, apostrophes dropped ("don't" == "dont"), other punctuation and runs of
 * whitespace collapsed to one space, trimmed; accents removed when asked.
 */
export function normalizeAnswer(text: string, options: CompareOptions): string {
	let out = text.normalize('NFC').toLowerCase();
	if (options.ignoreAccents) out = stripAccents(out);
	return out.replace(APOSTROPHES, '').replace(PUNCTUATION, ' ').replace(/\s+/g, ' ').trim();
}

export function levenshtein(a: string, b: string): number {
	const s = [...a];
	const t = [...b];
	if (s.length === 0) return t.length;
	if (t.length === 0) return s.length;
	let prev = Array.from({ length: t.length + 1 }, (_, j) => j);
	for (let i = 1; i <= s.length; i++) {
		const cur = [i];
		for (let j = 1; j <= t.length; j++) {
			cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1));
		}
		prev = cur;
	}
	return prev[t.length];
}

/** 1 - edit distance / longer length, on already-normalized strings. */
export function editSimilarity(a: string, b: string): number {
	const longest = Math.max([...a].length, [...b].length);
	return longest === 0 ? 1 : 1 - levenshtein(a, b) / longest;
}

/** Dice coefficient over word multisets, on already-normalized strings. */
export function tokenOverlap(a: string, b: string): number {
	const ta = a.split(' ').filter(Boolean);
	const tb = b.split(' ').filter(Boolean);
	if (ta.length === 0 && tb.length === 0) return 1;
	if (ta.length === 0 || tb.length === 0) return 0;
	const counts = new Map<string, number>();
	for (const w of tb) counts.set(w, (counts.get(w) ?? 0) + 1);
	let common = 0;
	for (const w of ta) {
		const n = counts.get(w) ?? 0;
		if (n > 0) {
			common++;
			counts.set(w, n - 1);
		}
	}
	return (2 * common) / (ta.length + tb.length);
}

/**
 * The saved value plus the variants an answer may reasonably match: each part of a list
 * separated by `;`, `,`, `/`, `|` or a new line, and the value without parenthesized remarks
 * ("run (v)" -> "run").
 */
export function expectedVariants(expected: string): string[] {
	const withoutParens = expected.replace(/\([^)]*\)/g, ' ');
	const parts = [expected, withoutParens, ...withoutParens.split(/[;,/|\n]+/)];
	return [...new Set(parts.map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean))];
}

export interface Comparison {
	verdict: Verdict;
	/** Best similarity found, 0..1. */
	score: number;
}

export function compareAnswer(answer: string, expected: string, options: CompareOptions): Comparison {
	const a = normalizeAnswer(answer, options);
	if (a === '') return { verdict: 'empty', score: 0 };
	let best = 0;
	for (const variant of expectedVariants(expected)) {
		const e = normalizeAnswer(variant, options);
		if (e === '') continue;
		if (a === e) return { verdict: 'match', score: 1 };
		best = Math.max(best, editSimilarity(a, e), tokenOverlap(a, e));
	}
	return { verdict: best >= CLOSE_THRESHOLD ? 'close' : 'different', score: best };
}

export type DiffStatus = 'same' | 'extra' | 'missing';

export interface DiffToken {
	text: string;
	status: DiffStatus;
}

function words(text: string): string[] {
	return text.split(/\s+/).filter(Boolean);
}

/**
 * Word-level diff (longest common subsequence on normalized words) for highlighting:
 * `answer` tokens are 'same' or 'extra', `expected` tokens are 'same' or 'missing'. Tokens that
 * normalize to nothing (lone punctuation) are always 'same'. Original spelling is kept.
 */
export function diffWords(
	answer: string,
	expected: string,
	options: CompareOptions,
): { answer: DiffToken[]; expected: DiffToken[] } {
	const aw = words(answer);
	const ew = words(expected);
	const an = aw.map(w => normalizeAnswer(w, options));
	const en = ew.map(w => normalizeAnswer(w, options));
	const ai = an.map((_, i) => i).filter(i => an[i] !== '');
	const ei = en.map((_, i) => i).filter(i => en[i] !== '');

	// LCS table over the meaningful words
	const dp: number[][] = Array.from({ length: ai.length + 1 }, () => new Array<number>(ei.length + 1).fill(0));
	for (let i = ai.length - 1; i >= 0; i--) {
		for (let j = ei.length - 1; j >= 0; j--) {
			dp[i][j] = an[ai[i]] === en[ei[j]] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}
	const sameA = new Set<number>();
	const sameE = new Set<number>();
	let i = 0;
	let j = 0;
	while (i < ai.length && j < ei.length) {
		if (an[ai[i]] === en[ei[j]]) {
			sameA.add(ai[i++]);
			sameE.add(ei[j++]);
		} else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
		else j++;
	}
	return {
		answer: aw.map((text, k) => ({ text: text, status: an[k] === '' || sameA.has(k) ? 'same' : 'extra' })),
		expected: ew.map((text, k) => ({ text: text, status: en[k] === '' || sameE.has(k) ? 'same' : 'missing' })),
	};
}
