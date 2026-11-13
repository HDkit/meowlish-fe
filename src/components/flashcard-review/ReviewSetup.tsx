'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, BookOpen, Loader2, Play, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { cn } from '../ui/utils';
import { MODE_LABELS, countQualifying } from '@/lib/flashcard-review/deck';
import {
	ALL_MODES,
	type DeckSize,
	type PromptMode,
	type ReviewCard,
	type ReviewSettings,
} from '@/lib/flashcard-review/types';
import { useReviewLists, type ListDetail, type ReviewListInfo } from './useReviewLists';

const MODE_HINTS: Record<PromptMode, string> = {
	'word-to-definition': 'Hiện từ tiếng Anh, bạn gõ nghĩa',
	'definition-to-word': 'Hiện nghĩa, bạn gõ từ tiếng Anh',
	'note-to-word': 'Hiện ghi chú, bạn gõ từ (chỉ thẻ có ghi chú)',
};

const SIZES: { value: DeckSize; label: string }[] = [
	{ value: 'all', label: 'Tất cả' },
	{ value: 10, label: '10' },
	{ value: 20, label: '20' },
	{ value: 50, label: '50' },
];

function CardCount({ detail, onRetry }: { detail?: ListDetail; onRetry: () => void }) {
	if (!detail || detail.status === 'loading') {
		return (
			<span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
				<Loader2 className="h-3 w-3 motion-safe:animate-spin" aria-hidden />
				<span className="sr-only">Đang đếm thẻ</span>…
			</span>
		);
	}
	if (detail.status === 'error') {
		return (
			<button
				type="button"
				onClick={e => {
					e.preventDefault();
					onRetry();
				}}
				className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
				title={detail.message}
			>
				<RefreshCw className="h-3 w-3" aria-hidden /> Lỗi, thử lại
			</button>
		);
	}
	return (
		<span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
			{detail.cards.length} thẻ
		</span>
	);
}

function ListRow({
	list,
	checked,
	onToggle,
	detail,
	onRetry,
}: {
	list: ReviewListInfo;
	checked: boolean;
	onToggle: (list: ReviewListInfo) => void;
	detail?: ListDetail;
	onRetry: () => void;
}) {
	const id = `review-list-${list.id}`;
	return (
		<li>
			<label
				htmlFor={id}
				className={cn(
					'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors motion-reduce:transition-none',
					checked ? 'border-primary/40 bg-primary/5' : 'border-slate-200 bg-white hover:bg-slate-50',
				)}
			>
				<Checkbox id={id} checked={checked} onCheckedChange={() => onToggle(list)} />
				<span className="min-w-0 flex-1">
					<span className="block truncate font-semibold text-slate-800">{list.name}</span>
					{list.description && <span className="block truncate text-xs text-slate-500">{list.description}</span>}
				</span>
				<CardCount detail={detail} onRetry={onRetry} />
			</label>
		</li>
	);
}

function ListGroup({
	title,
	lists,
	loading,
	error,
	empty,
	selected,
	onToggle,
	details,
	onRetryDetail,
	onReload,
}: {
	title: string;
	lists: ReviewListInfo[];
	loading: boolean;
	error?: string;
	empty: string;
	selected: Record<string, ReviewListInfo>;
	onToggle: (list: ReviewListInfo) => void;
	details: Record<string, ListDetail>;
	onRetryDetail: (id: string) => void;
	onReload: () => void;
}) {
	return (
		<section aria-label={title} className="space-y-2">
			<h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
				{title}
				{loading && <Loader2 className="h-3 w-3 motion-safe:animate-spin" aria-label="Đang tải" />}
			</h3>
			{error ? (
				<div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
					<AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
					<span className="flex-1">{error}</span>
					<Button size="sm" variant="outline" onClick={onReload} className="h-8 rounded-lg">
						Thử lại
					</Button>
				</div>
			) : lists.length === 0 && !loading ? (
				<p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">{empty}</p>
			) : (
				<ul className="space-y-2">
					{lists.map(list => (
						<ListRow
							key={list.id}
							list={list}
							checked={!!selected[list.id]}
							onToggle={onToggle}
							detail={details[list.id]}
							onRetry={() => onRetryDetail(list.id)}
						/>
					))}
				</ul>
			)}
		</section>
	);
}

export interface ReviewSetupProps {
	userId: string;
	preselectId?: string;
	initialSettings?: Partial<ReviewSettings>;
	/** An unfinished stored session, offered to resume. */
	resumable?: { position: number; total: number } | null;
	onResume: () => void;
	onStart: (cards: ReviewCard[], settings: ReviewSettings) => void;
}

