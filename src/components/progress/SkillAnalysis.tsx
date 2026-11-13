'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	AlertCircle,
	ArrowDownRight,
	ArrowUpRight,
	BookOpen,
	ChevronDown,
	ChevronUp,
	Crosshair,
	Headphones,
	Mic,
	Minus,
	PenLine,
	RotateCw,
	Target,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../ui/utils';
import type { SkillStatsDto, UserSkillStatsDto } from '@/lib/api/models/UserSkillStatsDto';
import {
	SKILL_LABELS,
	type Level,
	type TagRow,
	focusTags,
	levelOf,
	skillTrend,
	sparklinePoints,
	tagRows,
} from '@/lib/skill-stats';

const SKILL_ICON: Record<string, React.ElementType> = {
	LISTENING: Headphones,
	READING: BookOpen,
	WRITING: PenLine,
	SPEAKING: Mic,
};

const TONE_TEXT: Record<Level['tone'], string> = {
	low: 'text-red-600 bg-red-50 border-red-200',
	mid: 'text-amber-700 bg-amber-50 border-amber-200',
	high: 'text-primary bg-primary/10 border-primary/30',
	top: 'text-primary-foreground bg-primary border-primary',
};

function accuracyText(pct: number) {
	if (pct >= 70) return 'text-primary';
	if (pct >= 40) return 'text-amber-600';
	return 'text-red-600';
}

function Sparkline({ values }: { values: number[] }) {
	const W = 160;
	const H = 44;
	const pts = sparklinePoints(values, W, H, 4);
	if (pts.length === 0) return null;
	const line = pts.map(p => `${p.x},${p.y}`).join(' ');
	const area = `${pts[0].x},${H} ${line} ${pts[pts.length - 1].x},${H}`;
	const last = pts[pts.length - 1];
	return (
		<div className="relative h-11" aria-hidden>
			<svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
				<line
					x1={0}
					x2={W}
					y1={H / 2}
					y2={H / 2}
					className="stroke-border"
					strokeDasharray="3 3"
					strokeWidth={1}
					vectorEffect="non-scaling-stroke"
				/>
				{pts.length > 1 && (
					<>
						<polygon points={area} className="fill-primary/10" />
						<polyline
							points={line}
							fill="none"
							className="stroke-primary"
							strokeWidth={2}
							strokeLinejoin="round"
							strokeLinecap="round"
							vectorEffect="non-scaling-stroke"
						/>
					</>
				)}
			</svg>
			<span
				className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card"
				style={{ left: `${(last.x / W) * 100}%`, top: `${(last.y / H) * 100}%` }}
			/>
		</div>
	);
}

function SkillCard({ stats }: { stats: SkillStatsDto }) {
	const router = useRouter();
	const Icon = SKILL_ICON[stats.skill] ?? Target;
	const label = SKILL_LABELS[stats.skill] ?? stats.skill;

	if (stats.attempts === 0 || stats.lastPercent === undefined) {
		const speaking = stats.skill === 'SPEAKING';
		return (
			<div className="rounded-2xl border border-dashed border-border p-4 flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
						<Icon className="h-5 w-5" />
					</div>
					<div>
						<p className="font-semibold">{label}</p>
						<p className="text-xs text-muted-foreground">Chưa có dữ liệu</p>
					</div>
				</div>
				<p className="text-xs text-muted-foreground flex-1">
					{speaking
						? 'Kết quả luyện nói với AI chưa được tính vào tiến độ.'
						: `Làm một đề có phần ${label.toLowerCase()} để bắt đầu theo dõi kỹ năng này.`}
				</p>
				<Button
					variant="outline"
					size="sm"
					className="rounded-xl self-start"
					onClick={() => router.push(speaking ? '/speaking' : '/test-selection')}
				>
					{speaking ? 'Luyện nói' : 'Chọn đề'}
				</Button>
			</div>
		);
	}

	const values = stats.recent.map(p => p.percent);
	const trend = skillTrend(stats.recent);
	const level = levelOf(stats.lastPercent);
	const lastBand = stats.recent[stats.recent.length - 1]?.band;
	const TrendIcon = trend?.direction === 'up' ? ArrowUpRight : trend?.direction === 'down' ? ArrowDownRight : Minus;

	return (
		<div className="rounded-2xl border border-border/70 bg-card p-4 flex flex-col gap-3 shadow-sm">
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-3 min-w-0">
					<div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<Icon className="h-5 w-5" />
					</div>
					<div className="min-w-0">
						<p className="font-semibold">{label}</p>
						<span className={cn('inline-block mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border', TONE_TEXT[level.tone])}>
							{level.label}
						</span>
					</div>
				</div>
				{trend && (
					<span
						title="So với các bài trước đó"
						className={cn(
							'inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5 shrink-0',
							trend.direction === 'up' && 'bg-primary/10 text-primary',
							trend.direction === 'down' && 'bg-red-50 text-red-600',
							trend.direction === 'flat' && 'bg-muted text-muted-foreground',
						)}
					>
						<TrendIcon className="h-3.5 w-3.5" />
						{trend.direction === 'flat' ? 'Ổn định' : `${trend.delta > 0 ? '+' : ''}${trend.delta}%`}
					</span>
				)}
			</div>

			<div className="flex items-baseline gap-2">
				{lastBand !== undefined ? (
					<>
						<span className="text-3xl font-extrabold tabular-nums">{lastBand.toFixed(1)}</span>
						<span className="text-sm text-muted-foreground">band gần nhất</span>
					</>
				) : (
					<>
						<span className="text-3xl font-extrabold tabular-nums">{Math.round(stats.lastPercent)}%</span>
						<span className="text-sm text-muted-foreground">bài gần nhất</span>
					</>
				)}
			</div>

			<Sparkline values={values} />

			<p className="text-xs text-muted-foreground">
				{stats.attempts} bài · TB {Math.round(stats.averagePercent ?? 0)}%
				{stats.averageBand !== undefined ? ` (band ${stats.averageBand.toFixed(1)})` : ''} · Cao nhất{' '}
				{Math.round(stats.bestPercent ?? 0)}%
			</p>
		</div>
	);
}

