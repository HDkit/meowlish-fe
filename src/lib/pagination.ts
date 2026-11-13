/** Page numbers to show around `page`: first, last, neighbours; null marks a gap ("…"). */
export const pageWindow = (page: number, count: number): (number | null)[] => {
	const shown = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
	const sorted = [...shown].sort((a, b) => a - b);
	const out: (number | null)[] = [];
	sorted.forEach((p, i) => {
		if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
		out.push(p);
	});
	return out;
};
