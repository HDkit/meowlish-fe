export const extractEntityData = <T>(response: { data?: unknown } | null | undefined): T | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const entity = response as { data?: T | null };
  return entity.data ?? null;
};

// Error helpers live in api-errors.ts; re-exported here for existing imports.
export { extractApiErrorMessage, normalizeApiError } from './api-errors';

export const parseCommaSeparatedValues = (value: string): string[] => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};
