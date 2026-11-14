'use client';

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowRight, Loader2, Pencil, SkipForward } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { cn } from '../ui/utils';
import { extractApiErrorMessage } from '@/lib/api-response';
import { FlashcardService, type FlashCardResponse } from '@/lib/api/services/FlashcardService';
import { FIELD_LABELS, MODE_LABELS, answerField, cardField, promptField } from '@/lib/flashcard-review/deck';
import type { ReviewAction, ReviewSession } from '@/lib/flashcard-review/session';
import type { Question, ReviewCard } from '@/lib/flashcard-review/types';
import { toReviewCard, unwrap } from './useReviewLists';

// native elements: the ui/ Input and Textarea don't forward refs (needed for focus management)
const FIELD_CLASS =
	'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base outline-none transition-[color,box-shadow] placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 motion-reduce:transition-none';

function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

function isInteractive(target: EventTarget | null): boolean {
	return target instanceof HTMLElement && (isTypingTarget(target) || !!target.closest('button, a, [role="switch"]'));
}


function ProgressBar({ value, max }: { value: number; max: number }) {
	const pct = max === 0 ? 0 : Math.round((value / max) * 100);
	return (
		<div
			role="progressbar"
			aria-label="Tiến độ"
			aria-valuemin={0}
			aria-valuemax={max}
			aria-valuenow={value}
			className="h-2 w-full overflow-hidden rounded-full bg-primary/15"
		>
			<div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
		</div>
	);
}

function CardEditor({
	card,
	onSaved,
	onCancel,
}: {
	card: ReviewCard;
	onSaved: (card: ReviewCard) => void;
	onCancel: () => void;
}) {
	const [word, setWord] = useState(card.word);
	const [definition, setDefinition] = useState(card.definition);
	const [notes, setNotes] = useState(card.notes ?? '');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const firstRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		firstRef.current?.focus();
	}, []);

	const save = async () => {
		if (!word.trim() || !definition.trim()) {
			setError('Từ và nghĩa không được để trống.');
			return;
		}
		setSaving(true);
		setError('');
		try {
			const res = await FlashcardService.updateFlashCard(card.id, {
				word: word.trim(),
				definition: definition.trim(),
				notes: notes.trim(),
			});
			const saved = unwrap<FlashCardResponse>(res);
			onSaved(saved?.id ? toReviewCard(saved, card.listId, card.listName) : { ...card, word: word.trim(), definition: definition.trim(), notes: notes.trim() || undefined });
		} catch (err) {
			setError(extractApiErrorMessage(err));
			setSaving(false);
		}
	};

	return (
		<form
			className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-4"
			onSubmit={e => {
				e.preventDefault();
				void save();
			}}
			onKeyDown={e => {
				if (e.key === 'Escape' && !saving) {
					e.stopPropagation();
					onCancel();
				}
			}}
			aria-label="Sửa thẻ"
		>
			<div className="space-y-1.5">
				<Label htmlFor="review-edit-word" className="font-semibold text-slate-700">
					{FIELD_LABELS.word}
				</Label>
				<input ref={firstRef} id="review-edit-word" value={word} onChange={e => setWord(e.target.value)} className={cn(FIELD_CLASS, 'h-10')} />
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="review-edit-definition" className="font-semibold text-slate-700">
					{FIELD_LABELS.definition}
				</Label>
				<textarea id="review-edit-definition" value={definition} onChange={e => setDefinition(e.target.value)} rows={2} className={cn(FIELD_CLASS, 'resize-y')} />
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="review-edit-notes" className="font-semibold text-slate-700">
					{FIELD_LABELS.notes}
				</Label>
				<textarea id="review-edit-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={cn(FIELD_CLASS, 'resize-y')} />
			</div>
			{error && (
				<p role="alert" className="text-sm font-medium text-rose-600">
					{error}
				</p>
			)}
			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="rounded-xl">
					Hủy
				</Button>
				<Button type="submit" disabled={saving} className="rounded-xl font-semibold">
					{saving && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />}
					Lưu thẻ
				</Button>
			</div>
		</form>
	);
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="grid gap-0.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3">
			<dt className="text-xs font-bold uppercase tracking-wider text-slate-400 sm:pt-0.5">{label}</dt>
			<dd className="whitespace-pre-wrap break-words text-slate-700">{children}</dd>
		</div>
	);
}

/**
 * The saved card, shown on the right once the player has answered: the value to compare with,
 * the card's other fields, and editing for the owner.
 */
