export interface BlogCover {
  src: string;
  alt: string;
}

const LEADING_IMAGE = /^\s*!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)\s*/;
const ANY_IMAGE = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/;

const isWebUrl = (src: string) => /^https?:\/\//i.test(src) || src.startsWith('/');

/**
 * Posts have no cover field: a Markdown image at the very top is the cover. Returns it and the body
 * without it, so the detail page can show it as a hero instead of twice.
 */
export const splitCover = (markdown: string): { cover?: BlogCover; body: string } => {
  const match = LEADING_IMAGE.exec(markdown);
  if (!match || !isWebUrl(match[2])) return { body: markdown };
  return { cover: { alt: match[1], src: match[2] }, body: markdown.slice(match[0].length) };
};

/** Cover for cards: the leading image, else the first image anywhere in the post. */
export const findCoverImage = (markdown: string): BlogCover | undefined => {
  const leading = splitCover(markdown).cover;
  if (leading) return leading;
  const match = ANY_IMAGE.exec(markdown);
  return match && isWebUrl(match[2]) ? { alt: match[1], src: match[2] } : undefined;
};

/** Plain-text preview: no images, code, tables, HTML or Markdown markers. */
export const markdownExcerpt = (markdown: string, maxLength = 160): string => {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<details>[\s\S]*?<\/details>/gi, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*\|.*\|\s*$/gm, ' ')
    .replace(/^\s{0,3}(#{1,6}|>+|[-*+]|\d+\.)\s+/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/~~[^~]*~~/g, ' ')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};

/** Minutes to read at ~200 words per minute, rounded up (at least 1). Tables and code count too. */
export const readingMinutes = (markdown: string): number => {
  const words = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(w => /[\p{L}\d]/u.test(w)).length;
  return Math.max(1, Math.ceil(words / 200));
};

export interface RelatedCandidate {
  id: string;
  tags: string[];
  createdAt: number;
}

/** Other posts ranked by shared tags, then newest first. */
export const pickRelatedPosts = <T extends RelatedCandidate>(
  current: { id: string; tags: string[] },
  candidates: readonly T[],
  count = 3,
): T[] => {
  const tags = new Set(current.tags);
  const seen = new Set<string>([current.id]);
  return candidates
    .filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    })
    .map(c => ({ c: c, shared: c.tags.filter(t => tags.has(t)).length }))
    .sort((a, b) => b.shared - a.shared || b.c.createdAt - a.c.createdAt)
    .slice(0, count)
    .map(x => x.c);
};

/** Display names for the tags the seeded posts use; others fall back to a de-slugged form. */
const TAG_LABELS: Record<string, string> = {
  ielts: 'IELTS',
  toeic: 'TOEIC',
  'tu-vung': 'Từ vựng',
  'ngu-phap': 'Ngữ pháp',
  'phat-am': 'Phát âm',
  nghe: 'Luyện nghe',
  'viet-lach': 'Viết',
  'phuong-phap': 'Phương pháp',
  'tieng-anh': 'Tiếng Anh',
  'co-ban': 'Cơ bản',
  'doc-hieu': 'Đọc hiểu',
  'luyen-thi': 'Luyện thi',
  'luyen-tap': 'Luyện tập',
  'hoc-tap': 'Học tập',
  'cong-so': 'Công sở',
  'giao-tiep': 'Giao tiếp',
  podcast: 'Podcast',
  email: 'Email',
};

/** "tu-vung" -> "Từ vựng"; unknown slugs: hyphens to spaces, first letter upper-cased. */
export const formatTag = (tag: string): string => {
  const known = TAG_LABELS[tag.toLowerCase()];
  if (known) return known;
  const text = tag.replace(/[-_]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};
