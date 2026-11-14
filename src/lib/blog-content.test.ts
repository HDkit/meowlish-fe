import { describe, expect, it } from 'vitest';
import {
  findCoverImage,
  formatTag,
  markdownExcerpt,
  pickRelatedPosts,
  readingMinutes,
  splitCover,
} from './blog-content';

describe('splitCover', () => {
  it('takes a leading image as the cover and removes it from the body', () => {
    const md = '![Desk](https://img.example/a.jpg)\n\nHello **world**';
    expect(splitCover(md)).toEqual({
      cover: { alt: 'Desk', src: 'https://img.example/a.jpg' },
      body: 'Hello **world**',
    });
  });

  it('keeps the body when the first block is not an image or not a web URL', () => {
    expect(splitCover('Intro\n\n![x](https://a/b.png)').cover).toBeUndefined();
    expect(splitCover('![x](javascript:alert(1))').cover).toBeUndefined();
  });

  it('finds an image further down for cards', () => {
    expect(findCoverImage('Intro\n\n![x](https://a/b.png "t")')).toEqual({ alt: 'x', src: 'https://a/b.png' });
    expect(findCoverImage('no images')).toBeUndefined();
  });
});

describe('markdownExcerpt', () => {
  it('strips images, tables, code, html and markers', () => {
    const md = [
      '![c](https://a/b.png)',
      '## Heading',
      '| a | b |',
      '| --- | --- |',
      '> a [link](https://x) and ~~wrong~~ **bold**',
      '```text',
      'code',
      '```',
      '<details><summary>Ans</summary>x</details>',
      '- item',
    ].join('\n');
    expect(markdownExcerpt(md)).toBe('Heading a link and bold item');
  });

  it('cuts at a word boundary', () => {
    expect(markdownExcerpt('one two three four five', 13)).toBe('one two three…');
  });
});

describe('readingMinutes', () => {
  it('rounds up to whole minutes, at least one, counting table cells but not markup', () => {
    expect(readingMinutes('short')).toBe(1);
    expect(readingMinutes('word '.repeat(1000))).toBe(5);
    expect(readingMinutes('word '.repeat(201))).toBe(2);
    expect(readingMinutes('| --- | --- |\n'.repeat(500) + '![a](https://x/y.png)')).toBe(1);
  });
});

describe('pickRelatedPosts', () => {
  const post = (id: string, tags: string[], createdAt: number) => ({ id: id, tags: tags, createdAt: createdAt });

  it('ranks by shared tags then recency, excluding the current post and duplicates', () => {
    const related = pickRelatedPosts({ id: 'cur', tags: ['ielts', 'viet'] }, [
      post('cur', ['ielts'], 9),
      post('a', ['ielts'], 1),
      post('b', ['ielts', 'viet'], 0),
      post('c', [], 5),
      post('a', ['ielts'], 1),
      post('d', ['viet'], 3),
    ]);
    expect(related.map(p => p.id)).toEqual(['b', 'd', 'a']);
  });
});

describe('formatTag', () => {
  it('uses Vietnamese labels for known tags and de-slugs the rest', () => {
    expect(formatTag('tu-vung')).toBe('Từ vựng');
    expect(formatTag('ielts')).toBe('IELTS');
    expect(formatTag('ky-nang_mem')).toBe('Ky nang mem');
  });
});
