'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from './utils';

/**
 * Form error pattern:
 * - `FieldError` sits right under its control. It animates its height open (no jump) and wraps any
 *   text, however long. Wire the control with `fieldA11y(id, error)`.
 * - `FormErrorSummary` sits above the submit button (or at the top of a dialog body) and lists
 *   form-level messages from `normalizeApiError(err).messages`.
 */

/** aria props for a control whose error is rendered by `<FieldError id={`${id}-error`} />`. */
export const fieldA11y = (id: string, error?: string | null) => ({
	id: id,
	'aria-invalid': error ? true : undefined,
	'aria-describedby': error ? `${id}-error` : undefined,
});

export function FieldError({
	id,
	message,
	className,
}: {
	/** The control's id; the message gets `${id}-error`. */
	id: string;
	message?: string | null;
	className?: string;
}) {
	// Keep the last message while collapsing so the text doesn't vanish before the height does.
	const [shown, setShown] = React.useState(message ?? '');
	React.useEffect(() => {
		if (message) setShown(message);
	}, [message]);

	const open = Boolean(message);
	return (
		<div
			className={cn(
				'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
				open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
				className,
			)}
			aria-hidden={!open}
		>
			<div className="min-h-0 overflow-hidden">
				<p
					id={`${id}-error`}
					aria-live="polite"
					className="flex min-w-0 items-start gap-1.5 pt-1.5 text-[13px] leading-snug text-destructive"
				>
					<AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
					<span className="min-w-0 [overflow-wrap:anywhere]">{open ? message : shown}</span>
				</p>
			</div>
		</div>
	);
}

const MAX_SHOWN = 5;

export function FormErrorSummary({
	messages,
	title,
	className,
}: {
	/** One message, several, or nothing (renders nothing). */
	messages?: string | readonly string[] | null;
	title?: string;
	className?: string;
}) {
	const list = (typeof messages === 'string' ? messages.split('\n') : (messages ?? []))
		.map((m) => m.trim())
		.filter(Boolean);
	if (list.length === 0) return null;
	const shown = list.slice(0, MAX_SHOWN);
	const hidden = list.length - shown.length;
	const heading = title ?? (list.length > 1 ? 'Vui lòng kiểm tra lại:' : undefined);

	return (
		<div
			role="alert"
			className={cn(
				'flex w-full min-w-0 items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive',
				'animate-in fade-in-0 slide-in-from-top-1 duration-200',
				className,
			)}
		>
			<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
			<div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
				{heading && <p className="font-semibold">{heading}</p>}
				{shown.length === 1 && !heading ? (
					<p className="leading-relaxed">{shown[0]}</p>
				) : (
					<ul className={cn('list-disc space-y-0.5 pl-4 leading-relaxed', heading && 'mt-1')}>
						{shown.map((m) => (
							<li key={m}>{m}</li>
						))}
						{hidden > 0 && <li className="list-none -ml-4 text-destructive/80">và {hidden} lỗi khác</li>}
					</ul>
				)}
			</div>
		</div>
	);
}
