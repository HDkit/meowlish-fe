import { CircleAlert, ShieldCheck, Sparkles, TrendingUp, Wrench } from 'lucide-react';
import { CHANGE_TYPE_LABELS, type ChangeItem, type ChangeType, type Release } from '@/lib/changelog';
import { cn } from '@/components/ui/utils';

const TYPE_STYLES: Record<ChangeType, { icon: typeof Sparkles; className: string }> = {
	notice: { icon: CircleAlert, className: 'bg-amber-100 text-amber-800' },
	new: { icon: Sparkles, className: 'bg-primary/15 text-primary' },
	improved: { icon: TrendingUp, className: 'bg-sky-100 text-sky-800' },
	fixed: { icon: Wrench, className: 'bg-slate-100 text-slate-700' },
};

const GROUP_ORDER: ChangeType[] = ['new', 'improved', 'fixed'];

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

function TypeHeading({ type, as: Tag = 'h3' }: { type: ChangeType; as?: 'h3' | 'h4' }) {
	const { icon: Icon, className } = TYPE_STYLES[type];
	return (
		<Tag className='flex items-center gap-2 text-sm font-semibold text-foreground'>
			<span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-md', className)}>
				<Icon className='h-3.5 w-3.5' aria-hidden='true' />
			</span>
			{CHANGE_TYPE_LABELS[type]}
		</Tag>
	);
}

function ChangeList({ items }: { items: ChangeItem[] }) {
	return (
		<ul className='mt-2 space-y-2 pl-8'>
			{items.map(item => (
				<li key={item.text} className='relative text-sm leading-relaxed text-foreground/90'>
					<span aria-hidden='true' className='absolute -left-4 top-[0.6em] h-1.5 w-1.5 rounded-full bg-border' />
					{item.text}
				</li>
			))}
		</ul>
	);
}

function GroupedChanges({ items, headingLevel }: { items: ChangeItem[]; headingLevel: 'h3' | 'h4' }) {
	return (
		<>
			{GROUP_ORDER.map(type => {
				const group = items.filter(item => item.type === type);
				if (group.length === 0) return null;
				return (
					<section key={type}>
						<TypeHeading type={type} as={headingLevel} />
						<ChangeList items={group} />
					</section>
				);
			})}
		</>
	);
}

/**
 * A release's changes grouped by kind (new, improved, fixed), notices first.
 * Changes for moderators/admins sit in their own box at the end; `hideStaff`
 * leaves them out (the pop-up dialog keeps to what every learner sees).
 */
export function ReleaseChanges({ release, hideStaff }: { release: Release; hideStaff?: boolean }) {
	const notices = release.changes.filter(item => item.type === 'notice');
	const rest = release.changes.filter(item => item.type !== 'notice');
	const learner = rest.filter(item => item.audience !== 'staff');
	const staff = hideStaff ? [] : rest.filter(item => item.audience === 'staff');

	return (
		<div className='space-y-5'>
			{notices.map(item => (
				<p
					key={item.text}
					className='flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950'
				>
					<CircleAlert className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' aria-hidden='true' />
					<span>
						<span className='font-semibold'>{CHANGE_TYPE_LABELS.notice}: </span>
						{item.text}
					</span>
				</p>
			))}
			<GroupedChanges items={learner} headingLevel='h3' />
			{staff.length > 0 && (
				<section className='rounded-xl border border-border/70 bg-muted/40 p-4'>
					<h3 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
						<ShieldCheck className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
						Dành cho quản trị viên & kiểm duyệt viên
					</h3>
					<div className='mt-3 space-y-4'>
						<GroupedChanges items={staff} headingLevel='h4' />
					</div>
				</section>
			)}
		</div>
	);
}
