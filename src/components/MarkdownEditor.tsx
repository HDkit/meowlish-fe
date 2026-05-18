'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
	Bold, Italic, Heading1, Heading2, Heading3,
	List, ListOrdered, Link, Image, Code,
	Quote, Minus, Eye, PenLine,
} from 'lucide-react';
import { MarkdownPreview } from './MarkdownPreview';

interface MarkdownEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	rows?: number;
	className?: string;
}

type FormatAction = {
	icon: typeof Bold;
	label: string;
	prefix: string;
	suffix?: string;
	block?: boolean;
};

const FORMAT_ACTIONS: FormatAction[] = [
	{ icon: Bold, label: 'In đậm', prefix: '**', suffix: '**' },
	{ icon: Italic, label: 'In nghiêng', prefix: '_', suffix: '_' },
	{ icon: Heading1, label: 'Tiêu đề 1', prefix: '# ', block: true },
	{ icon: Heading2, label: 'Tiêu đề 2', prefix: '## ', block: true },
	{ icon: Heading3, label: 'Tiêu đề 3', prefix: '### ', block: true },
	{ icon: List, label: 'Danh sách', prefix: '- ', block: true },
	{ icon: ListOrdered, label: 'Danh sách số', prefix: '1. ', block: true },
	{ icon: Quote, label: 'Trích dẫn', prefix: '> ', block: true },
	{ icon: Code, label: 'Code', prefix: '`', suffix: '`' },
	{ icon: Link, label: 'Liên kết', prefix: '[', suffix: '](url)' },
	{ icon: Image, label: 'Hình ảnh', prefix: '![alt](', suffix: ')' },
	{ icon: Minus, label: 'Đường kẻ', prefix: '\n---\n', block: true },
];

export function MarkdownEditor({ value, onChange, placeholder, rows = 12, className }: MarkdownEditorProps) {
	const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const applyFormat = useCallback((action: FormatAction) => {
		const ta = textareaRef.current;
		if (!ta) return;

		const start = ta.selectionStart;
		const end = ta.selectionEnd;
		const selected = value.substring(start, end);

		let newText: string;
		let newCursorPos: number;

		if (action.block) {
			const lineStart = value.lastIndexOf('\n', start - 1) + 1;
			newText = value.substring(0, lineStart) + action.prefix + value.substring(lineStart);
			newCursorPos = start + action.prefix.length;
		} else {
			const suffix = action.suffix ?? '';
			newText = value.substring(0, start) + action.prefix + selected + suffix + value.substring(end);
			newCursorPos = selected ? end + action.prefix.length + suffix.length : start + action.prefix.length;
		}

		onChange(newText);
		requestAnimationFrame(() => {
			ta.focus();
			ta.setSelectionRange(newCursorPos, newCursorPos);
		});
	}, [value, onChange]);

	return (
		<div className={className}>
			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'preview')}>
				<div className="flex items-center justify-between mb-2">
					<TabsList className="h-8">
						<TabsTrigger value="write" className="text-xs px-3 h-7 gap-1">
							<PenLine className="h-3.5 w-3.5" /> Viết
						</TabsTrigger>
						<TabsTrigger value="preview" className="text-xs px-3 h-7 gap-1">
							<Eye className="h-3.5 w-3.5" /> Xem trước
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="write" className="mt-0">
					<div className="flex flex-wrap gap-0.5 p-1.5 bg-gray-50 border border-b-0 border-gray-200 rounded-t-lg">
						{FORMAT_ACTIONS.map((action) => (
							<Button
								key={action.label}
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => applyFormat(action)}
								className="h-7 w-7 p-0 hover:bg-gray-200"
								title={action.label}
							>
								<action.icon className="h-3.5 w-3.5" />
							</Button>
						))}
					</div>
					<Textarea
						ref={textareaRef}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						rows={rows}
						className="font-mono text-sm rounded-t-none border-gray-200 resize-y"
					/>
				</TabsContent>

				<TabsContent value="preview" className="mt-0">
					<div
						className="border border-gray-200 rounded-lg p-4 bg-white overflow-auto"
						style={{ minHeight: `${rows * 1.5 + 2}rem` }}
					>
						{value.trim() ? (
							<MarkdownPreview content={value} />
						) : (
							<p className="text-gray-400 italic">Chưa có nội dung để xem trước</p>
						)}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
