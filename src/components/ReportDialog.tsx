'use client';

import React, { useState } from 'react';
import { ReportService } from '@/lib/api/services/ReportService';
import { useToast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-response';
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

const TYPE_OPTIONS = [
	{ value: 'bug', label: 'Lỗi hệ thống (Bug)', icon: Bug },
	{ value: 'content', label: 'Nội dung không phù hợp', icon: FileText },
	{ value: 'behavior', label: 'Hành vi vi phạm', icon: UserX },
];

interface ReportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	targetType?: 'exam' | 'blog' | 'flashcard' | 'flashcard list';
	targetId?: string;
	userId: string;
}

export function ReportDialog({ open, onOpenChange, targetType, targetId, userId }: ReportDialogProps) {
	const { toast } = useToast();
	const [type, setType] = useState('bug');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!title.trim() || !description.trim() || submitting) return;
		setSubmitting(true);
		try {
			const res = await ReportService.createReport({
				type,
				title: title.trim(),
				description: description.trim(),
				targetType,
				targetId,
			});
			setTitle('');
			setDescription('');
			setType('bug');
			onOpenChange(false);
		} catch (err) {
			console.error('[ReportDialog] create error:', err);
			toast({ title: 'Gửi báo cáo thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
		} finally {
			setSubmitting(false);
		}
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
						<Label className="font-bold">Loại báo cáo <span className="text-red-500">*</span></Label>
						<Select value={type} onValueChange={setType}>
							<SelectTrigger className="rounded-xl">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TYPE_OPTIONS.map((opt) => (
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
						<div className="flex items-center justify-between">
							<Label className="font-bold">Mô tả chi tiết <span className="text-red-500">*</span></Label>
							{!description && (
								<button type="button" onClick={() => setDescription(`Mô tả vấn đề:\n\nCác bước tái tạo:\n1. ...\n2. ...\n\nKết quả mong muốn:\n\nKết quả thực tế:\n`)} className="text-xs text-primary hover:underline font-medium">
									Dùng mẫu
								</button>
							)}
						</div>
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
					<Button onClick={handleSubmit} disabled={!title.trim() || !description.trim() || submitting} className="rounded-xl bg-red-600 hover:bg-red-700">
						<Flag className="h-4 w-4 mr-1" /> {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
