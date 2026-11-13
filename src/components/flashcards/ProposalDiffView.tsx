'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, ArrowRight, Minus, Pencil, Plus } from 'lucide-react';
import type {
	FlashCardContent,
	FlashCardListChanges,
	ModifiedCardChange,
	RemovedCardChange,
} from '@/lib/api/services/FlashcardProposalService';
import { fieldChangeRows, formatFieldValue } from '@/lib/flashcard-proposals';

const EMPTY = <span className="italic text-slate-400">(trống)</span>;

function CardSummary({ card, tone }: { card: FlashCardContent; tone: 'added' | 'removed' }) {
	const examples = formatFieldValue(card, 'examples');
	const notes = formatFieldValue(card, 'notes');
	return (
		<div className="min-w-0">
			<p className={`font-bold text-slate-800 ${tone === 'removed' ? 'line-through decoration-rose-400' : ''}`}>
				{card.word}
				{card.partOfSpeech && <span className="ml-2 text-xs font-medium text-slate-400">({card.partOfSpeech})</span>}
				{card.pronunciation && <span className="ml-2 text-xs italic font-normal text-slate-400">{card.pronunciation}</span>}
			</p>
			<p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600">{card.definition}</p>
			{examples && <p className="mt-1 text-xs text-slate-500">Ví dụ: {examples}</p>}
			{notes && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">Ghi chú: {notes}</p>}
			{card.tags.length > 0 && (
				<div className="mt-1.5 flex flex-wrap gap-1">
					{card.tags.map(tag => (
						<span key={tag} className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
							{tag}
						</span>
					))}
				</div>
			)}
		</div>
	);
}

function ConflictNote({ children }: { children: ReactNode }) {
	return (
		<p className="flex items-start gap-1.5 text-xs font-semibold text-amber-700">
			<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
			<span>{children}</span>
		</p>
	);
}

function ModifiedCard({ change, choice }: { change: ModifiedCardChange; choice?: ReactNode }) {
	const rows = fieldChangeRows(change);
	return (
		<li className={`rounded-xl border bg-white p-4 ${change.conflict ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>
			<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
				<p className="font-bold text-slate-800">{change.base.word}</p>
				{change.targetMissing && (
					<span className="text-xs font-medium text-slate-500">Thẻ gốc đã bị xoá, thay đổi này sẽ được bỏ qua</span>
				)}
			</div>
			<dl className="space-y-2">
				{rows.map(row => (
					<div key={row.field} className="grid gap-1 sm:grid-cols-[7rem_1fr]">
						<dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{row.label}</dt>
						<dd className="min-w-0 space-y-1 text-sm">
							<div className="flex flex-wrap items-start gap-1.5">
								<span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700 line-through decoration-rose-300 break-words">
									{row.before || EMPTY}
								</span>
								<ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="thành" />
								<span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-800 break-words">
									{row.after || EMPTY}
								</span>
							</div>
							{row.current !== undefined && (
								<ConflictNote>Chủ bộ thẻ đã sửa thành: “{row.current || '(trống)'}”</ConflictNote>
							)}
						</dd>
					</div>
				))}
			</dl>
			{choice}
		</li>
	);
}

function RemovedCard({ change, choice }: { change: RemovedCardChange; choice?: ReactNode }) {
	return (
		<li className={`rounded-xl border bg-white p-4 ${change.conflict ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>
			<CardSummary card={change.base} tone="removed" />
			{change.conflict && <div className="mt-2"><ConflictNote>Chủ bộ thẻ đã sửa thẻ này sau khi đề xuất được gửi.</ConflictNote></div>}
			{change.targetMissing && <p className="mt-2 text-xs font-medium text-slate-500">Thẻ này đã được xoá khỏi bản gốc.</p>}
			{choice}
		</li>
	);
}

function Section({ icon, title, count, tone, children }: {
	icon: ReactNode;
	title: string;
	count: number;
	tone: string;
	children: ReactNode;
}) {
	if (count === 0) return null;
	return (
		<section className="space-y-3">
			<h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
				<span className={`flex h-6 w-6 items-center justify-center rounded-full ${tone}`}>{icon}</span>
				{title}
				<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{count}</span>
			</h3>
			<ul className="space-y-3">{children}</ul>
		</section>
	);
}

/**
 * The cards a copy adds, changes (field by field, before → after) and removes relative to the
 * original. `renderChoice` adds a control under conflicting cards (the owner's accept choice).
 */
export function ProposalDiffView({
	changes,
	renderChoice,
}: {
	changes: FlashCardListChanges;
	renderChoice?: (targetCardId: string) => ReactNode;
}) {
	return (
		<div className="space-y-6">
			<Section icon={<Plus className="h-3.5 w-3.5" />} title="Thẻ mới" count={changes.added.length} tone="bg-emerald-100 text-emerald-700">
				{changes.added.map(change => (
					<li key={change.sourceCardId} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
						<CardSummary card={change.card} tone="added" />
					</li>
				))}
			</Section>
			<Section icon={<Pencil className="h-3.5 w-3.5" />} title="Thẻ được sửa" count={changes.modified.length} tone="bg-amber-100 text-amber-700">
				{changes.modified.map(change => (
					<ModifiedCard
						key={change.targetCardId}
						change={change}
						choice={change.conflict ? renderChoice?.(change.targetCardId) : undefined}
					/>
				))}
			</Section>
			<Section icon={<Minus className="h-3.5 w-3.5" />} title="Thẻ bị xoá" count={changes.removed.length} tone="bg-rose-100 text-rose-700">
				{changes.removed.map(change => (
					<RemovedCard
						key={change.targetCardId}
						change={change}
						choice={change.conflict ? renderChoice?.(change.targetCardId) : undefined}
					/>
				))}
			</Section>
		</div>
	);
}
