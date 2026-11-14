'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FormErrorSummary } from '@/components/ui/form-feedback';
import { normalizeApiError } from '@/lib/api-errors';

/**
 * Confirmation for destructive or irreversible actions. Stays open while `onConfirm` runs and
 * shows its error inline when it throws; closes on success.
 */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = 'Xác nhận',
	cancelLabel = 'Hủy',
	destructive = false,
	onConfirm,
	children,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: React.ReactNode;
	description?: React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	onConfirm: () => Promise<void> | void;
	/** Extra content (e.g. a reason field) between the description and the buttons. */
	children?: React.ReactNode;
}) {
	const [pending, setPending] = React.useState(false);
	const [errors, setErrors] = React.useState<string[]>([]);

	React.useEffect(() => {
		if (open) setErrors([]);
	}, [open]);

	const confirm = async () => {
		setPending(true);
		setErrors([]);
		try {
			await onConfirm();
			onOpenChange(false);
		} catch (err) {
			setErrors(normalizeApiError(err).messages);
		} finally {
			setPending(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
			<AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="[overflow-wrap:anywhere]">{title}</AlertDialogTitle>
					{description && (
						<AlertDialogDescription className="[overflow-wrap:anywhere]">{description}</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				{children}
				<FormErrorSummary messages={errors} />
				<AlertDialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
						{cancelLabel}
					</Button>
					<Button variant={destructive ? 'destructive' : 'default'} onClick={() => void confirm()} disabled={pending}>
						{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{confirmLabel}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