export function ReviewSetup({ userId, preselectId, initialSettings, resumable, onResume, onStart }: ReviewSetupProps) {
	const [search, setSearch] = useState('');
	const [query, setQuery] = useState('');
	useEffect(() => {
		const t = setTimeout(() => setQuery(search.trim()), 350);
		return () => clearTimeout(t);
	}, [search]);

	const { mine, others, extra, details, retryDetail, reload } = useReviewLists(userId, query, preselectId);

	const [selected, setSelected] = useState<Record<string, ReviewListInfo>>({});
	const [modes, setModes] = useState<PromptMode[]>(initialSettings?.modes?.length ? initialSettings.modes : [...ALL_MODES]);
	const [size, setSize] = useState<DeckSize>(initialSettings?.size ?? 'all');
	const [shuffle, setShuffle] = useState(initialSettings?.shuffle ?? true);
	const [ignoreAccents, setIgnoreAccents] = useState(initialSettings?.ignoreAccents ?? false);

	// restore the previous selection, or preselect ?list= (once each: a later uncheck sticks)
	const [wantedIds] = useState(() => new Set(preselectId ? [preselectId] : (initialSettings?.listIds ?? [])));
	useEffect(() => {
		if (wantedIds.size === 0) return;
		const found = [...(mine.data ?? []), ...(others.data ?? []), ...(extra ? [extra] : [])].filter(l =>
			wantedIds.has(l.id),
		);
		if (found.length === 0) return;
		found.forEach(l => wantedIds.delete(l.id));
		setSelected(prev => {
			const next = { ...prev };
			for (const l of found) next[l.id] = l;
			return next;
		});
	}, [mine, others, extra, wantedIds]);

	const toggle = (list: ReviewListInfo) => {
		wantedIds.delete(list.id);
		setSelected(prev => {
			const next = { ...prev };
			if (next[list.id]) delete next[list.id];
			else next[list.id] = list;
			return next;
		});
	};

	const needle = search.trim().toLocaleLowerCase('vi');
	const mineFiltered = (mine.data ?? []).filter(l => !needle || l.name.toLocaleLowerCase('vi').includes(needle));
	const shownIds = new Set([...mineFiltered, ...(others.data ?? [])].map(l => l.id));
	// selected lists the current search hides (or a preselected list that is in neither group)
	const hiddenSelected = Object.values(selected).filter(l => !shownIds.has(l.id));

	const preselectDetail = preselectId ? details[preselectId] : undefined;
	const preselectError =
		preselectId && !selected[preselectId] && preselectDetail?.status === 'error' ? preselectDetail.message : '';

	const selectedIds = Object.keys(selected);
	const selectedDetails = selectedIds.map(id => details[id]);
	const stillLoading = selectedDetails.some(d => !d || d.status === 'loading');
	const failed = selectedDetails.some(d => d?.status === 'error');
	const selectedCards = selectedDetails.flatMap(d => (d?.status === 'ready' ? d.cards : []));
	const qualifying = countQualifying(selectedCards, modes);
	const deckSize = size === 'all' ? qualifying : Math.min(size, qualifying);

	let blocker: string | null = null;
	if (selectedIds.length === 0) blocker = 'Chọn ít nhất một bộ thẻ.';
	else if (modes.length === 0) blocker = 'Chọn ít nhất một cách hỏi.';
	else if (stillLoading) blocker = 'Đang tải thẻ…';
	else if (selectedCards.length === 0)
		blocker = failed ? 'Không tải được thẻ của các bộ đã chọn.' : 'Các bộ đã chọn chưa có thẻ nào.';
	else if (qualifying === 0)
		blocker = modes.every(m => m === 'note-to-word')
			? 'Không có thẻ nào có ghi chú. Hãy chọn thêm cách hỏi khác.'
			: 'Không có thẻ nào phù hợp với cách hỏi đã chọn.';

	const start = () => {
		if (blocker) return;
		onStart(selectedCards, {
			listIds: selectedIds,
			modes: modes,
			size: size,
			shuffle: shuffle,
			ignoreAccents: ignoreAccents,
		});
	};

	const toggleMode = (mode: PromptMode) =>
		setModes(prev => (prev.includes(mode) ? prev.filter(m => m !== mode) : ALL_MODES.filter(m => m === mode || prev.includes(m))));

	return (
		<div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
			<div className="space-y-6">
				{resumable && (
					<div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
						<RotateCcw className="hidden h-5 w-5 shrink-0 text-primary sm:block" aria-hidden />
						<p className="flex-1 text-sm font-medium text-slate-700">
							Bạn có một lượt ôn tập đang dở ({resumable.position}/{resumable.total} thẻ).
						</p>
						<Button onClick={onResume} variant="outline" className="rounded-xl border-primary/40 font-semibold text-primary">
							Tiếp tục lượt đang dở
						</Button>
					</div>
				)}

				<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="review-step-lists">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
						<h2 id="review-step-lists" className="text-lg font-bold text-slate-800">
							1. Chọn bộ thẻ
						</h2>
						{selectedIds.length > 0 && (
							<button
								type="button"
								onClick={() => setSelected({})}
								className="text-sm font-semibold text-slate-500 hover:text-slate-800"
							>
								Bỏ chọn tất cả
							</button>
						)}
					</div>
					<div className="relative mb-5">
						<Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
						<Input
							type="search"
							value={search}
							onChange={e => setSearch(e.target.value)}
							placeholder="Tìm bộ thẻ theo tên…"
							aria-label="Tìm bộ thẻ theo tên"
							className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10"
						/>
					</div>
					<div className="space-y-6">
						{preselectError && (
							<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
								Không mở được bộ thẻ đã chọn: {preselectError}
							</p>
						)}
						{hiddenSelected.length > 0 && (
							<ListGroup
								title="Đã chọn"
								lists={hiddenSelected}
								loading={false}
								empty=""
								selected={selected}
								onToggle={toggle}
								details={details}
								onRetryDetail={retryDetail}
								onReload={reload}
							/>
						)}
						<ListGroup
							title="Của tôi"
							lists={mineFiltered}
							loading={mine.status === 'loading'}
							error={mine.status === 'error' ? mine.message : undefined}
							empty={needle ? 'Không có bộ nào của bạn khớp tên này.' : 'Bạn chưa có bộ flashcard nào.'}
							selected={selected}
							onToggle={toggle}
							details={details}
							onRetryDetail={retryDetail}
							onReload={reload}
						/>
						<ListGroup
							title="Công khai"
							lists={others.data ?? []}
							loading={others.status === 'loading'}
							error={others.status === 'error' ? others.message : undefined}
							empty={query ? 'Không tìm thấy bộ công khai phù hợp.' : 'Chưa có bộ công khai nào của người khác.'}
							selected={selected}
							onToggle={toggle}
							details={details}
							onRetryDetail={retryDetail}
							onReload={reload}
						/>
					</div>
				</section>
			</div>

			<aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
				<fieldset className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
					<legend className="sr-only">Cách hỏi</legend>
					<h2 className="mb-1 text-lg font-bold text-slate-800" aria-hidden>
						2. Cách hỏi
					</h2>
					<p className="mb-4 text-sm text-slate-500">Chọn nhiều cách để trộn lẫn các kiểu câu hỏi.</p>
					<div className="space-y-2">
						{ALL_MODES.map(mode => (
							<label
								key={mode}
								htmlFor={`review-mode-${mode}`}
								className={cn(
									'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5',
									modes.includes(mode) ? 'border-primary/40 bg-primary/5' : 'border-slate-200 hover:bg-slate-50',
								)}
							>
								<Checkbox
									id={`review-mode-${mode}`}
									checked={modes.includes(mode)}
									onCheckedChange={() => toggleMode(mode)}
									className="mt-0.5"
								/>
								<span>
									<span className="block font-semibold text-slate-800">{MODE_LABELS[mode]}</span>
									<span className="block text-xs text-slate-500">{MODE_HINTS[mode]}</span>
								</span>
							</label>
						))}
					</div>
				</fieldset>

				<section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="review-step-options">
					<h2 id="review-step-options" className="text-lg font-bold text-slate-800">
						3. Số thẻ &amp; thứ tự
					</h2>
					<div role="radiogroup" aria-label="Số thẻ" className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
						{SIZES.map(opt => (
							<button
								key={opt.value}
								type="button"
								role="radio"
								aria-checked={size === opt.value}
								onClick={() => setSize(opt.value)}
								className={cn(
									'rounded-lg px-2 py-2 text-sm font-bold transition-colors motion-reduce:transition-none',
									size === opt.value ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800',
								)}
							>
								{opt.label}
							</button>
						))}
					</div>
					<div className="flex items-center justify-between gap-3">
						<Label htmlFor="review-shuffle" className="font-semibold text-slate-700">
							Xáo trộn thứ tự
						</Label>
						<Switch id="review-shuffle" checked={shuffle} onCheckedChange={setShuffle} />
					</div>
					<div className="flex items-center justify-between gap-3">
						<Label htmlFor="review-accents" className="font-semibold text-slate-700">
							Bỏ qua dấu khi so sánh
							<span className="block text-xs font-normal text-slate-500">“con meo” được tính khớp với “con mèo”</span>
						</Label>
						<Switch id="review-accents" checked={ignoreAccents} onCheckedChange={setIgnoreAccents} />
					</div>
				</section>

				<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
					<div className="mb-4 flex items-center gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<BookOpen className="h-5 w-5" aria-hidden />
						</div>
						<div aria-live="polite">
							<p className="text-2xl font-black leading-none text-slate-800">
								{stillLoading && selectedIds.length > 0 ? '…' : deckSize}
								<span className="ml-1 text-sm font-semibold text-slate-500">thẻ sẽ được hỏi</span>
							</p>
							{selectedIds.length > 0 && !stillLoading && (
								<p className="mt-1 text-xs text-slate-500">
									{qualifying}/{selectedCards.length} thẻ trong {selectedIds.length} bộ phù hợp với cách hỏi
								</p>
							)}
						</div>
					</div>
					{failed && (
						<p className="mb-3 text-xs font-medium text-rose-600">Một số bộ không tải được thẻ; chúng sẽ bị bỏ qua.</p>
					)}
					<Button onClick={start} disabled={!!blocker} className="h-12 w-full rounded-xl text-base font-bold">
						<Play className="h-4 w-4" aria-hidden /> Bắt đầu ôn tập
					</Button>
					{blocker && <p className="mt-2 text-center text-xs text-slate-500">{blocker}</p>}
				</div>
			</aside>
		</div>
	);
}
