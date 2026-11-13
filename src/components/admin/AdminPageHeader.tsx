import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/components/ui/utils';

/** Title row of every admin page: icon, title, one-line description, actions on the right. */
export function AdminPageHeader({
	icon: Icon,
	title,
	description,
	actions,
	children,
	className,
}: {
	icon?: LucideIcon;
	title: React.ReactNode;
	description?: React.ReactNode;
	/** Buttons; put the primary action last. They wrap under the title on small screens. */
	actions?: React.ReactNode;
	/** Rendered under the title row, e.g. an AdminStatGrid. */
	children?: React.ReactNode;
	className?: string;
}) {
	return (
		<header className={cn('space-y-5', className)}>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex min-w-0 items-start gap-3">
					{Icon && (
						<span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<Icon className="h-5 w-5" aria-hidden />
						</span>
					)}
					<div className="min-w-0">
						<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
						{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
					</div>
				</div>
				{actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
			</div>
			{children}
		</header>
	);
}
