/**
 * Exam, section and question tag edits take tag IDs, while the detail responses list
 * tag names. These helpers diff two name lists and translate the result to IDs using
 * the tag list (names are unique).
 */
export type TagRef = { id: string; name: string };

export class UnknownTagsError extends Error {
	constructor(public readonly names: string[]) {
		super(`Nhãn không tồn tại: ${names.join(', ')}`);
		this.name = 'UnknownTagsError';
	}
}

export const buildTagIdMap = (tags: readonly TagRef[]): Map<string, string> =>
	new Map(tags.map((t) => [t.name, t.id]));

/**
 * Returns the IDs to add and remove to go from `currentNames` to `nextNames`.
 * Throws UnknownTagsError if a name to add isn't in the tag list. A current name that is
 * missing from the list (deleted tag) can't be removed by ID and is skipped.
 */
export const diffTagIds = (
	currentNames: readonly string[],
	nextNames: readonly string[],
	idByName: ReadonlyMap<string, string>,
): { addTags: string[]; removeTags: string[] } => {
	const current = new Set(currentNames);
	const next = new Set(nextNames);
	const added = [...next].filter((n) => !current.has(n));
	const removed = [...current].filter((n) => !next.has(n));

	const unknown = added.filter((n) => !idByName.has(n));
	if (unknown.length > 0) throw new UnknownTagsError(unknown);

	return {
		addTags: added.map((n) => idByName.get(n) as string),
		removeTags: removed.flatMap((n) => {
			const id = idByName.get(n);
			return id ? [id] : [];
		}),
	};
};
