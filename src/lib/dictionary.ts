/**
 * Dictionary lookups, all from the browser (no app backend involved), all free and keyless:
 *
 * - Anh–Anh: Free Dictionary API (dictionaryapi.dev), falling back to English Wiktionary.
 * - Anh–Việt: Vietnamese Wiktionary, whose English entries come from the Free Vietnamese
 *   Dictionary Project (FVDP); falling back to Google's dictionary/translation data for words
 *   and phrases Wiktionary does not have.
 *
 * Every source sends `Access-Control-Allow-Origin: *`. Only the word the user looks up is sent.
 * The parsers are pure functions (tested in dictionary.test.ts); the fetchers wrap them.
 */
import { appendTranslation } from './translate';

export type DictionaryKind = 'en-en' | 'en-vi';

export interface DictionarySense {
	definition: string;
	/** For Anh–Việt, an example usually reads "English sentence — câu tiếng Việt". */
	examples: string[];
}

export interface DictionaryMeaning {
	/** Part of speech as stored on a flashcard ('noun', 'verb', …); '' when unknown. */
	partOfSpeech: string;
	/** What to show, e.g. "Ngoại động từ" or "Danh từ". */
	label: string;
	senses: DictionarySense[];
	synonyms: string[];
}

export interface DictionaryEntry {
	word: string;
	/** IPA, e.g. "/ˈmɪt.ɪ.ɡeɪt/"; '' when the source has none. */
	pronunciation: string;
	audioUrl: string;
	meanings: DictionaryMeaning[];
	source: { name: string; url: string };
}

export class DictionaryNotFoundError extends Error {
	constructor(word: string) {
		super(`Không tìm thấy “${word}” trong từ điển.`);
		this.name = 'DictionaryNotFoundError';
	}
}

// ─── Query ──────────────────────────────────────────────────────────────────

/** What a selection becomes as a query: trimmed, one space between words, no edge punctuation. */
export function normalizeQuery(text: string): string {
	return text
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
		.slice(0, 80);
}

// ─── Parts of speech ────────────────────────────────────────────────────────

const POS_LABELS: Record<string, string> = {
	noun: 'Danh từ',
	verb: 'Động từ',
	adjective: 'Tính từ',
	adverb: 'Trạng từ',
	pronoun: 'Đại từ',
	preposition: 'Giới từ',
	conjunction: 'Liên từ',
	interjection: 'Thán từ',
	article: 'Mạo từ',
	determiner: 'Từ hạn định',
	numeral: 'Số từ',
	phrase: 'Cụm từ',
	idiom: 'Thành ngữ',
	abbreviation: 'Từ viết tắt',
	prefix: 'Tiền tố',
	suffix: 'Hậu tố',
};

const POS_ALIASES: Record<string, string> = {
	adj: 'adjective',
	adv: 'adverb',
	prep: 'preposition',
	conj: 'conjunction',
	interj: 'interjection',
	intj: 'interjection',
	exclamation: 'interjection',
	det: 'determiner',
	num: 'numeral',
	number: 'numeral',
	abbr: 'abbreviation',
	'proper noun': 'noun',
	'phrasal verb': 'verb',
	'auxiliary verb': 'verb',
};

/** 'Verb', 'adj', 'proper noun' → the flashcard value ('verb', 'adjective', 'noun'). */
export function normalizePartOfSpeech(raw: string): string {
	const key = raw.trim().toLowerCase();
	if (!key) return '';
	return POS_ALIASES[key] ?? key;
}

const labelOf = (pos: string) => POS_LABELS[pos] ?? (pos ? pos.charAt(0).toUpperCase() + pos.slice(1) : 'Nghĩa');

// ─── Text helpers ───────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

function decodeEntities(s: string): string {
	return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi, (m, code: string) => {
		if (code[0] === '#') {
			const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
			return Number.isFinite(n) ? String.fromCodePoint(n) : m;
		}
		return ENTITIES[code.toLowerCase()] ?? m;
	});
}

/** HTML fragment → plain text (no DOM needed, so it also runs in tests). */
export function stripHtml(html: string): string {
	return decodeEntities(html.replace(/<[^>]*>/g, ''))
		.replace(/\s+/g, ' ')
		.trim();
}

