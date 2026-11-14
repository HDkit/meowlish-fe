'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarDays, Clock, Flame, PlayCircle, RotateCw, Trophy } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../ui/utils';
import type { UserActivityDto } from '@/lib/api/models/UserActivityDto';
import {
	type ActivityLevel,
	type HeatCell,
	buildHeatmap,
	formatDayLabel,
	formatMinutes,
	summarizeRange,
} from '@/lib/practice-activity';

export const HEATMAP_RANGES = [
	{ label: '3 tháng', weeks: 13 },
	{ label: '6 tháng', weeks: 26 },
	{ label: '1 năm', weeks: 53 },
] as const;

const LEVEL_CLASS: Record<ActivityLevel, string> = {
	// neutral grey, not the green-tinted `muted`: a day without practice must read as empty
	// a light grey that recedes; the first green step is already clearly visible
	0: 'bg-slate-100 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700',
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
		<div className="flex h-full items-center gap-3 rounded-2xl bg-muted/40 border border-border/50 p-3">
			<div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', iconClass)}>
				<Icon className="h-[18px] w-[18px]" />
			</div>
			<div className="min-w-0">
				<p className="text-lg font-bold leading-tight tabular-nums break-words">{value}</p>
				{/* wraps instead of truncating: the tiles get narrow next to the weekly plan */}
				<p className="text-xs leading-snug text-muted-foreground break-words">{label}</p>
			</div>
		</div>
	);
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
	const [selected, setSelected] = useState<string | null>(null);

	const heatmap = useMemo(
		() => (activity ? buildHeatmap(activity.days, activity.to, weeks) : null),
		[activity, weeks],
	);
	const summary = useMemo(() => {
		if (!activity || !heatmap) return null;
		const from = heatmap.weeks[0][0].date;
		return summarizeRange(activity.days, from, activity.to);
	}, [activity, heatmap]);

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
	const focused = (selected && cellsByDate.get(selected)) || (activity && cellsByDate.get(activity.to)) || null;

	const rangeLabel = HEATMAP_RANGES.find(r => r.weeks === weeks)?.label ?? `${weeks} tuần`;

	return (
		<Card className={cn('rounded-2xl', className)}>
			<CardContent className="pt-6 pb-6 space-y-5">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<h2 className="text-lg font-bold flex items-center gap-2">
						<CalendarDays className="h-5 w-5 text-primary" />
						{title}
					</h2>
					<div
						role="radiogroup"
						aria-label="Khoảng thời gian"
						className="inline-flex self-start rounded-xl bg-muted p-1 text-sm"
					>
						{HEATMAP_RANGES.map(r => (
							<button
								key={r.weeks}
								role="radio"
								aria-checked={r.weeks === weeks}
								onClick={() => onWeeksChange(r.weeks)}
								className={cn(
									'px-3 py-1 rounded-lg font-medium transition-colors',
									r.weeks === weeks
										? 'bg-background text-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground',
								)}
							>
								{r.label}
							</button>
						))}
					</div>
				</div>

				{error ? (
					<div className="flex flex-col items-center text-center gap-3 py-10">
						<AlertCircle className="h-8 w-8 text-destructive/70" />
						<p className="text-sm text-muted-foreground">{error}</p>
						<Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={onRetry}>
							<RotateCw className="h-4 w-4" />
							Thử lại
						</Button>
					</div>
				) : loading || !activity || !heatmap || !summary ? (
					<div className="space-y-4" role="status" aria-busy="true">
						<span className="sr-only">Đang tải…</span>
						<div className="grid grid-cols-2 2xl:grid-cols-4 gap-3">
							{[0, 1, 2, 3].map(i => (
								<Skeleton key={i} className="h-[62px] rounded-2xl" />
							))}
						</div>
						<Skeleton className="h-[120px] rounded-xl" />
					</div>
				) : (
					<>
						<div className="grid grid-cols-2 2xl:grid-cols-4 gap-3">
							<MiniStat
								icon={Flame}
								iconClass="bg-secondary/15 text-secondary"
								value={`${activity.currentStreak} ngày`}
								label="Chuỗi hiện tại"
							/>
							<MiniStat
								icon={Trophy}
								iconClass="bg-amber-100 text-amber-600"
								value={`${activity.longestStreak} ngày`}
								label="Chuỗi dài nhất"
							/>
							<MiniStat
								icon={CalendarDays}
								iconClass="bg-primary/10 text-primary"
								value={`${summary.activeDays}`}
								label={`Ngày luyện tập (${rangeLabel})`}
							/>
							<MiniStat
								icon={Clock}
								iconClass="bg-primary/10 text-primary"
								value={summary.minutes > 0 ? formatMinutes(summary.minutes) : `${summary.attempts} bài`}
								label={summary.minutes > 0 ? `${summary.attempts} bài đã nộp` : 'Bài đã nộp'}
							/>
						</div>

						<div ref={scrollRef} className="overflow-x-auto pb-1 -mx-1 px-1">
							<div className="inline-flex flex-col gap-1 min-w-max">
								{/* month labels */}
								<div className="flex gap-[3px] pl-7 h-4 relative">
									{heatmap.weeks.map((_, w) => {
										const m = heatmap.months.find(x => x.column === w);
										return (
											<div key={w} className="w-3 sm:w-3.5 relative">
												{m && (
													<span className="absolute left-0 top-0 text-[10px] text-muted-foreground whitespace-nowrap">
														{m.label}
													</span>
												)}
											</div>
										);
									})}
								</div>
								<div className="flex gap-[3px]">
									<div className="flex flex-col gap-[3px] w-6 mr-1 shrink-0">
										{ROW_LABELS.map((d, i) => (
											<div
												key={i}
												className="h-3 sm:h-3.5 text-[10px] text-muted-foreground flex items-center leading-none"
											>
												{d}
											</div>
										))}
									</div>
									{heatmap.weeks.map((week, w) => (
										<div key={w} className="flex flex-col gap-[3px]">
											{week.map(cell =>
												cell.isFuture ? (
													<div key={cell.date} className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
												) : (
													<button
														key={cell.date}
														type="button"
														aria-label={describeDay(cell)}
														title={describeDay(cell)}
														onMouseEnter={() => setSelected(cell.date)}
														onFocus={() => setSelected(cell.date)}
														onClick={() => setSelected(cell.date)}
														className={cn(
															'h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-[3px] transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
															LEVEL_CLASS[cell.level],
															cell.isToday && 'ring-2 ring-secondary ring-offset-1 ring-offset-card',
															selected === cell.date && !cell.isToday && 'ring-2 ring-foreground/40',
														)}
													/>
												),
											)}
										</div>
									))}
								</div>
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
									Chưa có bài nào trong {rangeLabel.toLowerCase()} qua. Nộp một bài hôm nay để bắt đầu chuỗi!
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
			</CardContent>
		</Card>
	);
}
