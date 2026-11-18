'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import type { DictionaryKind } from '@/lib/dictionary';
import { normalizeQuery } from '@/lib/dictionary';
import { DictionaryKindTabs, DictionaryResult } from './DictionaryResult';
import { readSavedKind, saveKind, useDictionaryLookup } from './useDictionaryLookup';

type DictionaryApi = {
	/** Opens the panel; with a word, looks it up. */
	lookUp: (word?: string) => void;
	toggle: () => void;
	isOpen: boolean;
};

const DictionaryContext = createContext<DictionaryApi | null>(null);

/** The dictionary of the page, or null outside a DictionaryProvider (callers then hide their button). */
export const useDictionary = () => useContext(DictionaryContext);

/**
 * Gives its subtree a dictionary panel: a floating, non-modal panel (the test stays usable while it
 * is open) opened from the highlight toolbar or the launcher button.
 */
export function DictionaryProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setOpen] = useState(false);
	const [word, setWord] = useState('');
	// bumps when a word is sent from outside, so the input shows it even if it is the same word
	const [request, setRequest] = useState(0);

	const lookUp = useCallback((next?: string) => {
		const q = next ? normalizeQuery(next) : '';
		if (q) {
			setWord(q);
			setRequest((n) => n + 1);
		}
		setOpen(true);
	}, []);
	const toggle = useCallback(() => setOpen((o) => !o), []);
	const api = useMemo(() => ({ lookUp, toggle, isOpen }), [lookUp, toggle, isOpen]);

	return (
		<DictionaryContext.Provider value={api}>
			{children}
			{isOpen && <DictionaryPanel word={word} request={request} onWord={setWord} onClose={() => setOpen(false)} />}
		</DictionaryContext.Provider>
	);
}

function DictionaryPanel({
	word,
	request,
	onWord,
	onClose,
}: {
	word: string;
	request: number;
	onWord: (w: string) => void;
	onClose: () => void;
}) {
	const [kind, setKind] = useState<DictionaryKind>(() => readSavedKind('en-vi'));
	const [draft, setDraft] = useState(word);
	const [retry, setRetry] = useState(0);
	const state = useDictionaryLookup(kind, word, retry);

	// a word sent from the toolbar replaces what is typed
	useEffect(() => setDraft(word), [word, request]);
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	const changeKind = (k: DictionaryKind) => {
		setKind(k);
		saveKind(k);
	};

	return (
		<div
			role="dialog"
			aria-label="Từ điển"
			className="fixed inset-x-4 top-4 z-[60] flex max-h-[min(70vh,560px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-right-4 duration-200 sm:inset-x-auto sm:right-14 sm:top-[12vh] sm:w-[380px]"
		>
			<div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
				<BookOpen className="h-4 w-4 text-primary" aria-hidden />
				<h2 className="flex-1 text-sm font-bold text-slate-800">Từ điển</h2>
				<DictionaryKindTabs value={kind} onChange={changeKind} />
				<button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Đóng từ điển" title="Đóng (Esc)">
					<X className="h-4 w-4" aria-hidden />
				</button>
			</div>
			<form
				className="border-b border-slate-100 px-4 py-2"
				onSubmit={(e) => {
					e.preventDefault();
					onWord(normalizeQuery(draft));
				}}
			>
				<label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
					<Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
					<input
						// opened without a word: ready to type
						autoFocus={!word}
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						placeholder="Nhập từ tiếng Anh rồi Enter"
						aria-label="Từ cần tra"
						className="h-9 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
					/>
				</label>
			</form>
			<div className="flex-1 overflow-y-auto px-4 py-3">
				<DictionaryResult state={state} onRetry={() => setRetry((n) => n + 1)} />
			</div>
		</div>
	);
}

/** The round "Từ điển" button under the test panel toggle. */
export function DictionaryLauncherButton() {
	const dictionary = useDictionary();
	if (!dictionary) return null;
	return (
		<button
			type="button"
			onClick={dictionary.toggle}
			aria-pressed={dictionary.isOpen}
			aria-label={dictionary.isOpen ? 'Đóng từ điển' : 'Mở từ điển'}
			title="Từ điển (bôi đen hoặc nhấp chuột phải vào một từ để tra nhanh)"
			className={`flex min-w-[48px] flex-col items-center gap-0.5 rounded-l-xl px-1 py-2 text-white shadow-lg ring-2 ring-white transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${
				dictionary.isOpen ? 'bg-slate-700 hover:bg-slate-800' : 'bg-primary hover:bg-primary/90'
			}`}
		>
			<BookOpen className="h-4 w-4" aria-hidden />
			<span className="text-[9px] font-bold leading-none">Từ điển</span>
		</button>
	);
}