const tidy = (s: string) =>
	s
		.replace(/\s+/g, ' ')
		.replace(/\s+([,.;:!?)])/g, '$1')
		.replace(/\(\s+/g, '(')
		.trim();

const uniq = (items: string[]) => [...new Set(items.filter(Boolean))];

// ─── Anh–Việt: Vietnamese Wiktionary (wikitext) ─────────────────────────────

/** Section headers inside an entry that are not a part of speech (they end the current one). */
const VI_POS_HEADERS: Record<string, { pos: string; label: string }> = {
	noun: { pos: 'noun', label: 'Danh từ' },
	'proper-noun': { pos: 'noun', label: 'Danh từ riêng' },
	verb: { pos: 'verb', label: 'Động từ' },
	'tr-verb': { pos: 'verb', label: 'Ngoại động từ' },
	'intr-verb': { pos: 'verb', label: 'Nội động từ' },
	'aux-verb': { pos: 'verb', label: 'Trợ động từ' },
	adj: { pos: 'adjective', label: 'Tính từ' },
	adv: { pos: 'adverb', label: 'Phó từ' },
	prep: { pos: 'preposition', label: 'Giới từ' },
	conj: { pos: 'conjunction', label: 'Liên từ' },
	pronoun: { pos: 'pronoun', label: 'Đại từ' },
	prn: { pos: 'pronoun', label: 'Đại từ' },
	interj: { pos: 'interjection', label: 'Thán từ' },
	intj: { pos: 'interjection', label: 'Thán từ' },
	art: { pos: 'article', label: 'Mạo từ' },
	det: { pos: 'determiner', label: 'Từ hạn định' },
	num: { pos: 'numeral', label: 'Số từ' },
	abbr: { pos: 'abbreviation', label: 'Từ viết tắt' },
	phrase: { pos: 'phrase', label: 'Cụm từ' },
	idiom: { pos: 'idiom', label: 'Thành ngữ' },
	expr: { pos: 'idiom', label: 'Thành ngữ' },
	prefix: { pos: 'prefix', label: 'Tiền tố' },
	suffix: { pos: 'suffix', label: 'Hậu tố' },
};

/** 3-letter headers that are sections of an entry, not a language code like {{-fra-}}. */
const VI_NON_LANGUAGE_3 = new Set(['adj', 'adv', 'art', 'det', 'num', 'prn', 'ref', 'syn', 'ant', 'drv', 'cat', 'rel', 'see', 'hyp']);

const isLanguageHeader = (name: string) => /^[a-z]{3}$/.test(name) && !VI_NON_LANGUAGE_3.has(name);

/** Wikitext markup of one line → readable text. */
export function cleanWikitext(s: string): string {
	let out = s
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<ref[^>]*\/>/g, '')
		.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '');
	// links: [[target|text]] → text, [[target]] → target
	out = out.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2').replace(/\[\[([^\]]*)\]\]/g, '$1');
	// templates, innermost first: labels keep their text in brackets, the rest go
	for (let i = 0; i < 5 && /\{\{[^{}]*\}\}/.test(out); i++) {
		out = out.replace(/\{\{([^{}]*)\}\}/g, (_m, body: string) => {
			const parts = body.split('|').map((p) => p.trim());
			const name = parts[0].toLowerCase();
			if (name === 'term' || name === 'term2' || name === 'nhãn') return parts[1] ? `(${parts.slice(1).join(', ')})` : '';
			if (name === 'lb' || name === 'label') return parts.length > 2 ? `(${parts.slice(2).join(', ')})` : '';
			if (name === 'w' || name === 'l' || name === 'm') return parts[name === 'w' ? 1 : 2] ?? '';
			return '';
		});
	}
	out = out.replace(/'{2,}/g, '').replace(/<[^>]*>/g, '');
	return tidy(decodeEntities(out));
}

const IPA_RE = /\{\{IPA[^|}]*\|(?:[a-z]{2,3}\|)?\s*(\/[^/|}]+\/|\[[^\]|}]+\])/;

/**
 * The English entry of a Vietnamese Wiktionary page (wikitext) → meanings in Vietnamese.
 * Returns null when the page has no English entry with senses.
 */
