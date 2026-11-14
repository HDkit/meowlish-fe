import { describe, expect, it } from 'vitest';
import { validateGoalForm } from './goal-form';

describe('validateGoalForm', () => {
	it('accepts a valid goal', () => {
		expect(validateGoalForm({ type: 'IELTS', target: 6.5, date: '2026-12-01' })).toEqual({});
		expect(validateGoalForm({ type: 'TOEIC', target: 750, date: '2026-12-01' })).toEqual({});
	});

	it('rejects an empty or out-of-range target', () => {
		expect(validateGoalForm({ type: 'IELTS', target: 0, date: '2026-12-01' }).target).toBeDefined();
		expect(validateGoalForm({ type: 'IELTS', target: Number.NaN, date: '2026-12-01' }).target).toBeDefined();
		expect(validateGoalForm({ type: 'IELTS', target: 10, date: '2026-12-01' }).target).toBe('Điểm IELTS phải từ 1 đến 9');
		expect(validateGoalForm({ type: 'TOEIC', target: 1000, date: '2026-12-01' }).target).toBe(
			'Điểm TOEIC phải từ 10 đến 990',
		);
	});

	it('enforces half-band steps', () => {
		expect(validateGoalForm({ type: 'IELTS', target: 6.3, date: '2026-12-01' }).target).toBe(
			'Điểm IELTS phải là bội số của 0.5',
		);
	});

	it('requires a date (an empty one would throw in toISOString)', () => {
		expect(validateGoalForm({ type: 'TOEFL', target: 90, date: '' }).date).toBe('Vui lòng chọn ngày dự thi');
	});
});
