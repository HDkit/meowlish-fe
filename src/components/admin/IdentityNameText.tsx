import { Skeleton } from '@/components/ui/skeleton';
import { isIdentityPending, type IdentityName } from './useIdentityNames';

/**
 * A person's display name from `useIdentityNames`, with a small placeholder
 * while the lookup is in flight instead of flashing the fallback first.
 */
export function IdentityNameText({
	id,
	names,
	fallback = '—',
}: {
	id: string | undefined | null;
	names: Record<string, IdentityName>;
	fallback?: string;
}) {
	const hit = id ? names[id]?.name : undefined;
	if (hit) return <>{hit}</>;
	if (isIdentityPending(id)) {
		return (
			<>
				<Skeleton className="inline-block h-3.5 w-20 align-middle" />
				<span className="sr-only">Đang tải tên…</span>
			</>
		);
	}
	return <>{fallback}</>;
}
