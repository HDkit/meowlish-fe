'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Tags, X } from 'lucide-react';
import { Button } from './ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { groupTags, type TagNode } from '@/lib/tag-list';

type Props = {
	tags: TagNode[];
	/** Selected tag names. */
	value: string[];
	onChange: (names: string[]) => void;
	/** Tag names to hide, with everything under them. */
	exclude?: string[];
	placeholder?: string;
	/** Display label of a tag name (e.g. translations). */
	label?: (name: string) => string;
	loading?: boolean;
};

/**
 * Compact, searchable multi-select over the (cached) exam tag tree: one button opens a type-ahead
 * list grouped by root tag, and the chosen tags show as removable chips.
 */
export function TagPicker({
	tags,
	value,
	onChange,
	exclude,
	placeholder = 'Lọc theo chủ đề',
	label = (n) => n,
	loading,
}: Props) {
	const [open, setOpen] = useState(false);
	const groups = useMemo(() => groupTags(tags, exclude), [tags, exclude]);
	const toggle = (name: string) =>
		onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name]);

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-3.5 font-semibold text-slate-700 shadow-sm"
					>
						<Tags className="h-4 w-4 text-primary" />
						{placeholder}
						{value.length > 0 && (
							<span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
								{value.length}
							</span>
						)}
						<ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-0" align="start">
					<Command>
						<CommandInput placeholder="Tìm chủ đề…" />
						<CommandList className="max-h-72">
							<CommandEmpty>{loading ? 'Đang tải chủ đề…' : 'Không có chủ đề phù hợp.'}</CommandEmpty>
							{groups.map((g) => (
								<CommandGroup key={g.group} heading={g.group}>
									{g.tags.map(({ tag, path }) => {
										const selected = value.includes(tag.name);
										return (
											<CommandItem
												key={tag.id}
												value={`${tag.name} ${path} ${label(tag.name)}`}
												onSelect={() => toggle(tag.name)}
												className="gap-2"
											>
												<span
													className={`flex h-4 w-4 items-center justify-center rounded border ${
														selected ? 'border-primary bg-primary text-white' : 'border-slate-300'
													}`}
												>
													{selected && <Check className="h-3 w-3" />}
												</span>
												<span className="flex-1 truncate">{label(tag.name)}</span>
												{path && <span className="truncate text-[11px] text-slate-400">{path}</span>}
											</CommandItem>
										);
									})}
								</CommandGroup>
							))}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{value.map((name) => (
				<span
					key={name}
					className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 py-1 pl-3 pr-1.5 text-sm font-semibold text-primary"
				>
					{label(name)}
					<button
						type="button"
						onClick={() => toggle(name)}
						className="rounded-full p-0.5 hover:bg-primary/20"
						aria-label={`Bỏ chọn ${label(name)}`}
					>
						<X className="h-3.5 w-3.5" />
					</button>
				</span>
			))}
			{value.length > 1 && (
				<button
					type="button"
					onClick={() => onChange([])}
					className="text-sm font-semibold text-slate-500 underline-offset-2 hover:text-red-500 hover:underline"
				>
					Bỏ chọn tất cả
				</button>
			)}
		</div>
	);
}
