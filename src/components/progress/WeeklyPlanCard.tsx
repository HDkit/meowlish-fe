'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarCheck, Check, Lightbulb, PlayCircle, RotateCw, X } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../ui/utils';
import type { UserActivityDto } from '@/lib/api/models/UserActivityDto';
import { currentWeek, formatMinutes } from '@/lib/practice-activity';

const TARGET_KEY = 'meowlish.weeklyPracticeTarget';
const TARGET_OPTIONS = [2, 3, 4, 5, 6, 7];
const DEFAULT_TARGET = 4;

/** The weekly target is a per-browser preference: read and write it defensively. */
function readTarget(): number {
	try {
		const v = Number(window.localStorage.getItem(TARGET_KEY));
		return TARGET_OPTIONS.includes(v) ? v : DEFAULT_TARGET;
	} catch {
		return DEFAULT_TARGET;
	}
}

function writeTarget(v: number) {
	try {
		window.localStorage.setItem(TARGET_KEY, String(v));
	} catch {
		// private mode or blocked storage: the choice just won't be remembered
	}
}

export type PracticeSuggestion = { title: string; detail: string; href: string };

export function WeeklyPlanCard({
	activity,
	loading,
	error,
	onRetry,
	suggestion,
	className,
}: {
	activity: UserActivityDto | null;
	loading: boolean;
	error: string | null;
	onRetry: () => void;
	suggestion?: PracticeSuggestion | null;
	className?: string;
}) {
	const router = useRouter();
	const [target, setTarget] = useState(DEFAULT_TARGET);
	useEffect(() => setTarget(readTarget()), []);

	const week = useMemo(() => (activity ? currentWeek(activity.days, activity.to) : null), [activity]);

	const done = week?.filter(d => d.state === 'done').length ?? 0;
	const left = week?.filter(d => d.state === 'today' || d.state === 'upcoming').length ?? 0;
	const todayDone = week?.some(d => d.date === activity?.to && d.state === 'done') ?? false;
	const needed = Math.max(target - done, 0);
	const weekMinutes = week?.reduce((s, d) => s + d.minutes, 0) ?? 0;

	let message: string;
	if (needed === 0) message = 'Bạn đã đạt mục tiêu tuần này. Giữ vững phong độ nhé!';
	else if (needed > left) message = `Tuần này khó kịp mục tiêu, nhưng mỗi ngày luyện tập vẫn giữ chuỗi của bạn.`;
	else if (todayDone) message = `Hôm nay xong rồi! Còn ${needed} ngày nữa để đạt mục tiêu.`;
	else message = `Còn ${needed} ngày luyện tập nữa trong ${left} ngày còn lại của tuần.`;

	return (
		<Card className={cn('rounded-2xl', className)}>
			<CardContent className="pt-6 pb-6 space-y-5">
				<div className="flex items-start justify-between gap-3">
					<div>
						<h2 className="text-lg font-bold flex items-center gap-2">
							<CalendarCheck className="h-5 w-5 text-primary" />
							Lịch luyện tập
						</h2>
						<p className="text-xs text-muted-foreground mt-1">Tuần này, từ thứ hai đến chủ nhật</p>
					</div>
					<label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
						Mục tiêu
						<select
							value={target}
							onChange={e => {
								const v = Number(e.target.value);
								setTarget(v);
								writeTarget(v);
							}}
							className="rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						>
							{TARGET_OPTIONS.map(o => (
								<option key={o} value={o}>
									{o} ngày/tuần
								</option>
							))}
						</select>
					</label>
				</div>

				{error ? (
					<div className="flex flex-col items-center text-center gap-3 py-8">
						<AlertCircle className="h-8 w-8 text-destructive/70" />
						<p className="text-sm text-muted-foreground">{error}</p>
						<Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={onRetry}>
							<RotateCw className="h-4 w-4" />
							Thử lại
						</Button>
					</div>
				) : loading || !week ? (
					<div className="space-y-4" role="status" aria-busy="true">
						<span className="sr-only">Đang tải…</span>
						<Skeleton className="h-10 rounded-xl" />
						<div className="grid grid-cols-7 gap-1.5 sm:gap-2">
							{Array.from({ length: 7 }, (_, i) => (
								<Skeleton key={i} className="h-[76px] rounded-xl" />
							))}
						</div>
					</div>
				) : (
					<>
						<div className="space-y-2">
							<div className="flex items-baseline justify-between gap-2">
								<p className="text-sm">
									<span className="text-2xl font-bold tabular-nums">{done}</span>
									<span className="text-muted-foreground">/{target} ngày</span>
								</p>
								{weekMinutes > 0 && (
									<span className="text-xs text-muted-foreground">{formatMinutes(weekMinutes)} tuần này</span>
								)}
							</div>
							<div
								className="h-2.5 rounded-full bg-muted overflow-hidden"
								role="progressbar"
								aria-valuemin={0}
								aria-valuemax={target}
								aria-valuenow={Math.min(done, target)}
							>
								<div
									className={cn('h-full rounded-full transition-all', needed === 0 ? 'bg-primary' : 'bg-primary/70')}
									style={{ width: `${Math.min(done / target, 1) * 100}%` }}
								/>
							</div>
							<p className="text-xs text-muted-foreground">{message}</p>
						</div>

						<ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
							{week.map(day => (
								<li
									key={day.date}
									title={
										day.state === 'done'
											? `${day.attempts} bài${day.minutes ? ` · ${formatMinutes(day.minutes)}` : ''}`
											: day.state === 'missed'
												? 'Không luyện tập'
												: day.state === 'today'
													? 'Hôm nay: chưa luyện tập'
													: 'Sắp tới'
									}
									className={cn(
										'flex flex-col items-center gap-1 rounded-xl py-2 px-0.5 text-center border',
										day.state === 'done' && 'bg-primary/10 border-primary/30',
										day.state === 'today' && 'border-secondary border-2 bg-secondary/10',
										day.state === 'missed' && 'bg-muted/50 border-transparent',
										day.state === 'upcoming' && 'border-dashed border-border',
										day.date === activity?.to && day.state === 'done' && 'ring-2 ring-secondary ring-offset-1 ring-offset-card',
									)}
								>
									<span
										className={cn(
											'text-[11px] font-semibold',
											day.date === activity?.to ? 'text-secondary' : 'text-muted-foreground',
										)}
									>
										{day.label}
									</span>
									<span className="text-sm font-bold tabular-nums">{day.dayOfMonth}</span>
									<span
										className={cn(
											'h-6 w-6 rounded-full flex items-center justify-center',
											day.state === 'done' && 'bg-primary text-primary-foreground',
											day.state === 'missed' && 'text-muted-foreground/60',
											day.state === 'today' && 'bg-secondary/20 text-secondary',
										)}
									>
										{day.state === 'done' ? (
											day.attempts > 1 ? (
												<span className="text-[11px] font-bold">{day.attempts}</span>
											) : (
												<Check className="h-3.5 w-3.5" />
											)
										) : day.state === 'missed' ? (
											<X className="h-3.5 w-3.5" />
										) : day.state === 'today' ? (
											<PlayCircle className="h-3.5 w-3.5" />
										) : null}
									</span>
									<span className="sr-only">
										{day.state === 'done'
											? `đã luyện ${day.attempts} bài`
											: day.state === 'missed'
												? 'bỏ lỡ'
												: day.state === 'today'
													? 'hôm nay, chưa luyện'
													: 'sắp tới'}
									</span>
								</li>
							))}
						</ol>

						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
							<span className="flex items-center gap-1">
								<span className="h-2.5 w-2.5 rounded-full bg-primary" /> Đã luyện
							</span>
							<span className="flex items-center gap-1">
								<span className="h-2.5 w-2.5 rounded-full border-2 border-secondary" /> Hôm nay
							</span>
							<span className="flex items-center gap-1">
								<span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" /> Bỏ lỡ
							</span>
							<span className="flex items-center gap-1">
								<span className="h-2.5 w-2.5 rounded-full border border-dashed border-muted-foreground/60" /> Sắp tới
							</span>
						</div>

						{(suggestion || !todayDone) && (
							<div className="rounded-2xl bg-secondary/10 border border-secondary/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
								<div className="flex items-start gap-3 flex-1 min-w-0">
									<div className="h-9 w-9 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center shrink-0">
										<Lightbulb className="h-[18px] w-[18px]" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold">
											{suggestion ? `Gợi ý hôm nay: ${suggestion.title}` : 'Hôm nay bạn chưa luyện tập'}
										</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											{suggestion ? suggestion.detail : 'Chỉ cần một đề ngắn để giữ chuỗi ngày luyện tập.'}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									className="rounded-xl gap-1.5 shrink-0"
									onClick={() => router.push(suggestion?.href ?? '/test-selection')}
								>
									<PlayCircle className="h-4 w-4" />
									Luyện ngay
								</Button>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
