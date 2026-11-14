import { describe, expect, it } from 'vitest';
import {
	DEFAULT_ERROR,
	HTTP_STATUS_MESSAGES,
	NETWORK_ERROR,
	PASSWORD_POLICY_MESSAGE,
	extractApiErrorMessage,
	normalizeApiError,
	parseValidationMessage,
	passwordPolicyError,
	translateApiMessage,
} from './api-errors';

/** What the generated client throws for a gateway error response. */
const apiError = (status: number, error: unknown, message = 'Bad Request') =>
	Object.assign(new Error(message), { status: status, body: { statusCode: status, success: false, error: error } });

describe('parseValidationMessage', () => {
	it('splits a nested property path from the predicate', () => {
		expect(parseValidationMessage('filter.tags must be an array')).toEqual({
			path: 'filter.tags',
			predicate: 'phải là một danh sách',
		});
	});

	it('handles "each value in" and numeric constraints', () => {
		expect(parseValidationMessage('each value in tags must be a string')).toEqual({
			path: 'tags',
			predicate: 'mỗi phần tử phải là chuỗi ký tự',
		});
		expect(parseValidationMessage('limit must not be greater than 100')?.predicate).toBe('không được lớn hơn 100');
		expect(parseValidationMessage('name must be longer than or equal to 3 characters')?.predicate).toBe(
			'phải có ít nhất 3 ký tự',
		);
	});

	it('returns null for messages that are not class-validator ones', () => {
		expect(parseValidationMessage('Wrong password')).toBeNull();
		expect(parseValidationMessage('mail must be something we have no rule for')).toBeNull();
	});
});

describe('translateApiMessage', () => {
	it('labels known fields and translates the predicate', () => {
		expect(translateApiMessage('mail must be an email')).toBe('Email phải là địa chỉ email hợp lệ');
		expect(translateApiMessage('filter.tags must be an array')).toBe('Nhãn phải là một danh sách');
		expect(translateApiMessage('password is not strong enough')).toMatch(/^Mật khẩu chưa đủ mạnh/);
	});

	it('uses caller labels over the defaults', () => {
		expect(translateApiMessage('name should not be empty', { name: 'Tên bộ thẻ' })).toBe(
			'Tên bộ thẻ không được để trống',
		);
	});

	it('translates known service errors, including "X not found"', () => {
		expect(translateApiMessage('Wrong password')).toBe('Mật khẩu không đúng');
		expect(translateApiMessage('Exam not found.')).toBe('Không tìm thấy đề thi');
		expect(translateApiMessage('FlashCardList not found')).toBe('Không tìm thấy bộ thẻ');
		expect(translateApiMessage('Something odd not found')).toBe('Không tìm thấy dữ liệu');
		expect(translateApiMessage('Tag already exists')).toBe('Nhãn đã tồn tại');
		expect(translateApiMessage("The demo account can't change its password")).toBe(
			'Tài khoản demo không được phép thực hiện thao tác này',
		);
		expect(translateApiMessage('Access denied. Allowed role(s): admin')).toBe(HTTP_STATUS_MESSAGES[403]);
	});

	it('translates flash card copy and proposal errors', () => {
		expect(translateApiMessage('Original list not found')).toBe('Không tìm thấy bộ thẻ gốc');
		expect(translateApiMessage('Proposal not found')).toBe('Không tìm thấy đề xuất');
		expect(translateApiMessage('There are no changes to propose')).toBe(
			'Bộ của bạn chưa có thay đổi nào so với bản gốc',
		);
		expect(translateApiMessage('Only the list owner can accept this proposal')).toBe(
			'Chỉ chủ bộ thẻ mới được duyệt đề xuất này',
		);
	});

	it('keeps unknown messages as they are', () => {
		expect(translateApiMessage('Tên đã được sử dụng')).toBe('Tên đã được sử dụng');
	});
});

describe('normalizeApiError', () => {
	it('reads a string error', () => {
		expect(normalizeApiError(apiError(401, 'Wrong password'))).toEqual({
			status: 401,
			messages: ['Mật khẩu không đúng'],
			fieldErrors: {},
		});
	});

	it('lists every message of an array error, de-duplicated', () => {
		const res = normalizeApiError(
			apiError(400, ['filter.tags must be an array', 'limit must be an integer number', 'filter.tags must be an array']),
		);
		expect(res.messages).toEqual(['Nhãn phải là một danh sách', 'Số lượng mỗi trang phải là số nguyên']);
	});

	it('routes validation messages of mapped fields to fieldErrors', () => {
		const res = normalizeApiError(
			apiError(400, ['mail must be an email', 'password is not strong enough', 'avatar must be a string']),
			{ fields: { mail: 'email', password: 'password' } },
		);
		expect(res.fieldErrors).toEqual({
			email: 'Phải là địa chỉ email hợp lệ',
			password: expect.stringMatching(/^Chưa đủ mạnh/),
		});
		expect(res.messages).toEqual(['avatar phải là chuỗi ký tự']);
	});

	it('falls back to the status message, then to the fallback', () => {
		expect(normalizeApiError(apiError(403, undefined, 'Forbidden')).messages).toEqual([HTTP_STATUS_MESSAGES[403]]);
		expect(normalizeApiError(apiError(418, undefined, 'Generic Error: status: 418')).messages).toEqual([DEFAULT_ERROR]);
		expect(normalizeApiError(apiError(418, undefined, "I'm a teapot"), { fallback: 'Không lưu được' }).messages).toEqual([
			"I'm a teapot",
		]);
		expect(normalizeApiError(null, { fallback: 'Không lưu được' }).messages).toEqual(['Không lưu được']);
	});

	it('hides technical messages', () => {
		expect(normalizeApiError(apiError(500, 'PrismaClientKnownRequestError: at foo (x.ts:12)')).messages).toEqual([
			HTTP_STATUS_MESSAGES[500],
		]);
	});

	it('recognises network failures', () => {
		expect(normalizeApiError(new TypeError('Failed to fetch')).messages).toEqual([NETWORK_ERROR]);
	});

	it('uses an Error message thrown by our own code', () => {
		expect(normalizeApiError(new Error('API không trả về id đề thi.')).messages).toEqual(['API không trả về id đề thi.']);
	});

	it('accepts { message } bodies and nested arrays', () => {
		const err = { status: 400, body: { message: ['title should not be empty'] } };
		expect(normalizeApiError(err).messages).toEqual(['Tiêu đề không được để trống']);
	});
});

describe('extractApiErrorMessage', () => {
	it('joins several messages with new lines', () => {
		expect(extractApiErrorMessage(apiError(400, ['title should not be empty', 'duration must be a positive number']))).toBe(
			'Tiêu đề không được để trống\nThời lượng phải là số dương',
		);
	});

	it('keeps a long message intact (wrapping is the UI’s job)', () => {
		const long = 'x'.repeat(200);
		expect(extractApiErrorMessage(apiError(400, long))).toBe(long);
	});
});

describe('passwordPolicyError', () => {
	it('matches IsStrongPassword defaults', () => {
		expect(passwordPolicyError('Abcdef1!')).toBeNull();
		expect(passwordPolicyError('abcdef1!')).toBe(PASSWORD_POLICY_MESSAGE);
		expect(passwordPolicyError('Abcdefg!')).toBe(PASSWORD_POLICY_MESSAGE);
		expect(passwordPolicyError('Abcdef12')).toBe(PASSWORD_POLICY_MESSAGE);
		expect(passwordPolicyError('Ab1!')).toBe(PASSWORD_POLICY_MESSAGE);
	});
});
