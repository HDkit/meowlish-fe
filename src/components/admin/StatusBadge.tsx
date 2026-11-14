import * as React from 'react';
import { cn } from '@/components/ui/utils';
import type { StatusMeta, Tone } from '@/lib/admin';

/** One colour per tone across the admin console (exam, report, account and role states). */
export const TONE_CLASSES: Record<Tone, { badge: string; dot: string; soft: string }> = {
	neutral: {
		badge: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
		dot: 'bg-slate-400',
		soft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
	},
	info: {
		badge: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900',
		dot: 'bg-sky-500',
		soft: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
	},
	warning: {
		badge: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
		dot: 'bg-amber-500',
		soft: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
	},
	success: {
		badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
		dot: 'bg-emerald-500',
		soft: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
	},
	danger: {
		badge: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900',
		dot: 'bg-rose-500',
		soft: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
	},
	accent: {
		badge: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900',
		dot: 'bg-violet-500',
		soft: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
	},
};

export function StatusBadge({
	tone = 'neutral',
	meta,
	children,
	dot = true,
	className,
}: {
	tone?: Tone;
	/** Shortcut for `tone` + label from the status maps in lib/admin. */
	meta?: StatusMeta;
	children?: React.ReactNode;
	dot?: boolean;
	className?: string;
}) {
	const t = meta?.tone ?? tone;
	return (
		<span
			className={cn(
				'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
				TONE_CLASSES[t].badge,
				className,
			)}
		>
			{dot && <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_CLASSES[t].dot)} />}
			<span className="truncate">{children ?? meta?.label}</span>
		</span>
	);
}
