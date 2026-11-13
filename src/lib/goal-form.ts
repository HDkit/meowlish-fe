/** Score scales for the goal dialogs (Add/Edit goal). */
export const GOAL_SCALES: Record<string, { min: number; max: number; step?: number }> = {
	IELTS: { min: 1, max: 9, step: 0.5 },
	TOEIC: { min: 10, max: 990 },
	TOEFL: { min: 1, max: 120 },
	VSTEP: { min: 1, max: 10, step: 0.5 },
};

export type GoalFormErrors = Partial<Record<'target' | 'date', string>>;

/** Field errors for a goal form; empty when it can be sent. `date` is the `<input type="date">` value. */
export const validateGoalForm = (form: { type: string; target: number; date: string }): GoalFormErrors => {
	const errors: GoalFormErrors = {};
	const scale = GOAL_SCALES[form.type];
	if (!Number.isFinite(form.target) || form.target <= 0) errors.target = 'Vui lòng nhập điểm mục tiêu lớn hơn 0';
	else if (scale && (form.target < scale.min || form.target > scale.max))
		errors.target = `Điểm ${form.type} phải từ ${scale.min} đến ${scale.max}`;
	else if (scale?.step && Math.abs(form.target / scale.step - Math.round(form.target / scale.step)) > 1e-9)
		errors.target = `Điểm ${form.type} phải là bội số của ${scale.step}`;

	if (!form.date || Number.isNaN(new Date(form.date).getTime())) errors.date = 'Vui lòng chọn ngày dự thi';
	return errors;
};
