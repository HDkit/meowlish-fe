import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tone } from '@/lib/admin';
import { TONE_CLASSES } from './StatusBadge';

export function AdminStatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
	return <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>{children}</div>;
}

/** A count tile. With `onClick` it acts as a filter toggle (`active` = the filter is applied). */
export function AdminStatCard({
	label,
	value,
	icon: Icon,
	tone = 'neutral',
	hint,
	loading,
	active,
	onClick,
}: {
	label: string;
	value: React.ReactNode;
	icon?: LucideIcon;
	tone?: Tone;
	hint?: string;
	loading?: boolean;
	active?: boolean;
	onClick?: () => void;
}) {
	const body = (
		<>
			<div className="flex items-center justify-between gap-2">
				<span className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
				{Icon && (
					<span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', TONE_CLASSES[tone].soft)}>
						<Icon className="h-3.5 w-3.5" aria-hidden />
					</span>
				)}
			</div>
			<div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
				{loading ? <Skeleton className="my-0.5 h-7 w-12" /> : value}
			</div>
			{hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
		</>
	);
	const base = 'rounded-xl border bg-card p-3 text-left shadow-sm transition-colors sm:p-4';
	if (!onClick) return <div className={base} aria-busy={loading || undefined}>{body}</div>;
	return (
		<button
			type="button"
			aria-pressed={active}
			aria-busy={loading || undefined}
			onClick={onClick}
			className={cn(
				base,
				'hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
				active && 'border-primary/60 bg-primary/[0.06] ring-1 ring-primary/30',
			)}
		>
			{body}
		</button>
	);
}
