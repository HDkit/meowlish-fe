'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ChevronUp, Wand2 } from 'lucide-react';
import { fillFromMeaning, mergeFill, type DictionaryKind, type FlashcardFields } from '@/lib/dictionary';
import { DictionaryKindTabs, DictionaryResult } from '../dictionary/DictionaryResult';
import { readSavedKind, saveKind, useDictionaryLookup } from '../dictionary/useDictionaryLookup';

/**
 * "Tra từ điển" for a flashcard form: looks the card's word up (Anh–Việt or Anh–Anh) and fills the
 * pronunciation, part of speech, definition and examples, either all at once from the first
 * meaning ("Điền tự động") or one sense at a time. What the user wrote is kept (see mergeFill).
 */
export function DictionaryAutofill({
	word,
	fields,
	onFill,
}: {
	word: string;
	fields: FlashcardFields;
	onFill: (next: FlashcardFields) => void;
}) {
	const [open, setOpen] = useState(false);
	const [kind, setKind] = useState<DictionaryKind>('en-vi');
	const [retry, setRetry] = useState(0);
	const [filled, setFilled] = useState('');
	// only look up while open, so typing the word does not fire requests
	const state = useDictionaryLookup(kind, open ? word : '', retry);

	useEffect(() => setKind(readSavedKind('en-vi')), []);
	useEffect(() => setFilled(''), [word, kind]);

	const changeKind = (k: DictionaryKind) => {
		setKind(k);
		saveKind(k);
	};

	// Vietnamese senses are short, so the first few read well together; English ones are sentences
	const maxSenses = kind === 'en-vi' ? 3 : 1;
	const apply = (meaningIndex: number, senseIndex?: number) => {
		if (state.status !== 'done') return;
		onFill(mergeFill(fields, fillFromMeaning(state.entry, meaningIndex, senseIndex, maxSenses)));
		setFilled(senseIndex === undefined ? 'Đã điền từ nghĩa đầu tiên.' : 'Đã thêm nghĩa vào thẻ.');
	};

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				disabled={!word.trim()}
				title={word.trim() ? `Tra “${word.trim()}” và điền vào thẻ` : 'Nhập từ trước để tra từ điển'}
				className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<BookOpen className="h-3.5 w-3.5" aria-hidden /> Tra từ điển
			</button>
		);
	}

	return (
		<div className="mt-2 rounded-xl border border-primary/20 bg-primary/[0.03] p-3">
			<div className="mb-2 flex flex-wrap items-center gap-2">
				<DictionaryKindTabs value={kind} onChange={changeKind} />
				<button
					type="button"
					onClick={() => apply(0)}
					disabled={state.status !== 'done'}
					className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
					title="Điền phát âm, từ loại, định nghĩa và ví dụ từ nghĩa đầu tiên"
				>
					<Wand2 className="h-3.5 w-3.5" aria-hidden /> Điền tự động
				</button>
				<span className="flex-1" />
				<button
					type="button"
					onClick={() => setOpen(false)}
					className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
				>
					<ChevronUp className="h-3.5 w-3.5" aria-hidden /> Ẩn
				</button>
			</div>
			{filled && (
				<p role="status" className="mb-2 text-xs font-medium text-emerald-700">
					{filled}
				</p>
			)}
			<div className="max-h-64 overflow-y-auto rounded-lg bg-white px-3 py-2">
				<DictionaryResult state={state} onRetry={() => setRetry((n) => n + 1)} onUseSense={(m, s) => apply(m, s)} />
			</div>
		</div>
	);
}
