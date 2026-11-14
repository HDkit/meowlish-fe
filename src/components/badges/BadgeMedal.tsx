'use client';

import { CalendarCheck, ClipboardCheck, Flame, Gem, Lock, Target, type LucideIcon } from 'lucide-react';
import type { BadgeFamily, BadgeTier } from '@/lib/badges';
import { cn } from '../ui/utils';

const FAMILY_ICONS: Record<BadgeFamily, LucideIcon> = {
	attempts: ClipboardCheck,
	goodScore: Target,
	perfectScore: Gem,
	loginDays: CalendarCheck,
	loginStreak: Flame,
};

/** Metal look per tier: outer ring, inner face, icon colour and a soft glow. */
const TIERS: Record<BadgeTier, { ring: string; face: string; icon: string; glow: string; ribbon: string }> = {
	bronze: {
		ring: 'from-amber-700 via-orange-400 to-amber-800',
		face: 'from-orange-100 via-amber-200 to-orange-300',
		icon: 'text-amber-800',
		glow: 'shadow-[0_8px_24px_-6px_rgba(180,83,9,0.45)]',
		ribbon: 'bg-amber-700',
	},
	silver: {
		ring: 'from-slate-500 via-slate-200 to-slate-500',
		face: 'from-white via-slate-100 to-slate-300',
		icon: 'text-slate-600',
		glow: 'shadow-[0_8px_24px_-6px_rgba(71,85,105,0.45)]',
		ribbon: 'bg-slate-500',
	},
	gold: {
		ring: 'from-yellow-600 via-yellow-300 to-amber-600',
		face: 'from-yellow-50 via-yellow-200 to-amber-300',
		icon: 'text-amber-700',
		glow: 'shadow-[0_8px_28px_-6px_rgba(202,138,4,0.55)]',
		ribbon: 'bg-amber-600',
	},
	diamond: {
		ring: 'from-sky-500 via-fuchsia-300 to-emerald-400',
		face: 'from-white via-sky-100 to-fuchsia-100',
		icon: 'text-sky-700',
		glow: 'shadow-[0_8px_32px_-6px_rgba(14,165,233,0.6)]',
		ribbon: 'bg-sky-600',
	},
};

export const TIER_LABELS: Record<BadgeTier, string> = {
	bronze: 'Đồng',
	silver: 'Bạc',
	gold: 'Vàng',
	diamond: 'Kim cương',
};

/** A rounded-hexagon medal: metal ring, embossed face with the family icon, a ribbon tail. */
export function BadgeMedal({
	family,
	tier,
	earned,
	size = 'md',
	className,
}: {
	family: BadgeFamily;
	tier: BadgeTier;
	earned: boolean;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}) {
	const Icon = FAMILY_ICONS[family];
	const t = TIERS[tier];
	const box = size === 'lg' ? 'h-28 w-28' : size === 'sm' ? 'h-14 w-14' : 'h-20 w-20';
	const iconSize = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
	// hexagon with slightly softened points
	const hex = { clipPath: 'polygon(50% 2%, 94% 26%, 94% 74%, 50% 98%, 6% 74%, 6% 26%)' };

	return (
		<div className={cn('relative shrink-0', box, className)} aria-hidden>
			{/* ribbon tails behind the medal */}
			<div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5">
				<span className={cn('h-1/3 w-[18%] rotate-12 rounded-b-sm', earned ? t.ribbon : 'bg-slate-300')} />
				<span className={cn('h-1/3 w-[18%] -rotate-12 rounded-b-sm', earned ? t.ribbon : 'bg-slate-300')} />
			</div>
			<div
				className={cn(
					'absolute inset-0 bg-gradient-to-br p-[7%]',
					earned ? cn(t.ring, t.glow) : 'from-slate-300 via-slate-200 to-slate-300',
				)}
				style={hex}
			>
				<div
					className={cn(
						'flex h-full w-full items-center justify-center bg-gradient-to-br',
						earned ? t.face : 'from-slate-100 to-slate-200',
					)}
					style={hex}
				>
					{earned ?
						<Icon className={cn(iconSize, t.icon, 'drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]')} strokeWidth={2.2} />
					:	<Lock className={cn(iconSize, 'text-slate-400')} strokeWidth={2} />}
				</div>
			</div>
			{/* sheen on earned medals */}
			{earned && (
				<div
					className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-70"
					style={hex}
				/>
			)}
		</div>
	);
}
