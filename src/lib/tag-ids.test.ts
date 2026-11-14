import { describe, expect, it } from 'vitest';
import { buildTagIdMap, diffTagIds, UnknownTagsError } from './tag-ids';

const ids = buildTagIdMap([
	{ id: 'id-grammar', name: 'grammar' },
	{ id: 'id-reading', name: 'reading' },
	{ id: 'id-listening', name: 'listening' },
]);

describe('diffTagIds', () => {
	it('maps added and removed names to tag IDs', () => {
		expect(diffTagIds(['grammar', 'reading'], ['reading', 'listening'], ids)).toEqual({
			addTags: ['id-listening'],
			removeTags: ['id-grammar'],
		});
	});

	it('sends nothing when the names are unchanged', () => {
		expect(diffTagIds(['grammar'], ['grammar'], ids)).toEqual({ addTags: [], removeTags: [] });
	});

	it('rejects a name that is not in the tag list instead of sending it', () => {
		expect(() => diffTagIds([], ['grammar', 'nope'], ids)).toThrow(UnknownTagsError);
		try {
			diffTagIds([], ['nope'], ids);
		} catch (e) {
			expect((e as UnknownTagsError).names).toEqual(['nope']);
		}
	});

	it('skips removing a current name that no longer exists in the list', () => {
		expect(diffTagIds(['gone', 'grammar'], [], ids)).toEqual({ addTags: [], removeTags: ['id-grammar'] });
	});

	it('ignores duplicate names', () => {
		expect(diffTagIds([], ['grammar', 'grammar'], ids)).toEqual({ addTags: ['id-grammar'], removeTags: [] });
	});
});
