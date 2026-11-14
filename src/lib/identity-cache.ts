export interface Identity {
  id: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

/** Ids still to fetch: non-empty, deduplicated, not cached and not already requested. */
export const missingIdentityIds = (
  ids: readonly (string | undefined | null)[],
  cached: ReadonlyMap<string, unknown>,
  pending: ReadonlySet<string> = new Set(),
): string[] => [...new Set(ids.filter((id): id is string => !!id))].filter(id => !cached.has(id) && !pending.has(id));

export const displayName = (identity?: Identity): string =>
  identity?.fullName?.trim() || identity?.username?.trim() || 'Người dùng';

/** Up to two initials for avatar fallbacks: "Nguyễn Văn Minh" -> "NM". */
export const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
};
