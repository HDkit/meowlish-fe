/**
 * Turns whatever an API call threw into messages a form can show.
 *
 * The gateway answers errors as `{ statusCode, success: false, error }`, where `error` is a string
 * ("Wrong password") or, for a failed DTO validation, an array of class-validator messages
 * (["mail must be an email", "filter.tags must be an array"]). The generated client throws an
 * `ApiError` carrying that body in `.body`; fetch failures throw a plain `TypeError`.
 */

export type NormalizedApiError = {
	/** HTTP status, when the error came from a response. */
	status?: number;
	/** Form-level messages (translated, de-duplicated). Excludes messages routed to `fieldErrors`. */
	messages: string[];
	/** Messages for known form fields, keyed by the form's field name. */
	fieldErrors: Record<string, string>;
};

export type NormalizeApiErrorOptions = {
	/** Shown when nothing usable can be extracted. */
	fallback?: string;
	/**
	 * Backend property path -> form field name, e.g. `{ mail: 'email', username: 'fullName' }`.
	 * Validation messages for these paths go to `fieldErrors` instead of `messages`.
	 */
	fields?: Record<string, string>;
	/** Backend property path -> label used in form-level messages ("Email phải là ..."). */
	labels?: Record<string, string>;
};

export const DEFAULT_ERROR = 'Đã xảy ra lỗi. Vui lòng thử lại sau';
export const NETWORK_ERROR = 'Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng rồi thử lại';
export const SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
export const PASSWORD_POLICY_MESSAGE =
	'Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt';

export const HTTP_STATUS_MESSAGES: Record<number, string> = {
	400: 'Dữ liệu không hợp lệ',
	401: SESSION_EXPIRED_MESSAGE,
	403: 'Bạn không có quyền thực hiện thao tác này',
	404: 'Không tìm thấy dữ liệu',
	409: 'Dữ liệu bị trùng lặp hoặc xung đột',
	413: 'Dữ liệu gửi lên quá lớn',
	429: 'Quá nhiều yêu cầu. Vui lòng thử lại sau',
	500: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau',
	502: 'Máy chủ không phản hồi. Vui lòng thử lại sau',
	503: 'Dịch vụ tạm thời không khả dụng',
	504: 'Máy chủ phản hồi quá lâu. Vui lòng thử lại sau',
};

