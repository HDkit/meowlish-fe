'use client';

import { useEffect, useState } from 'react';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const TITLE_MAX = 200;
export const BODY_MAX = 20000;

interface ThreadEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  categoryName?: string;
  initial?: { title: string; body: string };
  onSubmit: (value: { title: string; body: string }) => Promise<void>;
}

export function ThreadEditorDialog({ open, onOpenChange, mode, categoryName, initial, onSubmit }: ThreadEditorDialogProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '');
      setBody(initial?.body ?? '');
    }
  }, [open, initial?.title, initial?.body]);

  const valid = title.trim().length > 0 && body.trim().length > 0 && title.length <= TITLE_MAX && body.length <= BODY_MAX;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), body: body.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !submitting && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Tạo chủ đề mới' : 'Chỉnh sửa chủ đề'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' && categoryName ?
              <>Đăng trong chuyên mục <strong>{categoryName}</strong>. Nội dung hỗ trợ Markdown.</>
            : 'Nội dung hỗ trợ Markdown.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="thread-title" className="font-semibold">
                Tiêu đề <span className="text-red-500">*</span>
              </Label>
              <span className={`text-xs ${title.length > TITLE_MAX ? 'text-red-600' : 'text-slate-400'}`}>
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <Input
              id="thread-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Cách lên dàn ý IELTS Writing Task 2 nhanh?"
              className="rounded-xl"
              maxLength={TITLE_MAX + 20}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">
              Nội dung <span className="text-red-500">*</span>
            </Label>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              rows={12}
              placeholder="Mô tả câu hỏi hoặc chia sẻ của bạn. Hãy nêu rõ trình độ và mục tiêu nếu đang hỏi."
            />
            {body.length > BODY_MAX && <p className="text-xs text-red-600">Nội dung quá dài (tối đa {BODY_MAX} ký tự).</p>}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting} className="rounded-xl">
            Hủy
          </Button>
          <Button onClick={submit} disabled={!valid || submitting} className="rounded-xl">
            {submitting ? 'Đang lưu…' : mode === 'create' ? 'Đăng chủ đề' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
