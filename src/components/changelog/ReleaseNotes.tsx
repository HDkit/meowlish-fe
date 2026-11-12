import { CircleAlert, Sparkles, TrendingUp, Wrench } from 'lucide-react';
import { CHANGE_TYPE_LABELS, type ChangeType, type Release } from '@/lib/changelog';
import { cn } from '@/components/ui/utils';

const TYPE_STYLES: Record<ChangeType, { icon: typeof Sparkles; className: string }> = {
	notice: { icon: CircleAlert, className: 'bg-amber-100 text-amber-800' },
	new: { icon: Sparkles, className: 'bg-primary/15 text-primary' },
	improved: { icon: TrendingUp, className: 'bg-sky-100 text-sky-800' },
	fixed: { icon: Wrench, className: 'bg-slate-100 text-slate-700' },
};

const TYPE_ORDER: ChangeType[] = ['notice', 'new', 'improved', 'fixed'];

export function formatReleaseDate(date: string) {
	const [y, m, d] = date.split('-');
	return `${d}/${m}/${y}`;
}

export function ReleaseHeader({ release, isLatest }: { release: Release; isLatest?: boolean }) {
	return (
		<div className='flex flex-wrap items-center gap-2'>
			<span className='rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white'>v{release.version}</span>
			{isLatest && (
				<span className='rounded-full border border-primary/40 px-2 py-0.5 text-xs font-semibold text-primary'>
					Mới nhất
				</span>
			)}
			<time dateTime={release.date} className='text-xs text-muted-foreground'>
				{formatReleaseDate(release.date)}
			</time>
		</div>
	);
}

export function ReleaseChanges({ release }: { release: Release }) {
	const items = [...release.changes].sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));

	return (
		<ul className='space-y-2.5'>
			{items.map(item => {
				const { icon: Icon, className } = TYPE_STYLES[item.type];
				return (
					<li
						key={item.text}
						className={cn(
							'flex items-start gap-3 text-sm leading-relaxed',
							item.type === 'notice' && 'rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950',
						)}
					>
						<span
							className={cn(
								'mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
								className,
							)}
						>
							<Icon className='h-3 w-3' aria-hidden='true' />
							{CHANGE_TYPE_LABELS[item.type]}
						</span>
						<span>{item.text}</span>
					</li>
				);
			})}
		</ul>
	);
}
