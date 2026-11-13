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

function Reveal({
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
	const record = session.answers[question.key];
	const [editing, setEditing] = useState(false);
	const [savedNote, setSavedNote] = useState(false);
	const nextRef = useRef<HTMLButtonElement>(null);
	const editRef = useRef<HTMLButtonElement>(null);
	const owns = card.authorId === userId;
	const expected = cardField(card, answerField(question.mode));
	const answer = record?.answer ?? '';

	useEffect(() => {
		nextRef.current?.focus();
	}, [question.key]);

	useEffect(() => {
		if (editing) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
			const key = e.key.toLowerCase();
			if (key === 'e' && owns) {
				e.preventDefault();
				setEditing(true);
			} else if (key === 'enter' && !isInteractive(e.target)) {
				e.preventDefault();
				dispatch({ type: 'next' });
			} else return;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [editing, owns, dispatch]);

	return (
		<div className="space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
			{/* no scoring: the player compares what they wrote with what they saved */}
			<p className="text-sm text-slate-500" role="status" aria-live="polite">
				So sánh điều bạn nhớ với nội dung đã lưu.
			</p>

			<div className="grid gap-3 md:grid-cols-2">
				<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
					<p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Bạn trả lời</p>
					{record?.skipped || !answer.trim() ? (
						<p className="italic text-slate-400">(không có câu trả lời)</p>
					) : (
						<p className="whitespace-pre-wrap break-words text-lg font-medium text-slate-800">{answer}</p>
					)}
				</div>
				<div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
					<p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary/70">Đã lưu · {FIELD_LABELS[answerField(question.mode)]}</p>
					<p className="whitespace-pre-wrap break-words text-lg font-semibold text-slate-900">
						{expected}
					</p>
				</div>
			</div>
			{editing ? (
				<CardEditor
					card={card}
					onCancel={() => {
						setEditing(false);
						requestAnimationFrame(() => editRef.current?.focus());
					}}
					onSaved={updated => {
						dispatch({ type: 'updateCard', card: updated });
						setEditing(false);
						setSavedNote(true);
						requestAnimationFrame(() => nextRef.current?.focus());
					}}
				/>
			) : (
				<div className="rounded-xl border border-slate-200 p-4">
					<dl className="space-y-3">
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
						<DetailRow label="Bộ thẻ">{card.listName}</DetailRow>
					</dl>
					<div className="mt-4 border-t border-slate-100 pt-3">
						{owns ? (
							<div className="flex flex-wrap items-center gap-3">
								<Button ref={editRef} variant="outline" size="sm" onClick={() => setEditing(true)} className="rounded-lg">
									<Pencil className="h-4 w-4" aria-hidden /> Sửa thẻ
									<kbd className="ml-1 hidden rounded border border-slate-200 px-1 text-[10px] text-slate-400 sm:inline">E</kbd>
								</Button>
								{savedNote && (
									<span role="status" className="text-sm font-medium text-emerald-700">
										Đã lưu thay đổi.
									</span>
								)}
							</div>
						) : null}
					</div>
				</div>
			)}

			<div className="flex justify-end">
				<Button
					ref={nextRef}
					onClick={() => dispatch({ type: 'next' })}
					// a held Enter (from submitting) must not skip past the reveal
					onKeyDown={e => e.repeat && e.key === 'Enter' && e.preventDefault()}
					disabled={editing} className="h-11 rounded-xl px-6 font-bold">
					{isLast ? 'Hoàn thành' : 'Tiếp'} <ArrowRight className="h-4 w-4" aria-hidden />
					<kbd className="ml-1 hidden rounded border border-white/40 px-1 text-[10px] opacity-80 sm:inline">Enter</kbd>
				</Button>
			</div>
		</div>
	);
}

function AnswerForm({ question, dispatch }: { question: Question; dispatch: (a: ReviewAction) => void }) {
	const [answer, setAnswer] = useState('');
	const ref = useRef<HTMLTextAreaElement>(null);
	const field = answerField(question.mode);

	useEffect(() => {
		setAnswer('');
		ref.current?.focus();
	}, [question.key]);

	const submit = () => {
		if (!answer.trim()) {
			ref.current?.focus();
			return;
		}
		dispatch({ type: 'submit', answer: answer });
	};

	const onKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
		// Vietnamese IMEs use Enter while composing
		if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
			e.preventDefault();
			submit();
		}
	};

	return (
		<form
			className="space-y-3"
			onSubmit={e => {
				e.preventDefault();
				submit();
			}}
		>
			<Label htmlFor="review-answer" className="font-semibold text-slate-700">
				Nhập {field === 'word' ? 'từ tiếng Anh' : 'nghĩa'}
			</Label>
			<textarea
				ref={ref}
				id="review-answer"
				value={answer}
				onChange={e => setAnswer(e.target.value)}
				onKeyDown={onKeyDown}
				rows={field === 'word' ? 1 : 3}
				autoComplete="off"
				autoCorrect="off"
				autoCapitalize="off"
				spellCheck={false}
				enterKeyHint="done"
				aria-describedby="review-answer-hint"
				className={cn(FIELD_CLASS, 'min-h-12 resize-y text-lg')}
				placeholder={field === 'word' ? 'Gõ từ tiếng Anh…' : 'Gõ nghĩa…'}
			/>
			<p id="review-answer-hint" className="hidden text-xs text-slate-400 sm:block">
				Enter để kiểm tra · Shift+Enter xuống dòng
			</p>
			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button type="button" variant="outline" onClick={() => dispatch({ type: 'skip' })} className="h-11 rounded-xl font-semibold">
					<SkipForward className="h-4 w-4" aria-hidden /> Bỏ qua
				</Button>
				<Button type="submit" disabled={!answer.trim()} className="h-11 rounded-xl px-6 font-bold">
					Kiểm tra
				</Button>
			</div>
		</form>
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

	const shownField = promptField(question.mode);
	const total = session.queue.length;
	const done = session.index + (session.phase === 'reveal' ? 1 : 0);

	return (
		<div className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6">
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

			<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
				<div className="mb-4 flex flex-wrap items-center gap-2">
					<span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{MODE_LABELS[question.mode]}</span>
					<span className="truncate text-xs font-medium text-slate-400">{card.listName}</span>
				</div>
				<section aria-labelledby="review-prompt-label" key={question.key} className="mb-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
					<p id="review-prompt-label" className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
						{FIELD_LABELS[shownField]}
					</p>
					<p className={cn('whitespace-pre-wrap break-words font-bold text-slate-900', shownField === 'word' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl')}>
						{cardField(card, shownField)}
					</p>
					{shownField === 'word' && card.pronunciation && <p className="mt-1 italic text-slate-500">{card.pronunciation}</p>}
					{card.partOfSpeech && <p className="mt-1 text-sm text-slate-400">Loại từ: {card.partOfSpeech}</p>}
				</section>

				{session.phase === 'playing' ? (
					<AnswerForm question={question} dispatch={dispatch} />
				) : (
					<Reveal
						key={question.key}
						session={session}
						question={question}
						card={card}
						userId={userId}
						dispatch={dispatch}
						isLast={session.index === total - 1}
					/>
				)}
			</div>
		</div>
	);
}
