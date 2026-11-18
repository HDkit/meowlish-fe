import { describe, expect, it } from 'vitest';
import {
	cleanWikitext,
	fillFromMeaning,
	mergeFill,
	normalizePartOfSpeech,
	normalizeQuery,
	parseEnWiktionary,
	parseFreeDictionary,
	parseGoogleDictionary,
	parseViWiktionary,
	stripHtml,
} from './dictionary';

// Trimmed from vi.wiktionary.org pages (FVDP entries), as the API returns them.
const MITIGATE_VI = `{{-eng-}}
{{-pron-}}
* [[Wiktionary:IPA|IPA]]: {{IPA-old|/ˈmɪ.tə.ˌɡeɪt/}}
{{pron-audio
|place=Hoa Kỳ <!--  Feel free to precise the city or the area -->
|file=En-us-mitigate.ogg
|pron=ˈmɪ.tə.ˌɡeɪt}}

{{-tr-verb-}}
'''mitigate''' ''ngoại động từ'' {{IPA-old|/ˈmɪ.tə.ˌɡeɪt/}}
# [[giảm nhẹ|Giảm nhẹ]], [[giảm thiểu]], làm [[dịu]] [[bớt]], làm cho [[đỡ]].
#: ''to '''mitigate''' a punishment'' —  giảm nhẹ sự trừng phạt
#: ''to '''mitigate''' one's anger'' —  bớt giận

{{-forms-}}
{{eng-verb|base=mitigate|mitigat|ing}}

{{-ref-}}
{{R:FVDP}}

[[Thể loại:Động từ tiếng Anh]]`;

const RUN_VI = `{{-vie-}}
{{-verb-}}
# [[cử chỉ|Cử chỉ]] có trạng thái không bình thường.
#: ''Giọng nói '''run''' lên vì xúc động.''

{{-ref-}}
{{R:FVDP}}

{{-eng-}}
{{-pron-}}
* {{IPA4|en|/ˈrən/}}

{{-noun-}}
{{en-noun-old}}
# Sự [[chạy]].
#: ''at a '''run''''' —  đang chạy
#: ''to break into a '''run''''' —

{{-intr-verb-}}
'''run''' ''nội động từ''
# {{term|Thường  + [[up]]}} chạy [[lên]].

{{-fra-}}
{{-noun-}}
# Sự chạy (tiếng Pháp).`;

describe('normalizeQuery', () => {
	it('keeps the word without edge punctuation and extra spaces', () => {
		expect(normalizeQuery('  “mitigate,”  ')).toBe('mitigate');
		expect(normalizeQuery('give\n  up.')).toBe('give up');
		expect(normalizeQuery("children's")).toBe("children's");
		expect(normalizeQuery('...')).toBe('');
	});
});

describe('normalizePartOfSpeech', () => {
	it('maps source labels to flashcard values', () => {
		expect(normalizePartOfSpeech('Verb')).toBe('verb');
		expect(normalizePartOfSpeech('adj')).toBe('adjective');
		expect(normalizePartOfSpeech('proper noun')).toBe('noun');
		expect(normalizePartOfSpeech('')).toBe('');
	});
});

describe('cleanWikitext', () => {
	it('turns links, emphasis and label templates into text', () => {
		expect(cleanWikitext('[[giảm nhẹ|Giảm nhẹ]], [[giảm thiểu]], làm [[dịu]].')).toBe('Giảm nhẹ, giảm thiểu, làm dịu.');
		expect(cleanWikitext("''to '''mitigate''' a punishment''")).toBe('to mitigate a punishment');
		expect(cleanWikitext('{{term|Thường  + [[up]]}} làm cho [[rạng]] [[lên]]')).toBe('(Thường + up) làm cho rạng lên');
		expect(cleanWikitext('nghĩa {{IPA-old|/x/}}<!-- c -->')).toBe('nghĩa');
	});
});

describe('parseViWiktionary', () => {
	it('reads the English entry: IPA, part of speech, Vietnamese senses and examples', () => {
		const entry = parseViWiktionary('mitigate', MITIGATE_VI)!;
		expect(entry.pronunciation).toBe('/ˈmɪ.tə.ˌɡeɪt/');
		expect(entry.meanings).toEqual([
			{
				partOfSpeech: 'verb',
				label: 'Ngoại động từ',
				synonyms: [],
				senses: [
					{
						definition: 'Giảm nhẹ, giảm thiểu, làm dịu bớt, làm cho đỡ.',
						examples: ['to mitigate a punishment — giảm nhẹ sự trừng phạt', "to mitigate one's anger — bớt giận"],
					},
				],
			},
		]);
		expect(entry.source.url).toBe('https://vi.wiktionary.org/wiki/mitigate');
	});

	it('skips other languages before and after the English entry', () => {
		const entry = parseViWiktionary('run', RUN_VI)!;
		expect(entry.pronunciation).toBe('/ˈrən/');
		expect(entry.meanings.map((m) => m.label)).toEqual(['Danh từ', 'Nội động từ']);
		expect(entry.meanings[0].senses[0]).toEqual({ definition: 'Sự chạy.', examples: ['at a run — đang chạy', 'to break into a run'] });
		expect(entry.meanings[1].senses[0].definition).toBe('(Thường + up) chạy lên.');
	});

	it('returns null without an English entry', () => {
		expect(parseViWiktionary('xin', '{{-vie-}}\n{{-verb-}}\n# Xin.')).toBeNull();
		expect(parseViWiktionary('x', '{{-eng-}}\n{{-pron-}}\n* {{IPA4|en|/x/}}')).toBeNull();
	});
});