export function parseViWiktionary(word: string, wikitext: string): DictionaryEntry | null {
	const lines = wikitext.split('\n');
	const start = lines.findIndex((l) => /^\s*\{\{-eng-\}\}\s*$/.test(l) || /^\s*==\s*(Tiếng Anh|\{\{eng\}\})\s*==\s*$/.test(l));
	if (start === -1) return null;

	let pronunciation = '';
	const meanings: DictionaryMeaning[] = [];
	let current: DictionaryMeaning | null = null;

	for (const line of lines.slice(start + 1)) {
		const header = line.match(/^\s*\{\{-([^}]+)-\}\}\s*$/);
		if (header) {
			const name = header[1].trim().toLowerCase();
			if (isLanguageHeader(name)) break; // the next language's entry
			const pos = VI_POS_HEADERS[name];
			current = pos ? { partOfSpeech: pos.pos, label: pos.label, senses: [], synonyms: [] } : null;
			if (current) meanings.push(current);
			continue;
		}
		if (/^\s*==[^=].*==\s*$/.test(line)) break; // a level-2 heading starts another language

		if (!pronunciation) {
			const ipa = line.match(IPA_RE);
			if (ipa) pronunciation = ipa[1].trim();
		}
		if (!current) continue;

		const sense = line.match(/^#+(?![:*])\s*(.*)$/);
		if (sense) {
			const definition = cleanWikitext(sense[1]);
			if (definition) current.senses.push({ definition, examples: [] });
			continue;
		}
		const example = line.match(/^#+:\s*(.*)$/);
		if (example) {
			const last = current.senses[current.senses.length - 1];
			const text = cleanWikitext(example[1]).replace(/\s*—\s*$/, '');
			if (last && text) last.examples.push(text.replace(/\s*—\s*/, ' — '));
		}
	}

	const filled = meanings.filter((m) => m.senses.length > 0);
	if (filled.length === 0) return null;
	return {
		word,
		pronunciation,
		audioUrl: '',
		meanings: filled,
		source: { name: 'Wiktionary tiếng Việt (FVDP)', url: `https://vi.wiktionary.org/wiki/${encodeURIComponent(word.replace(/ /g, '_'))}` },
	};
}

// ─── Anh–Việt fallback: Google dictionary data ──────────────────────────────

/**
 * Google's `translate_a/single?dt=t&dt=bd` answer → meanings. Words come back as terms grouped by
 * part of speech; phrases (no dictionary data) as one translated meaning.
 */
export function parseGoogleDictionary(word: string, data: unknown): DictionaryEntry | null {
	if (!Array.isArray(data)) return null;
	const meanings: DictionaryMeaning[] = [];
	const dict = data[1];
	if (Array.isArray(dict)) {
		for (const group of dict) {
			if (!Array.isArray(group) || !Array.isArray(group[1])) continue;
			const terms = uniq((group[1] as unknown[]).filter((t): t is string => typeof t === 'string').map((t) => t.trim()));
			if (terms.length === 0) continue;
			const pos = normalizePartOfSpeech(typeof group[0] === 'string' ? group[0] : '');
			meanings.push({ partOfSpeech: pos, label: labelOf(pos), senses: [{ definition: terms.slice(0, 8).join(', '), examples: [] }], synonyms: [] });
		}
	}
	if (meanings.length === 0 && Array.isArray(data[0])) {
		const translated = (data[0] as unknown[])
			.map((seg) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
			.join('')
			.trim();
		if (translated && translated.toLowerCase() !== word.toLowerCase()) {
			meanings.push({ partOfSpeech: '', label: 'Bản dịch', senses: [{ definition: translated, examples: [] }], synonyms: [] });
		}
	}
	if (meanings.length === 0) return null;
	return {
		word,
		pronunciation: '',
		audioUrl: '',
		meanings,
		source: { name: 'Google Dịch', url: `https://translate.google.com/?sl=en&tl=vi&text=${encodeURIComponent(word)}` },
	};
}

// ─── Anh–Anh: Free Dictionary API ───────────────────────────────────────────

type FreeDictEntry = {
	word?: string;
	phonetic?: string;
	phonetics?: { text?: string; audio?: string }[];
	meanings?: { partOfSpeech?: string; synonyms?: string[]; definitions?: { definition?: string; example?: string; synonyms?: string[] }[] }[];
	sourceUrls?: string[];
};

/** dictionaryapi.dev's answer (one item per etymology) → one entry, meanings merged by part of speech. */
export function parseFreeDictionary(word: string, data: unknown): DictionaryEntry | null {
	if (!Array.isArray(data) || data.length === 0) return null;
	const entries = data as FreeDictEntry[];
	const byPos = new Map<string, DictionaryMeaning>();
	for (const e of entries) {
		for (const m of e.meanings ?? []) {
			const pos = normalizePartOfSpeech(m.partOfSpeech ?? '');
			let meaning = byPos.get(pos);
			if (!meaning) {
				meaning = { partOfSpeech: pos, label: labelOf(pos), senses: [], synonyms: [] };
				byPos.set(pos, meaning);
			}
			for (const d of m.definitions ?? []) {
				const definition = d.definition?.trim();
				if (definition) meaning.senses.push({ definition, examples: d.example?.trim() ? [d.example.trim()] : [] });
			}
			meaning.synonyms = uniq([...meaning.synonyms, ...(m.synonyms ?? [])]).slice(0, 8);
		}
	}
	const meanings = [...byPos.values()].filter((m) => m.senses.length > 0);
	if (meanings.length === 0) return null;

	const phonetics = entries.flatMap((e) => e.phonetics ?? []);
	const pronunciation = entries.find((e) => e.phonetic?.trim())?.phonetic?.trim() || phonetics.find((p) => p.text?.trim())?.text?.trim() || '';
	const audio = phonetics.find((p) => p.audio?.trim())?.audio?.trim() ?? '';
	const headword = entries[0].word || word;
	return {
		word: headword,
		pronunciation,
		audioUrl: audio.startsWith('//') ? `https:${audio}` : audio,
		meanings,
		source: { name: 'Free Dictionary (Wiktionary)', url: entries[0].sourceUrls?.[0] ?? `https://en.wiktionary.org/wiki/${encodeURIComponent(headword.replace(/ /g, '_'))}` },
	};
}

// ─── Anh–Anh fallback: English Wiktionary REST ──────────────────────────────

type WiktionaryDefinitions = Record<string, { partOfSpeech?: string; language?: string; definitions?: { definition?: string; examples?: string[] }[] }[]>;

/** en.wiktionary.org `page/definition` answer → the English meanings. */
export function parseEnWiktionary(word: string, data: unknown): DictionaryEntry | null {
	const groups = (data as WiktionaryDefinitions | null)?.en;
	if (!Array.isArray(groups)) return null;
	const meanings: DictionaryMeaning[] = [];
	for (const g of groups) {
		const pos = normalizePartOfSpeech(g.partOfSpeech ?? '');
		const senses = (g.definitions ?? [])
			.map((d) => ({ definition: stripHtml(d.definition ?? ''), examples: (d.examples ?? []).map(stripHtml).filter(Boolean).slice(0, 2) }))
			.filter((s) => s.definition);
		if (senses.length) meanings.push({ partOfSpeech: pos, label: labelOf(pos), senses, synonyms: [] });
	}
	if (meanings.length === 0) return null;
	return {
		word,
		pronunciation: '',
		audioUrl: '',
		meanings,
		source: { name: 'Wiktionary', url: `https://en.wiktionary.org/wiki/${encodeURIComponent(word.replace(/ /g, '_'))}` },
	};
}

// ─── Fetchers ───────────────────────────────────────────────────────────────

async function getJson(url: string, signal?: AbortSignal): Promise<{ ok: boolean; status: number; body: unknown }> {
	const res = await fetch(url, { signal });
	const body = await res.json().catch(() => null);
	return { ok: res.ok, status: res.status, body };
}

const isAbort = (err: unknown) => (err as { name?: string })?.name === 'AbortError';

async function lookupEnglishUncached(word: string, signal?: AbortSignal): Promise<DictionaryEntry> {
	try {
		const r = await getJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, signal);
		const entry = r.ok ? parseFreeDictionary(word, r.body) : null;
		if (entry) return entry;
	} catch (err) {
		if (isAbort(err)) throw err;
	}
	const r = await getJson(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.replace(/ /g, '_'))}`, signal);
	const entry = r.ok ? parseEnWiktionary(word, r.body) : null;
	if (entry) return entry;
	if (r.ok || r.status === 404) throw new DictionaryNotFoundError(word);
	throw new Error('Không tra được từ điển, vui lòng thử lại.');
}

async function lookupVietnameseUncached(word: string, signal?: AbortSignal): Promise<DictionaryEntry> {
	// page titles are case-sensitive: "Mitigate" selected at a sentence start is "mitigate"
	const titles = uniq([word, word.toLowerCase()]);
	for (const title of titles) {
		try {
			const r = await getJson(
				`https://vi.wiktionary.org/w/api.php?action=parse&format=json&formatversion=2&redirects=1&origin=*&prop=wikitext&page=${encodeURIComponent(title)}`,
				signal,
			);
			const wikitext = (r.body as { parse?: { wikitext?: unknown } } | null)?.parse?.wikitext;
			const entry = typeof wikitext === 'string' ? parseViWiktionary(title, wikitext) : null;
			if (entry) return entry;
		} catch (err) {
			if (isAbort(err)) throw err;
		}
	}
	const r = await getJson(
		`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&dt=bd&q=${encodeURIComponent(word)}`,
		signal,
	);
	const entry = r.ok ? parseGoogleDictionary(word, r.body) : null;
	if (entry) return entry;
	if (r.ok) throw new DictionaryNotFoundError(word);
	throw new Error('Không tra được từ điển, vui lòng thử lại.');
}