function SavedCard({
	question,
	card,
	owns,
	editing,
	setEditing,
	onSaved,
	editRef,
}: {
	question: Question;
	card: ReviewCard;
	owns: boolean;
	editing: boolean;
	setEditing: (v: boolean) => void;
	onSaved: (card: ReviewCard) => void;
	editRef: React.RefObject<HTMLButtonElement | null>;
}) {
	const [savedNote, setSavedNote] = useState(false);
	const asked = answerField(question.mode);
	return (
		<div className="flex h-full flex-col gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
			<div>
				<p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary/70">Đã lưu · {FIELD_LABELS[asked]}</p>
				<p className="whitespace-pre-wrap break-words text-xl font-bold text-slate-900">{cardField(card, asked)}</p>
			</div>
			{editing ?
				<CardEditor
					card={card}
					onCancel={() => {
						setEditing(false);
						requestAnimationFrame(() => editRef.current?.focus());
					}}
					onSaved={updated => {
						onSaved(updated);
						setEditing(false);
						setSavedNote(true);
					}}
				/>
			:	<>
					<dl className="space-y-3 border-t border-primary/15 pt-3">
						<DetailRow label={FIELD_LABELS.word}>
							<span className="font-semibold">{card.word}</span>
							{card.partOfSpeech && <span className="ml-2 text-sm italic text-slate-500">({card.partOfSpeech})</span>}
						</DetailRow>
						{card.pronunciation && <DetailRow label="Phát âm">{card.pronunciation}</DetailRow>}
						<DetailRow label={FIELD_LABELS.definition}>{card.definition}</DetailRow>
						{card.notes && <DetailRow label={FIELD_LABELS.notes}>{card.notes}</DetailRow>}
						{card.examples.length > 0 && (
							<DetailRow label="Ví dụ">
								<ul className="list-disc space-y-1 pl-5">
									{card.examples.map((ex, i) => (
										<li key={i}>{ex}</li>
									))}
								</ul>
							</DetailRow>
						)}
					</dl>
					{owns && (
						<div className="mt-auto flex flex-wrap items-center gap-3">
							<Button ref={editRef} variant="outline" size="sm" onClick={() => setEditing(true)} className="rounded-lg bg-white">
								<Pencil className="h-4 w-4" aria-hidden /> Sửa thẻ
								<kbd className="ml-1 hidden rounded border border-slate-200 px-1 text-[10px] text-slate-400 sm:inline">E</kbd>
							</Button>
							{savedNote && (
								<span role="status" className="text-sm font-medium text-emerald-700">
									Đã lưu thay đổi.
								</span>
							)}
						</div>
					)}
				</>
			}
		</div>
	);
}

/**
 * One card, mounted fresh per question (keyed by the parent). While playing, the answer box takes the
 * centre; on submit it slides to the left half and the saved card animates in on the right
 * (below on phones), so what you wrote and what you saved sit side by side.
 */