describe('parseGoogleDictionary', () => {
	it('groups terms by part of speech', () => {
		const data = [
			[['giảm nhẹ', 'mitigate', null, null, 3]],
			[['verb', ['làm bớt giận', 'làm dịu bớt', 'nguôi giận'], [], 'mitigate', 2]],
			'en',
		];
		const entry = parseGoogleDictionary('mitigate', data)!;
		expect(entry.meanings).toEqual([
			{ partOfSpeech: 'verb', label: 'Động từ', synonyms: [], senses: [{ definition: 'làm bớt giận, làm dịu bớt, nguôi giận', examples: [] }] },
		]);
		expect(entry.source.name).toBe('Google Dịch');
	});

	it('uses the translation for phrases without dictionary data', () => {
		const entry = parseGoogleDictionary('look after', [[['chăm sóc', 'look after']], null, 'en'])!;
		expect(entry.meanings[0]).toMatchObject({ label: 'Bản dịch', senses: [{ definition: 'chăm sóc' }] });
	});

	it('returns null when nothing was translated', () => {
		expect(parseGoogleDictionary('xyz', [[['xyz', 'xyz']], null, 'en'])).toBeNull();
		expect(parseGoogleDictionary('xyz', null)).toBeNull();
	});
});

describe('parseFreeDictionary', () => {
	it('merges entries by part of speech and keeps pronunciation and audio', () => {
		const data = [
			{
				word: 'light',
				phonetic: '/lʌɪt/',
				phonetics: [{ text: '/lʌɪt/', audio: '' }, { text: '/laɪt/', audio: 'https://x/light-uk.mp3' }],
				meanings: [
					{ partOfSpeech: 'noun', synonyms: ['visible light'], definitions: [{ definition: 'Visible electromagnetic radiation.', example: 'Put that light out!' }] },
					{ partOfSpeech: 'adjective', definitions: [{ definition: 'Having little weight.' }] },
				],
				sourceUrls: ['https://en.wiktionary.org/wiki/light'],
			},
			{ word: 'light', meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'A source of illumination.' }] }] },
		];
		const entry = parseFreeDictionary('light', data)!;
		expect(entry.pronunciation).toBe('/lʌɪt/');
		expect(entry.audioUrl).toBe('https://x/light-uk.mp3');
		expect(entry.meanings.map((m) => [m.partOfSpeech, m.senses.length])).toEqual([
			['noun', 2],
			['adjective', 1],
		]);
		expect(entry.meanings[0].senses[0].examples).toEqual(['Put that light out!']);
		expect(entry.meanings[0].synonyms).toEqual(['visible light']);
	});

	it('returns null for the not-found answer', () => {
		expect(parseFreeDictionary('qq', { title: 'No Definitions Found' })).toBeNull();
	});
});

describe('parseEnWiktionary', () => {
	it('reads English definitions as plain text', () => {
		const data = {
			en: [
				{
					partOfSpeech: 'Verb',
					language: 'English',
					definitions: [
						{ definition: '<span class="x"></span> To <a href="/wiki/reduce">reduce</a> &amp; lessen.', examples: ['<i>mitigate</i> the risk'] },
						{ definition: '' },
					],
				},
			],
		};
		const entry = parseEnWiktionary('mitigate', data)!;
		expect(entry.meanings).toEqual([
			{ partOfSpeech: 'verb', label: 'Động từ', synonyms: [], senses: [{ definition: 'To reduce & lessen.', examples: ['mitigate the risk'] }] },
		]);
		expect(parseEnWiktionary('x', { fr: [] })).toBeNull();
	});

	it('stripHtml decodes entities', () => {
		expect(stripHtml('a&#39;b &lt;c&gt; &#x2014;')).toBe("a'b <c> —");
	});
});

describe('filling a flashcard', () => {
	const entry = parseViWiktionary('run', RUN_VI)!;

	it('takes a meaning or one of its senses', () => {
		expect(fillFromMeaning(entry, 0)).toEqual({
			pronunciation: '/ˈrən/',
			partOfSpeech: 'noun',
			definition: 'Sự chạy',
			examples: ['at a run — đang chạy', 'to break into a run'],
		});
		expect(fillFromMeaning(entry, 1, 0).partOfSpeech).toBe('verb');
		expect(fillFromMeaning(entry, 5).definition).toBe('');
	});

	it('fills empty fields and adds to the rest without repeating', () => {
		const fill = fillFromMeaning(entry, 0);
		expect(mergeFill({ pronunciation: '', partOfSpeech: '', definition: '', examples: '' }, fill)).toEqual({
			pronunciation: '/ˈrən/',
			partOfSpeech: 'noun',
			definition: 'Sự chạy',
			examples: 'at a run — đang chạy\nto break into a run',
		});
		expect(
			mergeFill({ pronunciation: '/rʌn/', partOfSpeech: 'verb', definition: 'chạy', examples: 'At a run — đang chạy' }, fill),
		).toEqual({
			pronunciation: '/rʌn/',
			partOfSpeech: 'verb',
			definition: 'chạy; Sự chạy',
			examples: 'At a run — đang chạy\nto break into a run',
		});
	});
});
