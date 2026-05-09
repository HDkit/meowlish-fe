'use client';

import React, { useState } from 'react';
import { useAppDispatch } from '@/lib/store/hooks';
import { addReport } from '@/components/store/reportSlice';
import { Report, ReportCategory, ReportStatus } from '@/types/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
	Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from './ui/dialog';
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import { Flag, Bug, FileText, UserX } from 'lucide-react';

const CATEGORY_OPTIONS = [
	{ value: ReportCategory.Bug, label: 'Lỗi hệ thống (Bug)', icon: Bug },
	{ value: ReportCategory.Content, label: 'Nội dung không phù hợp', icon: FileText },
	{ value: ReportCategory.Behavior, label: 'Hành vi vi phạm', icon: UserX },
];

interface ReportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	targetType?: 'blog' | 'exam' | 'user' | 'other';
	targetId?: string;
	userId: string;
}

export function ReportDialog({ open, onOpenChange, targetType, targetId, userId }: ReportDialogProps) {
	const dispatch = useAppDispatch();
	const [category, setCategory] = useState<ReportCategory>(ReportCategory.Bug);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');

	const handleSubmit = () => {
		if (!title.trim() || !description.trim()) return;

		const newReport: Report = {
			id: `rep${Date.now()}`,
			userId,
			category,
			title: title.trim(),
			description: description.trim(),
			targetType,
			targetId,
			status: ReportStatus.Pending,
			createdAt: Date.now(),
		};

		dispatch(addReport(newReport));
		setTitle('');
		setDescription('');
		setCategory(ReportCategory.Bug);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
				<div className="h-2 w-full bg-red-500" />
				<DialogHeader className="px-6 pt-6 pb-2">
					<DialogTitle className="text-xl font-bold flex items-center gap-2">
						<Flag className="h-5 w-5 text-red-500" />
						Gửi báo cáo
					</DialogTitle>
					<DialogDescription className="text-gray-500">
						Mô tả vấn đề bạn gặp phải để chúng tôi xem xét và xử lý.
					</DialogDescription>
				</DialogHeader>
				<div className="px-6 py-4 space-y-4">
					<div className="space-y-2">
						<Label className="font-bold">Danh mục <span className="text-red-500">*</span></Label>
						<Select value={category} onValueChange={(v) => setCategory(v as ReportCategory)}>
							<SelectTrigger className="rounded-xl">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CATEGORY_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										<div className="flex items-center gap-2">
											<opt.icon className="h-4 w-4" />
											{opt.label}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label className="font-bold">Tiêu đề <span className="text-red-500">*</span></Label>
						<Input
							placeholder="VD: Lỗi hiển thị câu hỏi"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="rounded-xl"
						/>
					</div>
					<div className="space-y-2">
						<Label className="font-bold">Mô tả chi tiết <span className="text-red-500">*</span></Label>
						<Textarea
							placeholder="Mô tả cụ thể vấn đề bạn gặp phải..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
							className="rounded-xl resize-none"
						/>
					</div>
				</div>
				<DialogFooter className="px-6 py-4 bg-gray-50 border-t">
					<Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Hủy</Button>
					<Button onClick={handleSubmit} disabled={!title.trim() || !description.trim()} className="rounded-xl bg-red-600 hover:bg-red-700">
						<Flag className="h-4 w-4 mr-1" /> Gửi báo cáo
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
