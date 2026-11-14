'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Search and filters above a table. `summary` (e.g. a result count) sits at the end. */
export function AdminToolbar({
	children,
	summary,
	className,
}: {
	children: React.ReactNode;
	summary?: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center', className)}>
			{children}
			{summary && <div className="text-sm text-muted-foreground sm:ml-auto">{summary}</div>}
		</div>
	);
}

export function AdminSearchInput({
	value,
	onChange,
	placeholder = 'Tìm kiếm…',
	label,
	className,
	onSubmit,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	/** Accessible name; defaults to the placeholder. */
	label?: string;
	className?: string;
	/** Called on Enter. */
	onSubmit?: () => void;
}) {
	return (
		<div className={cn('relative w-full sm:w-72', className)}>
			<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
			<Input
				type="search"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') onSubmit?.();
					if (e.key === 'Escape' && value) onChange('');
				}}
				placeholder={placeholder}
				aria-label={label ?? placeholder}
				className="h-9 bg-card pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
			/>
			{value && (
				<button
					type="button"
					onClick={() => onChange('')}
					aria-label="Xóa tìm kiếm"
					className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
				>
					<X className="h-3.5 w-3.5" />
				</button>
			)}
		</div>
	);
}

export type FilterOption = { value: string; label: string };

/** A compact select. Radix forbids an empty item value, so "all" is a real value ('all' by default). */
export function AdminFilterSelect({
	value,
	onChange,
	options,
	label,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	options: readonly FilterOption[];
	label: string;
	className?: string;
}) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger aria-label={label} className={cn('h-9 w-full bg-card sm:w-auto sm:min-w-40', className)}>
				<SelectValue placeholder={label} />
			</SelectTrigger>
			<SelectContent>
				{options.map((o) => (
					<SelectItem key={o.value} value={o.value}>
						{o.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
