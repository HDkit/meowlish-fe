'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	AlertCircle,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Clock,
	Flame,
	PlayCircle,
	RotateCw,
	Trophy,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../ui/utils';
import type { UserActivityDto } from '@/lib/api/models/UserActivityDto';
import { usePracticeActivityRange } from '@/lib/hooks/usePracticeStats';
import {
	type ActivityLevel,
	type HeatCell,
	addDays,
	buildHeatmap,
	buildRangeHeatmap,
	formatDayLabel,
	formatMinutes,
	formatShortDay,
	monthOf,
	monthRange,
	rangeError,
	summarizeRange,
} from '@/lib/practice-activity';

export const HEATMAP_RANGES = [
	{ label: '3 tháng', weeks: 13 },
	{ label: '6 tháng', weeks: 26 },
	{ label: '1 năm', weeks: 53 },
] as const;

const LEVEL_CLASS: Record<ActivityLevel, string> = {
	// neutral grey, not the green-tinted `muted`: a day without practice must read as empty
	// a faint grey with no outline so empty days recede; the first green step is already clearly visible
	0: 'bg-slate-100/70 dark:bg-slate-800/60',
	1: 'bg-primary/45',
	2: 'bg-primary/65',
	3: 'bg-primary/85',
	4: 'bg-primary',
};

const LEVEL_HINT: Record<ActivityLevel, string> = {
	0: 'Không luyện',
	1: '1 bài',
	2: '2 bài',
	3: '3–4 bài',
	4: 'Từ 5 bài',
};

const ROW_LABELS = ['T2', '', 'T4', '', 'T6', '', 'CN'];

/** Presets (the parent's last-year data), one calendar month, or any from-to range. */
type RangeMode = 'preset' | 'month' | 'custom';

const utcToday = (): string => new Date().toISOString().slice(0, 10);

/** "2026-11" moved by `n` months. */
function shiftMonth(month: string, n: number): string {
	const [y, m] = month.split('-').map(Number);
	const d = new Date(Date.UTC(y, m - 1 + n, 1));
	return d.toISOString().slice(0, 7);
}

const selectClass =
	'h-9 rounded-xl border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function MonthPicker({ month, max, onChange }: { month: string; max: string; onChange: (m: string) => void }) {
	const [year, m] = month.split('-');
	const maxYear = Number(max.slice(0, 4));
	const years = Array.from({ length: 6 }, (_, i) => maxYear - 5 + i);
	if (!years.includes(Number(year))) years.unshift(Number(year));
	const set = (y: string, mm: string) => {
		const next = `${y}-${mm}`;
		onChange(next > max ? max : next);
	};
	return (
		<div className="flex flex-wrap items-center gap-2" role="group" aria-label="Chọn tháng">
			<Button
				variant="outline"
				size="icon"
				className="h-9 w-9 rounded-xl"
				aria-label="Tháng trước"
				onClick={() => onChange(shiftMonth(month, -1))}
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>
			<select aria-label="Tháng" className={selectClass} value={m} onChange={e => set(year, e.target.value)}>
				{Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(mm => (
					<option key={mm} value={mm} disabled={`${year}-${mm}` > max}>
						Tháng {Number(mm)}
					</option>
				))}
			</select>
			<select aria-label="Năm" className={selectClass} value={year} onChange={e => set(e.target.value, m)}>
				{years.map(y => (
					<option key={y} value={String(y)}>
						{y}
					</option>
				))}
			</select>
			<Button
				variant="outline"
				size="icon"
				className="h-9 w-9 rounded-xl"
				aria-label="Tháng sau"
				disabled={month >= max}
				onClick={() => onChange(shiftMonth(month, 1))}
			>
				<ChevronRight className="h-4 w-4" />
			</Button>
		</div>
	);
}

function MiniStat({
	icon: Icon,
	iconClass,
	value,
	label,
}: {
	icon: React.ElementType;
	iconClass: string;
	value: string;
	label: string;
}) {
	return (
		<div className="min-w-0 rounded-xl border border-border/50 bg-muted/40 px-3 py-2.5">
			<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Icon className={cn('h-3.5 w-3.5 shrink-0', iconClass)} aria-hidden />
				<span className="truncate" title={label}>
					{label}
				</span>
			</p>
			<p className="mt-1 text-lg font-bold leading-tight tabular-nums">{value}</p>
		</div>
	);
}

/** Practice time short enough for a stat tile: "45 phút", "18,6 giờ". */
function formatHoursShort(minutes: number): string {
	if (minutes < 60) return `${minutes} phút`;
	return `${(minutes / 60).toFixed(1).replace(/\.0$/, '').replace('.', ',')} giờ`;
}

