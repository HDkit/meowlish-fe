/**
 * English → Vietnamese, from the browser: Google's free translate endpoint (CORS-enabled, so it
 * is called with the user's own IP; from a server, e.g. Vercel, Google answers 429), falling back
 * to MyMemory (free, no key, CORS-enabled). Only the text the user asks to translate is sent.
 */
export async function translateToVietnamese(text: string, signal?: AbortSignal): Promise<string> {
	const q = text.trim().slice(0, 2000);
	if (!q) return '';
	try {
		const res = await fetch(
			`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(q)}`,
			{ signal: signal },
		);
		const out = res.ok ? parseGoogleTranslation(await res.json().catch(() => null)) : '';
		if (out) return out;
	} catch (err) {
		if ((err as { name?: string })?.name === 'AbortError') throw err;
	}
	// MyMemory takes at most 500 bytes of text
	const res = await fetch(
		`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q.slice(0, 450))}&langpair=en%7Cvi`,
		{ signal: signal },
	);
	const body = (await res.json().catch(() => null)) as { responseData?: { translatedText?: unknown } } | null;
	const out = body?.responseData?.translatedText;
	if (!res.ok || typeof out !== 'string' || !out.trim()) throw new Error('Không dịch được, vui lòng thử lại.');
	return out.trim();
}

/** Google's `translate_a/single?dt=t` answer → the translated text ('' when there is none). */
export function parseGoogleTranslation(data: unknown): string {
	const segments = Array.isArray(data) ? data[0] : null;
	if (!Array.isArray(segments)) return '';
	return segments
		.map((seg) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
		.join('')
		.trim();
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
