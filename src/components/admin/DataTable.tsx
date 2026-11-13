'use client';

import * as React from 'react';
import { AlertTriangle, Inbox, RefreshCw, type LucideIcon } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export type DataColumn<T> = {
	id: string;
	header: React.ReactNode;
	cell: (row: T) => React.ReactNode;
	/** Classes for both th and td (width, alignment, `hidden lg:table-cell`, …). */
	className?: string;
	/** Leave this column out of the mobile cards (e.g. it is already the card title). */
	hideOnCard?: boolean;
};

export type DataTableEmpty = {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
};

/**
 * Admin data table. From `md` up it is a table with a sticky header inside its own scroll area;
 * below `md` each row becomes a card (title = `cardTitle`, other columns as label/value pairs).
 * Handles the loading (skeleton), error (with retry) and empty states.
 */
export function DataTable<T>({
	columns,
	rows,
	rowKey,
	caption,
	loading = false,
	error,
	onRetry,
	empty,
	rowActions,
	onRowClick,
	cardTitle,
	skeletonRows = 6,
	className,
}: {
	columns: DataColumn<T>[];
	rows: readonly T[];
	rowKey: (row: T) => string;
	/** Screen-reader caption, e.g. "Danh sách đề thi". */
	caption: string;
	loading?: boolean;
	/** Messages of a failed load; replaces the rows. */
	error?: string | readonly string[] | null;
	onRetry?: () => void;
	empty: DataTableEmpty;
	/** Usually a <RowActions/> menu. */
	rowActions?: (row: T) => React.ReactNode;
	onRowClick?: (row: T) => void;
	/** Mobile card heading; defaults to the first column's cell. */
	cardTitle?: (row: T) => React.ReactNode;
	skeletonRows?: number;
	className?: string;
}) {
	const errorList = (typeof error === 'string' ? error.split('\n') : (error ?? [])).filter(Boolean);
	const showSkeleton = loading && rows.length === 0;
	const titleOf = cardTitle ?? ((row: T) => columns[0]?.cell(row));
	const cardColumns = cardTitle ? columns.filter((c) => !c.hideOnCard) : columns.slice(1).filter((c) => !c.hideOnCard);

	const frame = cn('overflow-hidden rounded-xl border bg-card shadow-sm', className);

	if (errorList.length > 0 && !loading) {
		return (
			<div className={frame}>
				<StatePanel
					icon={AlertTriangle}
					tone="danger"
					title="Không tải được dữ liệu"
					description={
						<span className="block space-y-0.5">
							{errorList.map((m) => (
								<span key={m} className="block">
									{m}
								</span>
							))}
						</span>
					}
					action={
						onRetry && (
							<Button variant="outline" size="sm" onClick={onRetry}>
								<RefreshCw className="mr-1.5 h-4 w-4" />
								Thử lại
							</Button>
						)
					}
				/>
			</div>
		);
	}

	if (!loading && rows.length === 0) {
		return (
			<div className={frame}>
				<StatePanel icon={empty.icon ?? Inbox} title={empty.title} description={empty.description} action={empty.action} />
			</div>
		);
	}

	const clickable = onRowClick
		? (row: T) => ({
				role: 'button' as const,
				tabIndex: 0,
				onClick: () => onRowClick(row),
				onKeyDown: (e: React.KeyboardEvent) => {
					if (e.target !== e.currentTarget) return;
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onRowClick(row);
					}
				},
			})
		: () => ({});

	return (
		<div className={frame} aria-busy={loading}>
			<span role="status" className="sr-only">
				{loading ? 'Đang tải…' : ''}
			</span>
			{/* Table (md and up) */}
			<div className="hidden max-h-[min(70vh,48rem)] overflow-auto md:block">
				<table className="w-full border-separate border-spacing-0 text-sm">
					<caption className="sr-only">{caption}</caption>
					<thead>
						<tr>
							{columns.map((c) => (
								<th
									key={c.id}
									scope="col"
									className={cn(
										'sticky top-0 z-10 whitespace-nowrap border-b bg-muted/95 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur',
										c.className,
									)}
								>
									{c.header}
								</th>
							))}
							{rowActions && (
								<th scope="col" className="sticky top-0 z-10 w-12 border-b bg-muted/95 px-2 py-2.5 backdrop-blur">
									<span className="sr-only">Thao tác</span>
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{showSkeleton
							? Array.from({ length: skeletonRows }, (_, i) => (
									<tr key={i}>
										{columns.map((c) => (
											<td key={c.id} className={cn('border-b px-4 py-3.5', c.className)}>
												<Skeleton className={cn('h-4', i % 2 ? 'w-2/3' : 'w-4/5')} />
											</td>
										))}
										{rowActions && <td className="border-b px-2 py-3.5" />}
									</tr>
								))
							: rows.map((row) => (
									<tr
										key={rowKey(row)}
										{...clickable(row)}
										className={cn(
											'group transition-colors hover:bg-muted/40',
											onRowClick && 'cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none',
											loading && 'opacity-60',
										)}
									>
										{columns.map((c) => (
											<td key={c.id} className={cn('border-b px-4 py-3 align-middle group-last:border-b-0', c.className)}>
												{c.cell(row)}
											</td>
										))}
										{rowActions && (
											<td className="border-b px-2 py-3 text-right align-middle group-last:border-b-0">{rowActions(row)}</td>
										)}
									</tr>
								))}
					</tbody>
				</table>
			</div>

			{/* Cards (below md) */}
			<ul className="divide-y md:hidden" aria-label={caption}>
				{showSkeleton
					? Array.from({ length: Math.min(skeletonRows, 4) }, (_, i) => (
							<li key={i} className="space-y-2 p-4">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
								<Skeleton className="h-3 w-2/3" />
							</li>
						))
					: rows.map((row) => (
							<li key={rowKey(row)} className={cn('p-4', loading && 'opacity-60')}>
								<div className="flex items-start gap-2">
									<div
										{...clickable(row)}
										className={cn(
											'min-w-0 flex-1 [overflow-wrap:anywhere]',
											onRowClick && 'cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
										)}
									>
										{titleOf(row)}
									</div>
									{rowActions && <div className="-mr-2 -mt-1 shrink-0">{rowActions(row)}</div>}
								</div>
								{cardColumns.length > 0 && (
									<dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
										{cardColumns.map((c) => (
											<React.Fragment key={c.id}>
												<dt className="text-xs leading-5 text-muted-foreground">{c.header}</dt>
												<dd className="min-w-0 [overflow-wrap:anywhere]">{c.cell(row)}</dd>
											</React.Fragment>
										))}
									</dl>
								)}
							</li>
						))}
			</ul>
		</div>
	);
}

export function StatePanel({
	icon: Icon,
	title,
	description,
	action,
	tone = 'neutral',
}: {
	icon: LucideIcon;
	title: string;
	description?: React.ReactNode;
	action?: React.ReactNode;
	tone?: 'neutral' | 'danger';
}) {
	return (
		<div className="flex flex-col items-center px-6 py-14 text-center" role={tone === 'danger' ? 'alert' : undefined}>
			<span
				className={cn(
					'flex h-12 w-12 items-center justify-center rounded-full',
					tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
				)}
			>
				<Icon className="h-6 w-6" aria-hidden />
			</span>
			<p className="mt-4 font-medium text-foreground">{title}</p>
			{description && (
				<div className="mt-1 max-w-md text-sm text-muted-foreground [overflow-wrap:anywhere]">{description}</div>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}
