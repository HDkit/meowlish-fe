'use client';

import * as React from 'react';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type RowAction = {
	label: string;
	icon?: LucideIcon;
	onSelect: () => void;
	destructive?: boolean;
	disabled?: boolean;
	hidden?: boolean;
};

/**
 * The "…" menu of a table row. Destructive actions are listed last, after a separator.
 * Non-modal, so a dialog opened from an item doesn't leave the page inert when the menu closes.
 */
export function RowActions({ actions, label }: { actions: RowAction[]; label: string }) {
	const visible = actions.filter((a) => !a.hidden);
	if (visible.length === 0) return null;
	const normal = visible.filter((a) => !a.destructive);
	const destructive = visible.filter((a) => a.destructive);

	const item = (a: RowAction) => (
		<DropdownMenuItem
			key={a.label}
			disabled={a.disabled}
			variant={a.destructive ? 'destructive' : 'default'}
			onSelect={() => a.onSelect()}
		>
			{a.icon && <a.icon className="h-4 w-4" />}
			{a.label}
		</DropdownMenuItem>
	);

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-muted-foreground"
					aria-label={`Thao tác: ${label}`}
					onClick={(e) => e.stopPropagation()}
				>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-44" onClick={(e) => e.stopPropagation()}>
				{normal.map(item)}
				{normal.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
				{destructive.map(item)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