const cache = new Map<string, Promise<DictionaryEntry>>();

/** Looks a word up (results are kept for the session; a failed lookup is retried next time). */
export function lookUpWord(kind: DictionaryKind, text: string, signal?: AbortSignal): Promise<DictionaryEntry> {
	const word = normalizeQuery(text);
	if (!word) return Promise.reject(new Error('Nhập một từ để tra.'));
	const key = `${kind}:${word}`;
	const hit = cache.get(key);
	if (hit) return hit;
	// the shared request is not tied to one caller's signal; each caller can still stop waiting
	const request = (kind === 'en-en' ? lookupEnglishUncached : lookupVietnameseUncached)(word);
	cache.set(key, request);
	request.catch(() => cache.delete(key));
	if (!signal) return request;
	return new Promise((resolve, reject) => {
		const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
		if (signal.aborted) return onAbort();
		signal.addEventListener('abort', onAbort, { once: true });
		request.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
	});
}

// ─── Filling a flashcard ────────────────────────────────────────────────────

export interface FlashcardFields {
	pronunciation: string;
	partOfSpeech: string;
	definition: string;
	/** One example per line, as typed in the form. */
	examples: string;
}

export interface FlashcardFill {
	pronunciation: string;
	partOfSpeech: string;
	definition: string;
	examples: string[];
}

