'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageBounds } from '@/lib/admin';

type PageProps = {
	/** 1-based. */
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
	itemLabel?: string;
};

type CursorProps = {
	hasPrev: boolean;
	hasNext: boolean;
	onPrev: () => void;
	onNext: () => void;
	/** e.g. "Trang 2". */
	label?: string;
	disabled?: boolean;
};

/** Page-number pagination when the total is known, prev/next for cursor lists. */
export function AdminPagination(props: PageProps | CursorProps) {
	if ('hasNext' in props) {
		if (!props.hasPrev && !props.hasNext) return null;
		return (
			<nav className="flex items-center justify-between gap-3 text-sm" aria-label="Phân trang">
				<span className="text-muted-foreground">{props.label}</span>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={props.onPrev} disabled={!props.hasPrev || props.disabled}>
						<ChevronLeft className="h-4 w-4" />
						Trước
					</Button>
					<Button variant="outline" size="sm" onClick={props.onNext} disabled={!props.hasNext || props.disabled}>
						Sau
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</nav>
		);
	}

	const { page, pageSize, total, onPageChange, itemLabel = 'mục' } = props;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const { from, to } = pageBounds(page, pageSize, total);
	if (total === 0) return null;

	const pages = pageWindow(page, totalPages);
	return (
		<nav className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between" aria-label="Phân trang">
			<span className="text-muted-foreground">
				Hiển thị <span className="font-medium text-foreground tabular-nums">{from}–{to}</span> trên{' '}
				<span className="font-medium text-foreground tabular-nums">{total}</span> {itemLabel}
			</span>
			{totalPages > 1 && (
				<div className="flex items-center gap-1">
					<Button variant="outline" size="icon" className="h-8 w-8" aria-label="Trang trước" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					{pages.map((p, i) =>
						p === null ? (
							<span key={`gap-${i}`} className="w-6 text-center text-muted-foreground">
								…
							</span>
						) : (
							<Button
								key={p}
								variant={p === page ? 'default' : 'ghost'}
								size="sm"
								className="hidden h-8 min-w-8 px-2 tabular-nums sm:inline-flex"
								aria-current={p === page ? 'page' : undefined}
								onClick={() => onPageChange(p)}
							>
								{p}
							</Button>
						),
					)}
					<span className="px-2 tabular-nums text-muted-foreground sm:hidden">
						{page}/{totalPages}
					</span>
					<Button variant="outline" size="icon" className="h-8 w-8" aria-label="Trang sau" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}
		</nav>
	);
}

/** 1 … 4 5 6 … 12 (null = gap). */
const pageWindow = (page: number, totalPages: number): Array<number | null> => {
	const out: Array<number | null> = [];
	for (let p = 1; p <= totalPages; p++) {
		if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) out.push(p);
		else if (out[out.length - 1] !== null) out.push(null);
	}
	return out;
};
