'use client';

import { useMemo } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { FAMILY_LABELS, FAMILY_ORDER, nextBadge, type BadgeFamily, type BadgeView } from '@/lib/badges';
import { BadgeMedal, TIER_LABELS } from './BadgeMedal';
import { cn } from '../ui/utils';

/**
 * Target reached but not awarded yet: the achievement service checks badges when the matching event
 * happens, so the badge arrives with the next one of those.
 */
const DUE_HINT: Record<BadgeFamily, string> = {
	attempts: 'Nhận khi nộp bài tiếp theo',
	goodScore: 'Nhận ở lần đạt điểm tốt tiếp theo',
	perfectScore: 'Nhận ở lần đạt điểm tuyệt đối tiếp theo',
	loginDays: 'Nhận ở lần đăng nhập tiếp theo',
	loginStreak: 'Nhận ở lần đăng nhập tiếp theo',
};

const formatDate = (iso: string) =>
	new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

function BadgeTile({ badge }: { badge: BadgeView }) {
	const pct = Math.round((badge.current / badge.target) * 100);
	return (
		<li
			className={cn(
				'flex flex-col items-center rounded-2xl border p-4 text-center transition-shadow',
				badge.earned ? 'border-amber-200/70 bg-gradient-to-b from-amber-50/80 to-white hover:shadow-md' : 'border-slate-200 bg-white',
			)}
			aria-label={`${badge.title}: ${badge.earned ? 'đã đạt' : `${badge.current}/${badge.target}`}`}
		>
			<BadgeMedal family={badge.family} tier={badge.tier} earned={badge.earned} />
			<p className={cn('mt-3 font-bold leading-tight', badge.earned ? 'text-slate-900' : 'text-slate-500')}>{badge.title}</p>
			<p className="mt-1 text-xs leading-snug text-slate-500">{badge.description}</p>
			<span
				className={cn(
					'mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
					badge.earned ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500',
				)}
			>
				{TIER_LABELS[badge.tier]}
			</span>
			<div className="mt-auto w-full pt-3">
				{badge.earned ?
					badge.earnedAt && <p className="text-[11px] font-medium text-emerald-700">Đạt ngày {formatDate(badge.earnedAt)}</p>
				:	<>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={badge.target} aria-valuenow={badge.current}>
							<div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
						</div>
						<p className="mt-1 text-[11px] tabular-nums text-slate-500">
							{badge.current >= badge.target ? DUE_HINT[badge.family] : `${badge.current}/${badge.target}`}
						</p>
					</>
				}
			</div>
		</li>
	);
}

/** Every badge, grouped by family: earned medals in colour, locked ones with their progress. */
export function BadgeCollection({ badges }: { badges: BadgeView[] }) {
	const earnedCount = badges.filter((b) => b.earned).length;
	const next = useMemo(() => nextBadge(badges), [badges]);
	const recent = useMemo(
		() =>
			badges
				.filter((b) => b.earned && b.earnedAt)
				.sort((a, b) => (b.earnedAt ?? '').localeCompare(a.earnedAt ?? ''))
				.slice(0, 3),
		[badges],
	);

	return (
		<div className="space-y-8">
			<div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
				<div className="flex items-center gap-4 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-5">
					<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
						<Trophy className="h-7 w-7" aria-hidden />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-semibold text-slate-500">Bộ sưu tập</p>
						<p className="text-3xl font-black tabular-nums text-slate-900">
							{earnedCount}
							<span className="text-lg font-bold text-slate-400">/{badges.length}</span>
						</p>
						<div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-100">
							<div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-400" style={{ width: `${(earnedCount / Math.max(1, badges.length)) * 100}%` }} />
						</div>
					</div>
				</div>
				{next && (
					<div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
						<BadgeMedal family={next.family} tier={next.tier} earned={false} size="sm" />
						<div className="min-w-0 flex-1">
							<p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
								<Sparkles className="h-4 w-4" aria-hidden /> Sắp đạt được
							</p>
							<p className="truncate font-bold text-slate-900">{next.title}</p>
							<p className="text-sm text-slate-600">
								{next.description} · còn {next.target - next.current}
							</p>
						</div>
					</div>
				)}
			</div>

			{recent.length > 0 && (
				<section aria-labelledby="badges-recent">
					<h3 id="badges-recent" className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
						Mới đạt gần đây
					</h3>
					<div className="flex flex-wrap gap-4">
						{recent.map((b) => (
							<div key={b.name} className="flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-white px-4 py-3 shadow-sm">
								<BadgeMedal family={b.family} tier={b.tier} earned size="sm" />
								<div>
									<p className="font-bold text-slate-900">{b.title}</p>
									{b.earnedAt && <p className="text-xs text-slate-500">{formatDate(b.earnedAt)}</p>}
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			{FAMILY_ORDER.map((family) => {
				const items = badges.filter((b) => b.family === family);
				if (items.length === 0) return null;
				const got = items.filter((b) => b.earned).length;
				return (
					<section key={family} aria-labelledby={`badges-${family}`}>
						<div className="mb-3 flex items-baseline justify-between gap-2">
							<h3 id={`badges-${family}`} className="text-lg font-bold text-slate-800">
								{FAMILY_LABELS[family].title}
							</h3>
							<span className="text-sm font-semibold tabular-nums text-slate-500">
								{got}/{items.length}
							</span>
						</div>
						<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
							{items.map((b) => (
								<BadgeTile key={b.name} badge={b} />
							))}
						</ul>
					</section>
				);
			})}
		</div>
	);
}
