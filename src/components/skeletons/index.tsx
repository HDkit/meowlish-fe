import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/components/ui/utils';

/**
 * Shared loading placeholders. Each one is shaped like the content it stands
 * in for, so the page keeps its layout when the data arrives instead of
 * jumping from a spinner to the real thing.
 *
 * `LoadingRegion` marks the area as busy for assistive tech and gives it a
 * screen-reader label; the visual blocks inside are aria-hidden.
 */
export function LoadingRegion({
	label = 'Đang tải…',
	className,
	children,
}: {
	label?: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div role='status' aria-busy='true' aria-live='polite' className={className}>
			<span className='sr-only'>{label}</span>
			{children}
		</div>
	);
}

/** Title + subtitle (+ optional action button) at the top of a page. */
export function PageHeaderSkeleton({
	action = false,
	className,
}: {
	action?: boolean;
	className?: string;
}) {
	return (
		<div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
			<div className='space-y-2'>
				<Skeleton className='h-8 w-56 max-w-full' />
				<Skeleton className='h-4 w-80 max-w-full' />
			</div>
			{action && <Skeleton className='h-10 w-36 rounded-xl' />}
		</div>
	);
}

/** A row of small stat tiles (icon + number + label). */
export function StatTilesSkeleton({
	count = 4,
	className,
	tileClassName,
}: {
	count?: number;
	className?: string;
	tileClassName?: string;
}) {
	return (
		<div className={cn('grid grid-cols-2 gap-4 md:grid-cols-4', className)}>
			{Array.from({ length: count }, (_, i) => (
				<div
					key={i}
					className={cn('flex items-center gap-3 rounded-2xl border bg-card p-4', tileClassName)}
				>
					<Skeleton className='size-10 shrink-0 rounded-xl' />
					<div className='flex-1 space-y-2'>
						<Skeleton className='h-6 w-12' />
						<Skeleton className='h-3 w-20' />
					</div>
				</div>
			))}
		</div>
	);
}

/** A grid of cards: optional cover image, title, two text lines, footer. */
export function CardGridSkeleton({
	count = 6,
	cover = false,
	className,
	cardClassName,
}: {
	count?: number;
	cover?: boolean;
	className?: string;
	cardClassName?: string;
}) {
	return (
		<div className={cn('grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3', className)}>
			{Array.from({ length: count }, (_, i) => (
				<div key={i} className={cn('overflow-hidden rounded-2xl border bg-card', cardClassName)}>
					{cover && <Skeleton className='aspect-video w-full rounded-none' />}
					<div className='space-y-3 p-5'>
						<Skeleton className='h-5 w-3/4' />
						<Skeleton className='h-3 w-full' />
						<Skeleton className='h-3 w-5/6' />
						<div className='flex items-center justify-between pt-2'>
							<Skeleton className='h-3 w-24' />
							<Skeleton className='h-8 w-20 rounded-lg' />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

/** Stacked list rows: leading icon/avatar, two text lines, trailing value. */
export function ListRowsSkeleton({
	rows = 5,
	avatar = true,
	trailing = true,
	className,
	rowClassName,
}: {
	rows?: number;
	avatar?: boolean;
	trailing?: boolean;
	className?: string;
	rowClassName?: string;
}) {
	return (
		<div className={cn('space-y-2', className)}>
			{Array.from({ length: rows }, (_, i) => (
				<div key={i} className={cn('flex items-center gap-3 rounded-xl border bg-card p-3.5', rowClassName)}>
					{avatar && <Skeleton className='size-10 shrink-0 rounded-lg' />}
					<div className='min-w-0 flex-1 space-y-2'>
						<Skeleton className={cn('h-4', i % 2 ? 'w-1/2' : 'w-2/3')} />
						<Skeleton className='h-3 w-24' />
					</div>
					{trailing && <Skeleton className='h-4 w-12 shrink-0' />}
				</div>
			))}
		</div>
	);
}

/** Paragraph-like lines of text. */
export function TextLinesSkeleton({ lines = 4, className }: { lines?: number; className?: string }) {
	const widths = ['w-full', 'w-11/12', 'w-5/6', 'w-2/3'];
	return (
		<div className={cn('space-y-2.5', className)}>
			{Array.from({ length: lines }, (_, i) => (
				<Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-1/2' : widths[i % widths.length])} />
			))}
		</div>
	);
}