const TECHNICAL_PATTERNS = [
	/prisma/i,
	/\bsql\b/i,
	/database/i,
	/ECONNREFUSED/i,
	/ETIMEDOUT/i,
	/ENOTFOUND/i,
	/at\s+\S+\s*\(/,
	/\.ts:\d+/,
	/\.js:\d+/,
	/Internal server error/i,
	/Cannot\s+(GET|POST|PUT|DELETE|PATCH)\s+\//,
	/^Generic Error/i,
	/^\d+ [A-Z_]+:/, // gRPC status dumps ("13 INTERNAL: ...")
	/Unable to parse HttpException/i,
];

export const isTechnicalMessage = (msg: string): boolean => TECHNICAL_PATTERNS.some((p) => p.test(msg));

/** The generated client's own messages: just the HTTP status text, nothing for a user. */
const GENERIC_STATUS_TEXTS = new Set([
	'bad request',
	'unauthorized',
	'forbidden',
	'not found',
	'conflict',
	'internal server error',
	'bad gateway',
	'service unavailable',
	'request aborted',
]);

const NETWORK_PATTERNS = [/failed to fetch/i, /networkerror/i, /load failed/i, /network request failed/i];

const FIELD_LABELS: Record<string, string> = {
	mail: 'Email',
	email: 'Email',
	password: 'Mật khẩu',
	currentPassword: 'Mật khẩu hiện tại',
	username: 'Tên đăng nhập',
	fullName: 'Họ tên',
	phoneNumber: 'Số điện thoại',
	bio: 'Giới thiệu',
	title: 'Tiêu đề',
	name: 'Tên',
	description: 'Mô tả',
	content: 'Nội dung',
	duration: 'Thời lượng',
	tags: 'Nhãn',
	word: 'Từ',
	definition: 'Định nghĩa',
	notes: 'Ghi chú',
	target: 'Điểm mục tiêu',
	date: 'Ngày',
	type: 'Loại',
	status: 'Trạng thái',
	limit: 'Số lượng mỗi trang',
	page: 'Số trang',
	cursor: 'Con trỏ phân trang',
	roleId: 'Vai trò',
	isPublic: 'Chế độ công khai',
	adminResponse: 'Phản hồi',
};

/** Rules for the part of a class-validator message after the property path. */
const PREDICATES: Array<[RegExp, string | ((...m: string[]) => string)]> = [
	[/^must be an email$/, 'phải là địa chỉ email hợp lệ'],
	[/^should not be empty$/, 'không được để trống'],
	[/^must be a string$/, 'phải là chuỗi ký tự'],
	[/^must be an array$/, 'phải là một danh sách'],
	[/^must be an integer number$/, 'phải là số nguyên'],
	[/^must be a number conforming to the specified constraints$/, 'phải là số'],
	[/^must be a positive number$/, 'phải là số dương'],
	[/^must be a negative number$/, 'phải là số âm'],
	[/^must not be less than (\S+)$/, (_, n) => `phải lớn hơn hoặc bằng ${n}`],
	[/^must not be greater than (\S+)$/, (_, n) => `không được lớn hơn ${n}`],
	[/^must be longer than or equal to (\d+) characters?$/, (_, n) => `phải có ít nhất ${n} ký tự`],
	[/^must be shorter than or equal to (\d+) characters?$/, (_, n) => `không được dài quá ${n} ký tự`],
	[/^is not strong enough$/, 'chưa đủ mạnh: cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt'],
	[/^must be a boolean value$/, 'phải là đúng hoặc sai'],
	[/^must be one of the following values: (.+)$/, (_, v) => `phải là một trong các giá trị: ${v}`],
	[/^must be a valid enum value$/, 'có giá trị không hợp lệ'],
	[/^must be a Date instance$/, 'phải là ngày hợp lệ'],
	[/^must be a valid ISO 8601 date string$/, 'phải là ngày hợp lệ'],
	[/^must be a URL address$/, 'phải là đường dẫn URL hợp lệ'],
	[/^must be a UUID$/, 'phải là mã UUID hợp lệ'],
	[/^must be a phone number$/, 'phải là số điện thoại hợp lệ'],
	[/^must be either object or array$/, 'không đúng định dạng'],
	[/^must contain at least (\d+) elements?$/, (_, n) => `phải có ít nhất ${n} phần tử`],
	[/^must contain no more than (\d+) elements?$/, (_, n) => `chỉ được có tối đa ${n} phần tử`],
	[/^must be a json string$/i, 'phải là chuỗi JSON hợp lệ'],
	[/^should not exist$/, 'không được hỗ trợ'],
];

const ENTITY_NAMES: Record<string, string> = {
	exam: 'đề thi',
	blog: 'bài viết',
	report: 'báo cáo',
	flashcardlist: 'bộ thẻ',
	flashcard: 'thẻ ghi nhớ',
	'original list': 'bộ thẻ gốc',
	proposal: 'đề xuất',
	tag: 'nhãn',
	'parent tag': 'nhãn cha',
	'destination tag': 'nhãn đích',
	goal: 'mục tiêu',
	section: 'phần thi',
	'parent section': 'phần thi cha',
	'destination section': 'phần thi đích',
	question: 'câu hỏi',
	answer: 'câu trả lời',
	choice: 'lựa chọn',
	file: 'tệp',
	room: 'phòng',
	notification: 'thông báo',
	credential: 'phương thức đăng nhập',
	attempt: 'bài làm',
	identity: 'tài khoản',
	identitynotfound: 'tài khoản',
	user: 'người dùng',
	role: 'vai trò',
};

const entityName = (raw: string): string | undefined => {
	const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
	return ENTITY_NAMES[key] ?? ENTITY_NAMES[key.replace(/[\s_-]+/g, '')];
};

/** Whole-message translations for errors the services throw (see the backend's exceptions). */
const MESSAGES: Array<[RegExp, string | ((...m: string[]) => string)]> = [
	[/^wrong password$/i, 'Mật khẩu không đúng'],
	[/^account locked$/i, 'Tài khoản đã bị khóa'],
	[/^identity ?not ?found$/i, 'Không tìm thấy tài khoản'],
	[/^(expired session|invalid token|token has been revoked|invalid or expired login token)$/i, SESSION_EXPIRED_MESSAGE],
	[/^a record with this value already exists$/i, 'Dữ liệu này đã tồn tại'],
	[/^role already exists$/i, 'Người dùng đã có vai trò này'],
	[/^role does not exist$/i, 'Người dùng không có vai trò này'],
	[/^identity is already locked$/i, 'Tài khoản đã bị khóa từ trước'],
	[/^identity is not locked$/i, 'Tài khoản hiện không bị khóa'],
	[/^you cannot lock your own account$/i, 'Bạn không thể khóa tài khoản của chính mình'],
	[/^you can only lock accounts with a lower role than yours$/i, 'Bạn chỉ có thể khóa tài khoản có vai trò thấp hơn bạn'],
	[/^exam is already approved and can no longer be updated$/i, 'Đề thi đã được duyệt nên không thể chỉnh sửa'],
	[/^only the exam creator or an admin can modify this exam$/i, 'Chỉ người tạo đề hoặc quản trị viên mới được sửa đề thi này'],
	[/^this google account is linked to another account$/i, 'Tài khoản Google này đã được liên kết với tài khoản khác'],
	[/^identity already has a (\w+) credential$/i, 'Tài khoản đã có phương thức đăng nhập này'],
	[/^cards can only be added to your own lists$/i, 'Bạn chỉ có thể thêm thẻ vào bộ thẻ của mình'],
	[/^you do not own this flash card list$/i, 'Bạn không sở hữu bộ thẻ này'],
	[/^only cards by the list author can be moved into it$/i, 'Chỉ thẻ của tác giả bộ thẻ mới được chuyển vào đây'],
	[/^you cannot save a copy of your own list$/i, 'Đây là bộ thẻ của bạn nên không cần lưu bản sao'],
	[/^this list is not a copy of another list$/i, 'Bộ thẻ này không phải bản sao của bộ thẻ khác'],
	[/^you cannot propose changes to your own list$/i, 'Bạn không thể gửi đề xuất cho bộ thẻ của chính mình'],
	[/^an open proposal already exists for this list$/i, 'Bạn đã có một đề xuất đang chờ duyệt từ bộ thẻ này'],
	[/^there are no changes to propose$/i, 'Bộ của bạn chưa có thay đổi nào so với bản gốc'],
	[/^this proposal is no longer open$/i, 'Đề xuất này đã được xử lý hoặc đã rút lại'],
	[/^this proposal has unresolved conflicts$/i, 'Hãy chọn cách xử lý cho các thẻ bị xung đột trước khi chấp nhận'],
	[/^only the list owner can (accept|reject) this proposal$/i, 'Chỉ chủ bộ thẻ mới được duyệt đề xuất này'],
	[/^only the proposer can withdraw this proposal$/i, 'Chỉ người gửi mới được rút lại đề xuất này'],
	[/^(attempt already submitted|exam result has already been submitted)$/i, 'Bài làm đã được nộp'],
	[/^exam submission time has expired$/i, 'Đã hết thời gian làm bài'],
	[/^must at least answer one question before submitting$/i, 'Cần trả lời ít nhất một câu trước khi nộp bài'],
	[/^duration must be a positive whole number of seconds$/i, 'Thời lượng phải là số nguyên dương'],
	[/^this type of question only allows one correct choice$/i, 'Loại câu hỏi này chỉ cho phép một đáp án đúng'],
	[/^(cross-site request refused|origin not allowed)$/i, 'Yêu cầu bị từ chối vì không xuất phát từ trang hợp lệ'],
	[/^the demo account can'?t /i, 'Tài khoản demo không được phép thực hiện thao tác này'],
	[/^access denied\b/i, HTTP_STATUS_MESSAGES[403]],
	[/^(ThrottlerException.*|too many requests)$/i, HTTP_STATUS_MESSAGES[429]],
	[/^only youtube and twitch urls are allowed$/i, 'Chỉ chấp nhận đường dẫn YouTube hoặc Twitch'],
	[/^a room with this name already exists$/i, 'Đã có phòng với tên này'],
	[/^(.+?) not found$/i, (_, e) => `Không tìm thấy ${entityName(e) ?? 'dữ liệu'}`],
	[/^(.+?) already exists$/i, (_, e) => (entityName(e) ? `${capitalize(entityName(e)!)} đã tồn tại` : 'Dữ liệu đã tồn tại')],
];

const capitalize = (s: string): string => (s ? s.charAt(0).toLocaleUpperCase('vi') + s.slice(1) : s);

const applyRules = (
	text: string,
	rules: Array<[RegExp, string | ((...m: string[]) => string)]>,
): string | null => {
	for (const [re, out] of rules) {
		const m = text.match(re);
		if (m) return typeof out === 'string' ? out : out(...(m as unknown as string[]));
	}
	return null;
};

/** `filter.tags`, `sections[0].title`, ... followed by the class-validator predicate. */
const VALIDATION_RE =
	/^(?:each value in |nested property |property )?([A-Za-z_$][\w$]*(?:\.[\w$]+|\[\d+\])*) ((?:must|should|is|has)\b.*)$/;

export type ParsedValidationMessage = { path: string; predicate: string };

/** Splits "filter.tags must be an array" into its property path and translated predicate. */
export const parseValidationMessage = (msg: string): ParsedValidationMessage | null => {
	const m = msg.trim().match(VALIDATION_RE);
	if (!m) return null;
	const predicate = applyRules(m[2], PREDICATES);
	if (!predicate) return null;
	const each = /^each value in /.test(msg.trim());
	return { path: m[1], predicate: each ? `mỗi phần tử ${predicate}` : predicate };
};

const lastSegment = (path: string): string => path.replace(/\[\d+\]/g, '').split('.').pop() ?? path;

const labelFor = (path: string, labels?: Record<string, string>): string =>
	labels?.[path] ?? labels?.[lastSegment(path)] ?? FIELD_LABELS[path] ?? FIELD_LABELS[lastSegment(path)] ?? path;

/** Translates one backend message to Vietnamese where a rule exists; otherwise returns it trimmed. */
export const translateApiMessage = (msg: string, labels?: Record<string, string>): string => {
	const text = msg.trim().replace(/\.$/, '');
	const parsed = parseValidationMessage(text);
	if (parsed) return `${labelFor(parsed.path, labels)} ${parsed.predicate}`;
	return applyRules(text, MESSAGES) ?? msg.trim();
};

const toStrings = (value: unknown): string[] => {
	if (typeof value === 'string') return value.trim() ? [value] : [];
	if (Array.isArray(value)) return value.flatMap(toStrings);
	if (value && typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		if ('message' in obj) return toStrings(obj.message);
		if ('error' in obj) return toStrings(obj.error);
	}
	return [];
};

const readStatus = (error: any): number | undefined => {
	const s = error?.status ?? error?.statusCode ?? error?.body?.statusCode;
	return typeof s === 'number' ? s : undefined;
};

/** The raw messages carried by the error, before translation (technical ones dropped). */
const rawMessages = (error: any): string[] => {
	const body = error?.body;
	const candidates = [body?.error, body?.message, typeof body === 'string' ? body : undefined];
	for (const c of candidates) {
		const msgs = toStrings(c).filter((m) => !isTechnicalMessage(m));
		if (msgs.length > 0) return msgs;
	}
	return [];
};

export const normalizeApiError = (error: unknown, options: NormalizeApiErrorOptions = {}): NormalizedApiError => {
	const err = error as any;
	const status = readStatus(err);
	const fieldErrors: Record<string, string> = {};
	const messages: string[] = [];
	const push = (m: string) => {
		if (!messages.includes(m)) messages.push(m);
	};

	for (const raw of rawMessages(err)) {
		const parsed = parseValidationMessage(raw.replace(/\.$/, ''));
		const field = parsed && (options.fields?.[parsed.path] ?? options.fields?.[lastSegment(parsed.path)]);
		if (parsed && field) {
			fieldErrors[field] ??= capitalize(parsed.predicate);
			continue;
		}
		push(translateApiMessage(raw, options.labels));
	}

	if (messages.length === 0 && Object.keys(fieldErrors).length === 0) {
		const ownMessage = typeof err?.message === 'string' ? err.message.trim() : '';
		if (!status && NETWORK_PATTERNS.some((p) => p.test(ownMessage))) push(NETWORK_ERROR);
		else if (status && HTTP_STATUS_MESSAGES[status]) push(HTTP_STATUS_MESSAGES[status]);
		else if (
			ownMessage &&
			!isTechnicalMessage(ownMessage) &&
			!GENERIC_STATUS_TEXTS.has(ownMessage.toLowerCase())
		)
			push(translateApiMessage(ownMessage, options.labels));
		else push(options.fallback ?? DEFAULT_ERROR);
	}

	return { status: status, messages: messages, fieldErrors: fieldErrors };
};

/** One string for toasts and single-line slots; several messages are joined by new lines. */
export const extractApiErrorMessage = (error: unknown, fallback?: string): string =>
	normalizeApiError(error, { fallback: fallback }).messages.join('\n');

/** Mirrors class-validator's `IsStrongPassword()` defaults, which register/add-credential/change-password use. */
export const passwordPolicyError = (password: string): string | null => {
	const ok =
		password.length >= 8 &&
		/[a-z]/.test(password) &&
		/[A-Z]/.test(password) &&
		/\d/.test(password) &&
		/[^A-Za-z0-9]/.test(password);
	return ok ? null : PASSWORD_POLICY_MESSAGE;
};
