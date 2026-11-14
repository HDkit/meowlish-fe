/**
 * English → Vietnamese for filling a flashcard's definition. Uses the app's own translate route
 * (free Google endpoint, server-side), falling back to MyMemory (free, no key, CORS-enabled).
 * Only the text the user asks to translate is sent, when they click.
 */
export async function translateToVietnamese(text: string, signal?: AbortSignal): Promise<string> {
	const q = text.trim().slice(0, 500);
	if (!q) return '';
	try {
		const res = await fetch('/api/gemini/translate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text: q }),
			signal: signal,
		});
		const body = (await res.json().catch(() => null)) as { translation?: unknown } | null;
		if (res.ok && typeof body?.translation === 'string' && body.translation.trim()) return body.translation.trim();
	} catch (err) {
		if ((err as { name?: string })?.name === 'AbortError') throw err;
	}
	const res = await fetch(
		`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en%7Cvi`,
		{ signal: signal },
	);
	const body = (await res.json().catch(() => null)) as { responseData?: { translatedText?: unknown } } | null;
	const out = body?.responseData?.translatedText;
	if (!res.ok || typeof out !== 'string' || !out.trim()) throw new Error('Không dịch được, vui lòng thử lại.');
	return out.trim();
}

/** Adds a translation to what is already written (never replaces it, never repeats it). */
export function appendTranslation(existing: string, translation: string): string {
	const t = translation.trim();
	if (!t) return existing;
	const current = existing.trimEnd();
	if (!current) return t;
	if (current.toLocaleLowerCase('vi').includes(t.toLocaleLowerCase('vi'))) return existing;
	return /[;,.\n]$/.test(current) ? `${current} ${t}` : `${current}; ${t}`;
}
