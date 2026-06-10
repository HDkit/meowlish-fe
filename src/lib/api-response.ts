export const extractEntityData = <T>(response: { data?: unknown } | null | undefined): T | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const entity = response as { data?: T | null };
  return entity.data ?? null;
};

const httpStatusMessages: Record<number, string> = {
  400: 'Dữ liệu không hợp lệ',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',
  403: 'Bạn không có quyền thực hiện thao tác này',
  404: 'Không tìm thấy dữ liệu',
  409: 'Dữ liệu bị trùng lặp',
  429: 'Quá nhiều yêu cầu. Vui lòng thử lại sau',
  500: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau',
  502: 'Máy chủ không phản hồi. Vui lòng thử lại sau',
  503: 'Dịch vụ tạm thời không khả dụng',
};



const DEFAULT_ERROR = 'Đã xảy ra lỗi. Vui lòng thử lại sau';

const isTechnicalMessage = (msg: string): boolean => {
  const patterns = [
    /prisma/i, /sql/i, /database/i, /ECONNREFUSED/i,
    /ETIMEDOUT/i, /ENOTFOUND/i, /at\s+\S+\s*\(/, /\.ts:\d+/,
    /\.js:\d+/, /Internal server error/i, /Cannot\s+(GET|POST|PUT|DELETE|PATCH)\s+\//,
  ];
  return patterns.some(p => p.test(msg));
};

export const extractApiErrorMessage = (error: any, fallback?: string): string => {
  const statusCode = error?.status ?? error?.statusCode ?? error?.body?.statusCode;
  const apiError = error?.body?.error;

  if (typeof apiError === 'string' && apiError.trim() && !isTechnicalMessage(apiError)) {
    return apiError;
  }

  if (Array.isArray(apiError) && apiError.length > 0) {
    const msgs = apiError.map((item) => String(item)).filter(m => !isTechnicalMessage(m));
    if (msgs.length > 0) return msgs.join(', ');
  }

  if (typeof apiError?.message === 'string' && apiError.message.trim() && !isTechnicalMessage(apiError.message)) {
    return apiError.message;
  }

  if (Array.isArray(apiError?.message) && apiError.message.length > 0) {
    const msgs = apiError.message.map((item: unknown) => String(item)).filter((m: string) => !isTechnicalMessage(m));
    if (msgs.length > 0) return msgs.join(', ');
  }

  if (typeof error?.body?.message === 'string' && error.body.message.trim() && !isTechnicalMessage(error.body.message)) {
    return error.body.message;
  }

  if (Array.isArray(error?.body?.message) && error.body.message.length > 0) {
    const msgs = error.body.message.map((item: unknown) => String(item)).filter((m: string) => !isTechnicalMessage(m));
    if (msgs.length > 0) return msgs.join(', ');
  }

  if (typeof statusCode === 'number' && httpStatusMessages[statusCode]) {
    return httpStatusMessages[statusCode];
  }

  if (typeof error?.message === 'string' && error.message.trim() && !isTechnicalMessage(error.message)) {
    return error.message;
  }

  return fallback ?? DEFAULT_ERROR;
};

export const parseCommaSeparatedValues = (value: string): string[] => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};
