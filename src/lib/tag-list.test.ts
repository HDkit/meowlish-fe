import { describe, expect, it } from 'vitest';
import { groupTags, type TagNode } from './tag-list';

const tags: TagNode[] = [
	{ id: 'es', name: 'Exam Structure' },
	{ id: 'toeic', name: 'TOEIC', parentId: 'es' },
	{ id: 'tl', name: 'TOEIC Listening', parentId: 'toeic' },
	{ id: 'p1', name: 'Part 1', parentId: 'tl' },
	{ id: 'ielts', name: 'IELTS', parentId: 'es' },
	{ id: 'ir', name: 'IELTS Reading', parentId: 'ielts' },
	{ id: 'qt', name: 'Question Type' },
	{ id: 'inf', name: 'Inference', parentId: 'qt' },
	{ id: 'impl', name: 'Implication', parentId: 'qt' },
	{ id: 'lonely', name: 'Grammar' },
];

describe('groupTags', () => {
	it('groups by root, sorted, with the path below the root', () => {
		const groups = groupTags(tags);
		expect(groups.map((g) => g.group)).toEqual(['Exam Structure', 'Khác', 'Question Type']);
		expect(groups.find((g) => g.group === 'Question Type')?.tags.map((t) => t.tag.name)).toEqual([
			'Implication',
			'Inference',
		]);
		expect(groups[0].tags.find((t) => t.tag.name === 'Part 1')?.path).toBe('TOEIC › TOEIC Listening');
	});

	it('drops an excluded tag and everything under it', () => {
		const names = groupTags(tags, ['toeic'])
			.flatMap((g) => g.tags)
			.map((t) => t.tag.name);
		expect(names).not.toContain('Part 1');
		expect(names).not.toContain('TOEIC Listening');
		expect(names).toContain('IELTS Reading');
	});

	it('keeps a root without children as a pickable tag', () => {
		expect(groupTags(tags).find((g) => g.group === 'Khác')?.tags[0].tag.name).toBe('Grammar');
	});
});
