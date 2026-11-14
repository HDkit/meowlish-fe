/**
 * Shows the readable address of an item opened by id (old links, notifications): replaces the last
 * path segment with the slug, keeping the query string and hash, without a new history entry.
 */
export function showSlugInAddress(current: string, slug: string | undefined): void {
	if (typeof window === 'undefined' || !slug || slug === current) return;
	const { pathname, search, hash } = window.location;
	const segments = pathname.split('/');
	if (decodeURIComponent(segments[segments.length - 1] ?? '') !== current) return;
	segments[segments.length - 1] = encodeURIComponent(slug);
	window.history.replaceState(window.history.state, '', `${segments.join('/')}${search}${hash}`);
}