function CardStage({
	session,
	question,
	card,
	userId,
	dispatch,
	isLast,
}: {
	session: ReviewSession;
	question: Question;
	card: ReviewCard;
	userId: string;
	dispatch: (a: ReviewAction) => void;
	isLast: boolean;
}) {
	const revealed = session.phase === 'reveal';
	const record = session.answers[question.key];
	const [answer, setAnswer] = useState('');
	const [editing, setEditing] = useState(false);
	const answerRef = useRef<HTMLTextAreaElement>(null);
	const nextRef = useRef<HTMLButtonElement>(null);
	const editRef = useRef<HTMLButtonElement | null>(null);
	const owns = card.authorId === userId;
	const shownField = promptField(question.mode);
	const field = answerField(question.mode);

	useEffect(() => {
		(revealed ? nextRef.current : answerRef.current)?.focus();
	}, [revealed]);

	// reveal: Enter = next card, E = edit (when the focus isn't in a field or on a control)
	useEffect(() => {
		if (!revealed || editing) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
			const key = e.key.toLowerCase();
			if (key === 'e' && owns) {
				e.preventDefault();
				setEditing(true);
			} else if (key === 'enter' && !isInteractive(e.target)) {
				e.preventDefault();
				dispatch({ type: 'next' });
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [revealed, editing, owns, dispatch]);

	const submit = () => {
		if (!answer.trim()) {
			answerRef.current?.focus();
			return;
		}
		dispatch({ type: 'submit', answer: answer });
	};

	const onKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
		// Vietnamese IMEs use Enter while composing
		if (!revealed && e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
			e.preventDefault();
			submit();
		}
	};

	const shown = revealed ? (record?.skipped ? '' : (record?.answer ?? answer)) : answer;

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
			<div className="mb-4 flex flex-wrap items-center gap-2">
				<span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{MODE_LABELS[question.mode]}</span>
				<span className="truncate text-xs font-medium text-slate-400">{card.listName}</span>
			</div>
			<section aria-labelledby="review-prompt-label" className="mb-6">
				<p id="review-prompt-label" className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
					{FIELD_LABELS[shownField]}
				</p>
				<p className={cn('whitespace-pre-wrap break-words font-bold text-slate-900', shownField === 'word' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl')}>
					{cardField(card, shownField)}
				</p>
				{shownField === 'word' && card.pronunciation && <p className="mt-1 italic text-slate-500">{card.pronunciation}</p>}
			</section>

			{/*
			 * Two fixed columns (md+). Before the reveal the answer box sits centred (moved right by half
			 * a column); on reveal it slides back to the left with a transform, so nothing reflows or
			 * re-wraps mid-animation, and the saved card fades in on the right. Phones stack them.
			 */}
			<div className="grid gap-4 md:min-h-[15rem] md:grid-cols-2">
				<form
					id="review-form"
					className={cn(
						'flex min-w-0 flex-col gap-3 motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
						!revealed && 'md:translate-x-[calc(50%+0.5rem)]',
					)}
					onSubmit={e => {
						e.preventDefault();
						submit();
					}}
				>
					<Label htmlFor="review-answer" className="font-semibold text-slate-700">
						{revealed ? 'Bạn trả lời' : `Nhập ${field === 'word' ? 'từ tiếng Anh' : 'nghĩa'}`}
					</Label>
					<textarea
						ref={answerRef}
						id="review-answer"
						value={shown}
						readOnly={revealed}
						onChange={e => setAnswer(e.target.value)}
						onKeyDown={onKeyDown}
						rows={field === 'word' ? 2 : 4}
						autoComplete="off"
						autoCorrect="off"
						autoCapitalize="off"
						spellCheck={false}
						enterKeyHint="done"
						aria-describedby="review-answer-hint"
						className={cn(FIELD_CLASS, 'min-h-12 flex-1 resize-y text-lg transition-colors duration-300', revealed && 'bg-slate-50 text-slate-800')}
						placeholder={revealed ? '(không có câu trả lời)' : field === 'word' ? 'Gõ từ tiếng Anh…' : 'Gõ nghĩa…'}
					/>
					{/* kept in place after the reveal (invisible) so the box doesn't change height */}
					<p id="review-answer-hint" className={cn('hidden text-xs text-slate-400 sm:block', revealed && 'invisible')}>
						Enter để xem thẻ đã lưu · Shift+Enter xuống dòng
					</p>
				</form>

				<div className="min-w-0">
					{revealed && (
						<div className="h-full motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 md:motion-safe:slide-in-from-bottom-0 md:motion-safe:slide-in-from-right-6 motion-safe:duration-500 motion-safe:ease-out motion-safe:fill-mode-both md:motion-safe:delay-150">
							<SavedCard
								question={question}
								card={card}
								owns={owns}
								editing={editing}
								setEditing={setEditing}
								onSaved={updated => {
									dispatch({ type: 'updateCard', card: updated });
									requestAnimationFrame(() => nextRef.current?.focus());
								}}
								editRef={editRef}
							/>
						</div>
					)}
				</div>
			</div>

			{/* one footer row in both states: only its content changes, so the page doesn't jump */}
			<div className="mt-5 flex min-h-11 flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
				{revealed ?
					<>
						<p className="text-sm text-slate-500 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300" role="status" aria-live="polite">
							So sánh điều bạn nhớ với nội dung đã lưu.
						</p>
						<Button
							ref={nextRef}
							onClick={() => dispatch({ type: 'next' })}
							// a held Enter (from submitting) must not skip past the reveal
							onKeyDown={e => e.repeat && e.key === 'Enter' && e.preventDefault()}
							disabled={editing}
							className="h-11 shrink-0 rounded-xl px-6 font-bold motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
						>
							{isLast ? 'Hoàn thành' : 'Tiếp'} <ArrowRight className="h-4 w-4" aria-hidden />
							<kbd className="ml-1 hidden rounded border border-white/40 px-1 text-[10px] opacity-80 sm:inline">Enter</kbd>
						</Button>
					</>
				:	<div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
						<Button type="button" variant="outline" onClick={() => dispatch({ type: 'skip' })} className="h-11 rounded-xl font-semibold">
							<SkipForward className="h-4 w-4" aria-hidden /> Bỏ qua
						</Button>
						<Button type="submit" form="review-form" disabled={!answer.trim()} className="h-11 rounded-xl px-6 font-bold">
							Xem thẻ đã lưu
						</Button>
					</div>
				}
			</div>
		</div>
	);
}

export function ReviewPlay({
	session,
	userId,
	dispatch,
	onExit,
}: {
	session: ReviewSession;
	userId: string;
	dispatch: (a: ReviewAction) => void;
	onExit: () => void;
}) {
	const question = session.queue[session.index];
	const card = question ? session.cards[question.cardId] : undefined;
	if (!question || !card) return null;

	const total = session.queue.length;
	const done = session.index + (session.phase === 'reveal' ? 1 : 0);

	return (
		<div className="mx-auto max-w-5xl space-y-5 px-4 sm:px-6">
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-3 text-sm">
					<span className="font-semibold text-slate-600">
						Thẻ {session.index + 1} / {total}
						{session.round > 1 && <span className="ml-2 text-slate-400">· Lượt {session.round}</span>}
					</span>
					<button type="button" onClick={onExit} className="font-semibold text-slate-500 hover:text-slate-800">
						Kết thúc
					</button>
				</div>
				<ProgressBar value={done} max={total} />
			</div>

			{/* one key per card (and round): every card starts from a clean slate */}
			<CardStage
				key={`card-${session.round}-${session.index}-${question.key}`}
				session={session}
				question={question}
				card={card}
				userId={userId}
				dispatch={dispatch}
				isLast={session.index === total - 1}
			/>
		</div>
	);
}