function TagBar({ row }: { row: TagRow }) {
	const pct = (n: number) => `${(n / row.total) * 100}%`;
	return (
		<li className="space-y-1.5">
			<div className="flex items-center justify-between gap-3 text-sm">
				<span className="font-medium truncate" title={row.name}>
					{row.name}
				</span>
				<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
					{row.correct}/{row.total} câu ·{' '}
					<span className={cn('font-bold text-sm', accuracyText(row.accuracy))}>{row.accuracy}%</span>
				</span>
			</div>
			<div
				className="flex h-2.5 rounded-full overflow-hidden bg-muted"
				role="img"
				aria-label={`${row.name}: ${row.correct} đúng, ${row.incorrect} sai, ${row.skipped} bỏ qua`}
			>
				<div className="bg-primary" style={{ width: pct(row.correct) }} />
				<div className="bg-red-400" style={{ width: pct(row.incorrect) }} />
				<div className="bg-muted-foreground/25" style={{ width: pct(row.skipped) }} />
			</div>
		</li>
	);
}

const VISIBLE_TAGS = 8;

export function SkillAnalysis({
	stats,
	loading,
	error,
	onRetry,
}: {
	stats: UserSkillStatsDto | null;
	loading: boolean;
	error: string | null;
	onRetry: () => void;
}) {
	const router = useRouter();
	const [showAll, setShowAll] = useState(false);
	const rows = useMemo(() => (stats ? tagRows(stats.tags) : []), [stats]);
	const focus = useMemo(() => focusTags(rows), [rows]);
	const visible = showAll ? rows : rows.slice(0, VISIBLE_TAGS);

	return (
		<Card className="rounded-2xl">
			<CardContent className="pt-6 pb-6 space-y-6">
				<div>
					<h2 className="text-lg font-bold flex items-center gap-2">
						<Target className="h-5 w-5 text-primary" />
						Phân tích kỹ năng
					</h2>
					{stats && stats.attemptsConsidered > 0 && (
						<p className="text-xs text-muted-foreground mt-1">
							Dựa trên {stats.attemptsConsidered} bài đã nộp gần nhất. Đường kẻ mờ là mốc 50%.
						</p>
					)}
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
				) : loading || !stats ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" role="status" aria-busy="true">
						<span className="sr-only">Đang tải…</span>
						{[0, 1, 2, 3].map(i => (
							<Skeleton key={i} className="h-[210px] rounded-2xl" />
						))}
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
							{stats.skills.map(s => (
								<SkillCard key={s.skill} stats={s} />
							))}
						</div>

						{focus.length > 0 && (
							<div className="rounded-2xl bg-secondary/10 border border-secondary/30 p-4 flex flex-col md:flex-row md:items-center gap-4">
								<div className="flex items-start gap-3 flex-1 min-w-0">
									<div className="h-10 w-10 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center shrink-0">
										<Crosshair className="h-5 w-5" />
									</div>
									<div className="min-w-0">
										<p className="font-semibold">Tập trung tiếp theo</p>
										<p className="text-sm text-muted-foreground mt-0.5">
											{focus.map((t, i) => (
												<span key={t.name}>
													{i > 0 && ', '}
													<span className="font-medium text-foreground">{t.name}</span> ({t.accuracy}%)
												</span>
											))}{' '}
											— các dạng câu hỏi bạn hay sai nhất.
										</p>
									</div>
								</div>
								<Button
									size="sm"
									className="rounded-xl shrink-0 self-start md:self-auto"
									onClick={() => router.push(`/test-selection?tag=${encodeURIComponent(focus[0].name)}`)}
								>
									Tìm đề “{focus[0].name}”
								</Button>
							</div>
						)}

						<div className="space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
								<h3 className="font-semibold">Độ chính xác theo dạng câu hỏi</h3>
								<div className="flex items-center gap-3 text-[11px] text-muted-foreground">
									<span className="flex items-center gap-1">
										<span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Đúng
									</span>
									<span className="flex items-center gap-1">
										<span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Sai
									</span>
									<span className="flex items-center gap-1">
										<span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/25" /> Bỏ qua
									</span>
								</div>
							</div>
							{rows.length === 0 ? (
								<p className="text-sm text-muted-foreground py-4 text-center">
									Các bài bạn làm chưa có câu hỏi được gắn dạng. Làm thêm đề để xem phân tích chi tiết.
								</p>
							) : (
								<>
									<ul className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
										{visible.map(r => (
											<TagBar key={r.name} row={r} />
										))}
									</ul>
									{rows.length > VISIBLE_TAGS && (
										<Button
											variant="ghost"
											size="sm"
											className="rounded-xl gap-1"
											onClick={() => setShowAll(v => !v)}
										>
											{showAll ? (
												<>
													Thu gọn <ChevronUp className="h-4 w-4" />
												</>
											) : (
												<>
													Xem tất cả {rows.length} dạng <ChevronDown className="h-4 w-4" />
												</>
											)}
										</Button>
									)}
								</>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
