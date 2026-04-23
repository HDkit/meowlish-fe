export const extractEntityData = <T>(response: { data?: unknown } | null | undefined): T | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const entity = response as { data?: T | null };
  return entity.data ?? null;
};

export const extractApiErrorMessage = (error: any, fallback: string): string => {
  const apiError = error?.body?.error;

  if (typeof apiError === 'string' && apiError.trim()) {
    return apiError;
  }

  if (Array.isArray(apiError) && apiError.length > 0) {
    return apiError.map((item) => String(item)).join(', ');
  }

  if (typeof apiError?.message === 'string' && apiError.message.trim()) {
    return apiError.message;
  }

  if (Array.isArray(apiError?.message) && apiError.message.length > 0) {
    return apiError.message.map((item: unknown) => String(item)).join(', ');
  }

  if (typeof error?.body?.message === 'string' && error.body.message.trim()) {
    return error.body.message;
  }

  if (Array.isArray(error?.body?.message) && error.body.message.length > 0) {
    return error.body.message.map((item: unknown) => String(item)).join(', ');
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const parseCommaSeparatedValues = (value: string): string[] => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};
