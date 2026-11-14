'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from './ui/utils';

/** Plain text of an HTML string (for the first render, before the DOM sanitizer is available). */
const toPlainText = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Exam content (passages, instructions, question text) as the test screen shows it: staff write it
 * as HTML (headings, paragraphs, tables with numbered blanks), and plain text keeps its line breaks.
 * Sanitized before rendering: scripts, event handlers and `javascript:` links are removed.
 */
export function ExamHtml({ html, className }: { html: string; className?: string }) {
	const clean = useMemo(
		() =>
			typeof window === 'undefined' ? null : DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }),
		[html],
	);

	// plain text keeps its line breaks; in HTML, the newlines between tags are just source formatting
	const isHtml = /<[a-z][^>]*>/i.test(html);
	const classes = cn(
		isHtml ? 'leading-relaxed' : 'whitespace-pre-wrap leading-relaxed',
		'[&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h3]:font-semibold',
		'[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
		'[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
		'[&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-200 [&_th]:px-2 [&_th]:py-1',
		'[&_img]:max-w-full',
		className,
	);

	if (clean === null) return <div className={classes}>{toPlainText(html)}</div>;
	return <div className={classes} dangerouslySetInnerHTML={{ __html: clean }} />;
}