function describeDay(cell: HeatCell): string {
	if (cell.attempts === 0) return `${formatDayLabel(cell.date)} · chưa luyện tập`;
	const time = cell.minutes > 0 ? ` · ${formatMinutes(cell.minutes)}` : '';
	return `${formatDayLabel(cell.date)} · ${cell.attempts} bài${time}`;
}

export function ActivityHeatmapCard({
	activity,
	loading,
	error,
	onRetry,
	weeks,
	onWeeksChange,
	title = 'Hoạt động luyện tập',
	className,
}: {
	activity: UserActivityDto | null;
	loading: boolean;
	error: string | null;
	onRetry: () => void;
	weeks: number;
	onWeeksChange: (weeks: number) => void;
	title?: string;
	className?: string;
}) {
	const router = useRouter();
	const scrollRef = useRef<HTMLDivElement>(null);
	// four stat tiles in a row only when the card itself is wide enough (it sits in grids of
	// different widths, so the viewport says little)
	const bodyRef = useRef<HTMLDivElement>(null);
	const [wide, setWide] = useState(false);
	useEffect(() => {
		const el = bodyRef.current;
		if (!el || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= 520));
		observer.observe(el);
		return () => observer.disconnect();
	}, []);
	const [selected, setSelected] = useState<string | null>(null);

	const todayKey = activity?.today ?? activity?.to ?? utcToday();
	const [mode, setMode] = useState<RangeMode>('preset');
	const [month, setMonth] = useState(() => monthOf(utcToday()));
	const [customFrom, setCustomFrom] = useState(() => addDays(utcToday(), -29));
	const [customTo, setCustomTo] = useState(() => utcToday());
	const customError = mode === 'custom' ? rangeError(customFrom, customTo) : null;
	// while the typed range is invalid, keep showing the last valid one under the message
	const lastValidCustom = useRef({ from: customFrom, to: customTo });
	if (mode === 'custom' && !customError) lastValidCustom.current = { from: customFrom, to: customTo };
	const customRange = customError ? lastValidCustom.current : { from: customFrom, to: customTo };
	const requested = useMemo(() => {
		if (mode === 'month') return monthRange(month);
		if (mode === 'custom') return { from: customRange.from, to: customRange.to };
		return null;
	}, [mode, month, customRange.from, customRange.to]);
	// A month or a custom range has its own request; the presets use the parent's last-year data.
	const ranged = usePracticeActivityRange(requested);
	const shown = mode === 'preset' ? activity : ranged.data;
	const shownLoading = mode === 'preset' ? loading : ranged.loading || !ranged.data;
	const shownError = mode === 'preset' ? error : ranged.error;
	const retry = mode === 'preset' ? onRetry : ranged.reload;

	const heatmap = useMemo(() => {
		if (!shown) return null;
		const today = shown.today ?? shown.to;
		return mode === 'preset'
			? buildHeatmap(shown.days, today, weeks)
			: buildRangeHeatmap(shown.days, shown.from, shown.to, today);
	}, [shown, mode, weeks]);
	const summary = useMemo(() => {
		if (!shown || !heatmap) return null;
		const today = shown.today ?? shown.to;
		const from = mode === 'preset' ? heatmap.weeks[0][0].date : shown.from;
		return summarizeRange(shown.days, from, shown.to < today ? shown.to : today);
	}, [shown, heatmap, mode]);

	// newest weeks are on the right: show them first on narrow screens
	useEffect(() => {
		const el = scrollRef.current;
		if (el) el.scrollLeft = el.scrollWidth;
	}, [heatmap]);

	const cellsByDate = useMemo(() => {
		const map = new Map<string, HeatCell>();
		heatmap?.weeks.flat().forEach(c => map.set(c.date, c));
		return map;
	}, [heatmap]);
	// the day shown under the grid: the hovered one, else today, else the range's last day
	const lastShownDay = shown ? (shown.to < todayKey ? shown.to : todayKey) : null;
	const focused =
		(selected && cellsByDate.get(selected)) || (lastShownDay && cellsByDate.get(lastShownDay)) || null;

	const rangeLabel =
		mode === 'month'
			? `Th${Number(month.slice(5, 7))}/${month.slice(0, 4)}`
			: mode === 'custom' && shown
				? `${formatShortDay(shown.from)} – ${formatShortDay(shown.to)}`
				: (HEATMAP_RANGES.find(r => r.weeks === weeks)?.label ?? `${weeks} tuần`);
	const rangeCaption =
		mode === 'month'
			? `Tháng ${Number(month.slice(5, 7))}/${month.slice(0, 4)}`
			: mode === 'custom'
				? rangeLabel
				: `${rangeLabel} gần nhất`;

	// The week columns stretch to the card's width; cells stay square, between minCell and maxCell
	// pixels. Short ranges (a month) get big cells with the day of the month in them; a year can
	// still be wider than the card and scrolls.
	const columns = heatmap?.weeks.length ?? 0;
	const big = columns > 0 && columns <= 8;
	const minCell = big ? 28 : 10;
	const maxCell = big ? 44 : columns <= 16 ? 26 : 20;
	const gapPx = big ? 4 : 3;
	const labelColumn = 26;
	const gridStyle = {
		gridTemplateColumns: `${labelColumn}px repeat(${columns}, minmax(${minCell}px, 1fr))`,
		gap: gapPx,
		minWidth: labelColumn + columns * (minCell + gapPx),
		maxWidth: labelColumn + columns * (maxCell + gapPx),
	};

	const pickMode = (next: RangeMode) => {
		setSelected(null);
		setMode(next);
	};

	return (
		<Card className={cn('rounded-2xl', className)}>
			<CardContent className="pt-6 pb-6">
				<div ref={bodyRef} className="space-y-5">
				{/* the range buttons get their own row: five of them don't fit beside the title */}
				<div className="flex flex-col gap-3">
					<h2 className="text-lg font-bold flex items-center gap-2">
						<CalendarDays className="h-5 w-5 text-primary" />
						{title}
					</h2>
					{/* scrolls sideways on a phone instead of wrapping onto a second line */}
					<div
						role="radiogroup"
						aria-label="Khoảng thời gian"
						className="flex max-w-full self-start overflow-x-auto rounded-xl bg-muted p-1 text-sm"
					>
						{[
							...HEATMAP_RANGES.map(r => ({
								key: `w${r.weeks}`,
								label: r.label,
								checked: mode === 'preset' && r.weeks === weeks,
								pick: () => {
									pickMode('preset');
									onWeeksChange(r.weeks);
								},
							})),
							{ key: 'month', label: 'Tháng', checked: mode === 'month', pick: () => pickMode('month') },
							{ key: 'custom', label: 'Tùy chọn', checked: mode === 'custom', pick: () => pickMode('custom') },
						].map(o => (
							<button
								key={o.key}
								role="radio"
								aria-checked={o.checked}
								onClick={o.pick}
								className={cn(
									'shrink-0 whitespace-nowrap px-3 py-1 rounded-lg font-medium transition-colors',
									o.checked
										? 'bg-background text-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground',
								)}
							>
								{o.label}
							</button>
						))}
					</div>
				</div>

				{mode === 'month' && (
					<MonthPicker
						month={month}
						max={monthOf(todayKey)}
						onChange={m => {
							setSelected(null);
							setMonth(m);
						}}
					/>
				)}
				{mode === 'custom' && (
					<div className="space-y-1.5">
						<div className="flex flex-wrap items-center gap-2" role="group" aria-label="Khoảng ngày">
							<Input
								type="date"
								value={customFrom}
								max={customTo || todayKey}
								onChange={e => {
									setSelected(null);
									setCustomFrom(e.target.value);
								}}
								aria-label="Từ ngày"
								className="h-9 w-[9.5rem] rounded-xl"
							/>
							<span className="text-sm text-muted-foreground">–</span>
							<Input
								type="date"
								value={customTo}
								min={customFrom || undefined}
								max={todayKey}
								onChange={e => {
									setSelected(null);
									setCustomTo(e.target.value);
								}}
								aria-label="Đến ngày"
								className="h-9 w-[9.5rem] rounded-xl"
							/>
						</div>
						{customError && (
							<p className="text-xs text-destructive" role="alert">
								{customError}
							</p>
						)}
					</div>
				)}

				{shownError ? (
					<div className="flex flex-col items-center text-center gap-3 py-10">
						<AlertCircle className="h-8 w-8 text-destructive/70" />
						<p className="text-sm text-muted-foreground">{shownError}</p>
						<Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={retry}>
							<RotateCw className="h-4 w-4" />
							Thử lại
						</Button>
					</div>
				) : shownLoading || !shown || !heatmap || !summary ? (
					<div className="space-y-4" role="status" aria-busy="true">
						<span className="sr-only">Đang tải…</span>
						<div className={cn('grid gap-2', wide ? 'grid-cols-4' : 'grid-cols-2')}>
							{[0, 1, 2, 3].map(i => (
								<Skeleton key={i} className="h-[60px] rounded-xl" />
							))}
						</div>
						<Skeleton className="h-[150px] rounded-xl" />
					</div>
				) : (
					<>
						<div className="space-y-2">
							<p className="text-xs text-muted-foreground">
								{rangeCaption} · {summary.attempts} bài đã nộp
							</p>
							<div className={cn('grid gap-2', wide ? 'grid-cols-4' : 'grid-cols-2')}>
								<MiniStat
									icon={Flame}
									iconClass="text-secondary"
									value={`${shown.currentStreak} ngày`}
									label="Chuỗi hiện tại"
								/>
								<MiniStat
									icon={Trophy}
									iconClass="text-amber-500"
									value={`${shown.longestStreak} ngày`}
									label="Chuỗi dài nhất"
								/>
								<MiniStat
									icon={CalendarDays}
									iconClass="text-primary"
									value={`${summary.activeDays} ngày`}
									label="Ngày luyện"
								/>
								<MiniStat
									icon={Clock}
									iconClass="text-primary"
									value={summary.minutes > 0 ? formatHoursShort(summary.minutes) : `${summary.attempts} bài`}
									label={summary.minutes > 0 ? 'Thời gian' : 'Bài đã nộp'}
								/>
							</div>
						</div>

						{/* a newly picked month or range is loading: the grid still shows the previous one */}
						<div
							ref={scrollRef}
							aria-busy={mode !== 'preset' && ranged.refreshing}
							className={cn(
								'overflow-x-auto pb-1 -mx-1 px-1 transition-opacity',
								mode !== 'preset' && ranged.refreshing && 'opacity-50',
							)}
						>
							<div className={cn('grid', big && 'mx-auto')} style={gridStyle}>
								{heatmap.months.map(m => (
									<span
										key={m.column}
										style={{ gridColumn: m.column + 2, gridRow: 1 }}
										className="whitespace-nowrap text-[10px] leading-4 text-muted-foreground"
									>
										{m.label}
									</span>
								))}
								{/* every weekday when the cells are big enough to label */}
								{(big ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : ROW_LABELS).map((d, i) => (
									<span
										key={i}
										style={{ gridColumn: 1, gridRow: i + 2 }}
										className="flex items-center text-[10px] leading-none text-muted-foreground"
									>
										{d}
									</span>
								))}
								{heatmap.weeks.map((week, w) =>
									week.map((cell, d) => {
										const place = { gridColumn: w + 2, gridRow: d + 2 };
										return cell.isFuture || !cell.inRange ? (
											<div key={cell.date} style={place} className="aspect-square" aria-hidden />
										) : (
											<button
												key={cell.date}
												type="button"
												style={place}
												aria-label={describeDay(cell)}
												title={describeDay(cell)}
												onMouseEnter={() => setSelected(cell.date)}
												onFocus={() => setSelected(cell.date)}
												onClick={() => setSelected(cell.date)}
												className={cn(
													'aspect-square w-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
													big
														? 'rounded-lg text-[11px] font-medium leading-none'
														: 'rounded-[3px]',
													big && (cell.level >= 3 ? 'text-white' : 'text-foreground/70'),
													LEVEL_CLASS[cell.level],
													cell.isToday && 'ring-2 ring-secondary ring-offset-1 ring-offset-card',
													selected === cell.date && !cell.isToday && 'ring-2 ring-foreground/40',
												)}
											>
												{big ? Number(cell.date.slice(8, 10)) : null}
											</button>
										);
									}),
								)}
							</div>
						</div>

						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
							<p className="text-muted-foreground min-h-4" aria-live="polite">
								{focused ? (
									<>
										<span className="font-semibold text-foreground">
											{focused.isToday ? 'Hôm nay' : formatDayLabel(focused.date)}
										</span>
										{focused.attempts > 0
											? ` · ${focused.attempts} bài${focused.minutes > 0 ? ` · ${formatMinutes(focused.minutes)}` : ''}`
											: ' · chưa luyện tập'}
									</>
								) : null}
							</p>
							<div className="flex items-center gap-1.5 text-muted-foreground">
								<span>Ít</span>
								{([0, 1, 2, 3, 4] as ActivityLevel[]).map(l => (
									<span
										key={l}
										title={LEVEL_HINT[l]}
										className={cn('h-3 w-3 rounded-[3px]', LEVEL_CLASS[l])}
									/>
								))}
								<span>Nhiều</span>
							</div>
						</div>

						{summary.attempts === 0 && (
							<div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
								<p className="text-sm text-muted-foreground text-center sm:text-left">
									{mode === 'preset'
										? `Chưa có bài nào trong ${rangeLabel.toLowerCase()} qua. Nộp một bài hôm nay để bắt đầu chuỗi!`
										: `Chưa có bài nào trong ${mode === 'month' ? `tháng ${rangeLabel.slice(2)}` : 'khoảng thời gian này'}.`}
								</p>
								<Button size="sm" className="rounded-xl gap-1.5" onClick={() => router.push('/test-selection')}>
									<PlayCircle className="h-4 w-4" />
									Luyện tập ngay
								</Button>
							</div>
						)}

						<p className="text-[11px] text-muted-foreground">
							Mỗi ngày tính theo giờ UTC (bắt đầu lúc 7:00 sáng giờ Việt Nam), giống chuỗi đăng nhập.
						</p>
					</>
				)}
				</div>
			</CardContent>
		</Card>
	);
}