/**
 * What a meaning gives a flashcard. With `senseIndex`, only that sense; otherwise the first
 * `maxSenses` senses (Vietnamese senses are short, so a few read well together).
 */
export function fillFromMeaning(entry: DictionaryEntry, meaningIndex = 0, senseIndex?: number, maxSenses = 1): FlashcardFill {
	const meaning = entry.meanings[meaningIndex];
	if (!meaning) return { pronunciation: entry.pronunciation, partOfSpeech: '', definition: '', examples: [] };
	const senses = senseIndex === undefined ? meaning.senses.slice(0, maxSenses) : meaning.senses.slice(senseIndex, senseIndex + 1);
	return {
		pronunciation: entry.pronunciation,
		partOfSpeech: meaning.partOfSpeech,
		definition: senses.map((s) => s.definition.replace(/[.;\s]+$/, '')).join('; '),
		examples: senses.flatMap((s) => s.examples).slice(0, 2),
	};
}

/**
 * Applies a fill to the form without losing what the user wrote: pronunciation and part of
 * speech only when empty, the definition and examples added (never repeated).
 */
export function mergeFill(current: FlashcardFields, fill: FlashcardFill): FlashcardFields {
	const lines = current.examples.split('\n').map((l) => l.trim()).filter(Boolean);
	const known = new Set(lines.map((l) => l.toLowerCase()));
	const added = fill.examples.filter((e) => e.trim() && !known.has(e.trim().toLowerCase()));
	return {
		pronunciation: current.pronunciation.trim() ? current.pronunciation : fill.pronunciation,
		partOfSpeech: current.partOfSpeech.trim() ? current.partOfSpeech : fill.partOfSpeech,
		definition: appendTranslation(current.definition, fill.definition),
		examples: added.length ? [...lines, ...added].join('\n') : current.examples,
	};
}
