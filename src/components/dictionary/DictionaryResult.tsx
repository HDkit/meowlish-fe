'use client';

import { useRef } from 'react';
import { ExternalLink, Loader2, Plus, RotateCw, SearchX, Volume2 } from 'lucide-react';
import type { DictionaryEntry, DictionaryKind } from '@/lib/dictionary';
import type { LookupState } from './useDictionaryLookup';

export const DICTIONARY_KINDS: { value: DictionaryKind; label: string; hint: string }[] = [
	{ value: 'en-vi', label: 'Anh – Việt', hint: 'Nghĩa tiếng Việt' },
	{ value: 'en-en', label: 'Anh – Anh', hint: 'Định nghĩa tiếng Anh' },
];

/** The two dictionaries as a small segmented switch. */
export function DictionaryKindTabs({ value, onChange }: { value: DictionaryKind; onChange: (kind: DictionaryKind) => void }) {
	return (
		<div role="tablist" aria-label="Chọn từ điển" className="inline-flex rounded-lg bg-slate-100 p-0.5">
			{DICTIONARY_KINDS.map((k) => (
				<button
					key={k.value}
					type="button"
					role="tab"
					aria-selected={value === k.value}
					title={k.hint}
					onClick={() => onChange(k.value)}
					className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
						value === k.value ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
					}`}
				>
					{k.label}
				</button>
			))}
		</div>
	);
}

/**
 * A lookup's state: loading, not found, error (with retry) or the entry. With `onUseSense`, each
 * sense gets a button that hands it to the caller (used to fill a flashcard).
 */
export function DictionaryResult({
	state,
	onRetry,
	onUseSense,
}: {
	state: LookupState;
	onRetry?: () => void;
	onUseSense?: (meaningIndex: number, senseIndex: number) => void;
}) {
	if (state.status === 'idle') {
		return <p className="py-6 text-center text-sm text-slate-500">Nhập hoặc bôi đen một từ để tra.</p>;
	}
	if (state.status === 'loading') {
		return (
			<p className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500" role="status">
				<Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> Đang tra từ điển…
			</p>
		);
	}
	if (state.status === 'not-found') {
		return (
			<p className="flex flex-col items-center gap-2 py-6 text-center text-sm text-slate-500">
				<SearchX className="h-5 w-5 text-slate-400" aria-hidden />
				{state.message}
			</p>
		);
	}
	if (state.status === 'error') {
		return (
			<div role="alert" className="flex flex-col items-center gap-2 py-6 text-center text-sm text-red-600">
				{state.message}
				{onRetry && (
					<button type="button" onClick={onRetry} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
						<RotateCw className="h-3.5 w-3.5" aria-hidden /> Thử lại
					</button>
				)}
			</div>
		);
	}
	return <DictionaryEntryView entry={state.entry} onUseSense={onUseSense} />;
}

function DictionaryEntryView({ entry, onUseSense }: { entry: DictionaryEntry; onUseSense?: (m: number, s: number) => void }) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const play = () => {
		if (!entry.audioUrl) return;
		audioRef.current ??= new Audio(entry.audioUrl);
		audioRef.current.currentTime = 0;
		void audioRef.current.play().catch(() => undefined);
	};

	return (
		<div className="space-y-3 text-sm">
			<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
				<span className="text-lg font-bold text-slate-900">{entry.word}</span>
				{entry.pronunciation && <span className="font-mono text-slate-500">{entry.pronunciation}</span>}
				{entry.audioUrl && (
					<button
						type="button"
						onClick={play}
						className="self-center rounded-full p-1 text-primary hover:bg-primary/10"
						title="Nghe phát âm"
						aria-label={`Nghe phát âm “${entry.word}”`}
					>
						<Volume2 className="h-4 w-4" aria-hidden />
					</button>
				)}
			</div>

			{entry.meanings.map((meaning, mi) => (
				<section key={`${meaning.label}-${mi}`} className="space-y-1.5">
					<h4 className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
						{meaning.label}
					</h4>
					<ol className="list-decimal space-y-1.5 pl-5 marker:text-xs marker:text-slate-400">
						{meaning.senses.map((sense, si) => (
							<li key={si} className="group/sense">
								<div className="flex items-start gap-2">
									<span className="flex-1 leading-relaxed text-slate-800">{sense.definition}</span>
									{onUseSense && (
										<button
											type="button"
											onClick={() => onUseSense(mi, si)}
											className="mt-0.5 inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/10"
											title="Thêm nghĩa này (và ví dụ) vào thẻ"
										>
											<Plus className="h-3 w-3" aria-hidden /> Dùng
										</button>
									)}
								</div>
								{sense.examples.length > 0 && (
									<ul className="mt-0.5 space-y-0.5">
										{sense.examples.slice(0, 3).map((ex, ei) => (
											<li key={ei} className="text-[13px] italic leading-snug text-slate-500">
												{ex}
											</li>
										))}
									</ul>
								)}
							</li>
						))}
					</ol>
					{meaning.synonyms.length > 0 && (
						<p className="text-xs text-slate-500">
							<span className="font-semibold">Đồng nghĩa:</span> {meaning.synonyms.join(', ')}
						</p>
					)}
				</section>
			))}

			<a
				href={entry.source.url}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-primary hover:underline"
			>
				Nguồn: {entry.source.name} <ExternalLink className="h-3 w-3" aria-hidden />
			</a>
		</div>
	);
}
