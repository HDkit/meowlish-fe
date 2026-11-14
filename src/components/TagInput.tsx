'use client';

import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useTagList } from '@/lib/tag-list';

type Props = {
	id?: string;
	/** Tag names. */
	value: string[];
	onChange: (tags: string[]) => void;
	/** Extra suggestions, e.g. tags already used on the user's flashcards. */
	suggestions?: string[];
	placeholder?: string;
	max?: number;
};

const norm = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.trim();

/**
 * Free-text tag input with suggestions (exam tags from the shared cache plus `suggestions`).
 * Arrow keys + Enter pick a suggestion; Enter alone adds what was typed. Tags are stored as names.
 */
export function TagInput({ id, value, onChange, suggestions = [], placeholder = 'Nhập tag…', max = 10 }: Props) {
	const { tags: examTags } = useTagList();
	const [text, setText] = useState('');
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(0);

	const pool = useMemo(() => {
		const names = new Map<string, string>();
		for (const n of [...suggestions, ...examTags.map((t) => t.name)]) {
			const key = norm(n);
			if (key && !names.has(key)) names.set(key, n.trim());
		}
		return [...names.values()];
	}, [examTags, suggestions]);

	const matches = useMemo(() => {
		const q = norm(text);
		const taken = new Set(value.map(norm));
		return pool
			.filter((n) => !taken.has(norm(n)) && (!q || norm(n).includes(q)))
			.sort((a, b) => Number(!norm(a).startsWith(q)) - Number(!norm(b).startsWith(q)) || a.localeCompare(b))
			.slice(0, 8);
	}, [pool, text, value]);

	const add = (raw: string) => {
		const tag = raw.trim().replace(/\s+/g, ' ');
		if (!tag || value.length >= max || value.some((v) => norm(v) === norm(tag))) {
			setText('');
			return;
		}
		// reuse the existing spelling of a known tag ("ielts" -> "IELTS")
		onChange([...value, pool.find((p) => norm(p) === norm(tag)) ?? tag]);
		setText('');
		setActive(0);
	};

	return (
		<div className="space-y-2">
			<div className="relative">
				<Input
					id={id}
					value={text}
					onChange={(e) => {
						setText(e.target.value);
						setOpen(true);
						setActive(0);
					}}
					onFocus={() => setOpen(true)}
					onBlur={() => setTimeout(() => setOpen(false), 120)}
					onKeyDown={(e) => {
						if (e.key === 'ArrowDown') {
							e.preventDefault();
							setOpen(true);
							setActive((a) => Math.min(a + 1, matches.length - 1));
						} else if (e.key === 'ArrowUp') {
							e.preventDefault();
							setActive((a) => Math.max(a - 1, 0));
						} else if (e.key === 'Enter') {
							e.preventDefault();
							// a highlighted suggestion while typing, else the typed text
							add(open && text && matches[active] && norm(matches[active]).includes(norm(text)) ? matches[active] : text);
						} else if (e.key === 'Backspace' && !text && value.length > 0) {
							onChange(value.slice(0, -1));
						} else if (e.key === 'Escape') {
							setOpen(false);
						}
					}}
					placeholder={value.length >= max ? `Tối đa ${max} tag` : placeholder}
					disabled={value.length >= max}
					className="h-11 rounded-xl border-slate-200 bg-slate-50 pr-10 focus:border-primary focus:ring-primary"
					role="combobox"
					aria-expanded={open && matches.length > 0}
					aria-autocomplete="list"
				/>
				{text.trim() && (
					<button
						type="button"
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => add(text)}
						className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-primary hover:bg-primary/10"
						aria-label="Thêm tag"
					>
						<Plus className="h-4 w-4" />
					</button>
				)}
				{open && matches.length > 0 && (
					<ul
						role="listbox"
						className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
					>
						{matches.map((m, i) => (
							<li
								key={m}
								role="option"
								aria-selected={i === active}
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => add(m)}
								onMouseEnter={() => setActive(i)}
								className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${
									i === active ? 'bg-primary/10 font-semibold text-primary' : 'text-slate-700'
								}`}
							>
								{m}
							</li>
						))}
					</ul>
				)}
			</div>
			{value.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{value.map((tag) => (
						<Badge key={tag} variant="secondary" className="gap-1 px-2.5 py-1 text-sm">
							{tag}
							<button
								type="button"
								onClick={() => onChange(value.filter((t) => t !== tag))}
								className="ml-0.5 hover:text-red-500"
								aria-label={`Xóa tag ${tag}`}
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}
