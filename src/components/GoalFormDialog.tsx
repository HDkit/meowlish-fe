'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { normalizeApiError } from '@/lib/api-errors';
import { type GoalFormErrors, GOAL_SCALES, validateGoalForm } from '@/lib/goal-form';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { FieldError, FormErrorSummary, fieldA11y } from './ui/form-feedback';
import { Input } from './ui/input';
import { Label } from './ui/label';

export const GOAL_TYPES = ['IELTS', 'TOEIC', 'VSTEP', 'TOEFL'] as const;
export type GoalType = (typeof GOAL_TYPES)[number];
export type GoalFormValues = { type: GoalType; target: number; date: string };

const today = () => new Date().toISOString().slice(0, 10);

/** The add/edit goal dialog: validates locally, shows server errors inline and stays open on failure. */
export function GoalFormDialog({
	open,
	onOpenChange,
	title,
	submitLabel,
	initial,
	onSubmit,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	submitLabel: string;
	initial?: Partial<GoalFormValues>;
	/** Throws on failure; the dialog shows the error and stays open. */
	onSubmit: (values: GoalFormValues) => Promise<void>;
}) {
	const [type, setType] = useState<GoalType>('IELTS');
	const [target, setTarget] = useState('');
	const [date, setDate] = useState(today());
	const [errors, setErrors] = useState<GoalFormErrors>({});
	const [formErrors, setFormErrors] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		setType(initial?.type ?? 'IELTS');
		setTarget(initial?.target ? String(initial.target) : '');
		setDate(initial?.date || today());
		setErrors({});
		setFormErrors([]);
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	const scale = GOAL_SCALES[type];

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		const values = { type: type, target: target.trim() ? Number(target) : Number.NaN, date: date };
		const local = validateGoalForm(values);
		setErrors(local);
		setFormErrors([]);
		if (Object.keys(local).length > 0) return;
		setLoading(true);
		try {
			await onSubmit(values);
			onOpenChange(false);
		} catch (err) {
			const { messages, fieldErrors } = normalizeApiError(err, {
				fallback: 'Không thể lưu mục tiêu',
				fields: { target: 'target', date: 'date' },
			});
			setErrors(fieldErrors);
			setFormErrors(messages);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
			<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
				<form onSubmit={submit} noValidate className="grid gap-4">
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>Chọn kỳ thi, điểm bạn muốn đạt và ngày dự thi.</DialogDescription>
					</DialogHeader>

					<div className="grid gap-2">
						<Label htmlFor="goal-type">Loại bài kiểm tra</Label>
						<select
							id="goal-type"
							value={type}
							onChange={(e) => setType(e.target.value as GoalType)}
							className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						>
							{GOAL_TYPES.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="goal-target">Điểm mục tiêu</Label>
						<Input
							{...fieldA11y('goal-target', errors.target)}
							type="number"
							inputMode="decimal"
							min={scale?.min}
							max={scale?.max}
							step={scale?.step ?? 1}
							value={target}
							onChange={(e) => {
								setTarget(e.target.value);
								if (errors.target) setErrors(({ target: _, ...rest }) => rest);
							}}
							placeholder={scale ? `Từ ${scale.min} đến ${scale.max}` : 'Nhập điểm mục tiêu'}
						/>
						<FieldError id="goal-target" message={errors.target} className="-mt-2" />
					</div>

					<div className="grid gap-2">
						<Label htmlFor="goal-date">Ngày dự thi</Label>
						<Input
							{...fieldA11y('goal-date', errors.date)}
							type="date"
							value={date}
							onChange={(e) => {
								setDate(e.target.value);
								if (errors.date) setErrors(({ date: _, ...rest }) => rest);
							}}
						/>
						<FieldError id="goal-date" message={errors.date} className="-mt-2" />
					</div>

					<FormErrorSummary messages={formErrors} />

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
							Hủy
						</Button>
						<Button type="submit" disabled={loading}>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{submitLabel}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
