'use client';

import { useState } from 'react';
import { FilesService } from '@/lib/api-client';
import { extractApiErrorMessage, extractEntityData } from '@/lib/api-response';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Link2, UploadCloud } from 'lucide-react';

type PresignedUploadData = {
  fileName: string;
  id: string;
  uploadUrl: string;
  formData: Record<string, string>;
};

export function AdminUploadTool() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fileName: '',
    fileSize: '1',
    contentType: 'application/octet-stream',
    isPublicFile: true,
  });
  const [result, setResult] = useState<PresignedUploadData | null>(null);

  const handleSubmit = async () => {
    if (!form.fileName.trim() || !form.contentType.trim()) {
      toast({ title: 'Thiếu dữ liệu', description: 'Cần nhập file name và content type.', variant: 'destructive' });
      return;
    }

    const parsedSize = Number(form.fileSize);
    if (!Number.isFinite(parsedSize) || parsedSize <= 0) {
      toast({ title: 'File size không hợp lệ', description: 'File size phải là số dương.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await FilesService.fileGatewayControllerGetPresignedUrlV1({
        requestBody: {
          fileName: form.fileName.trim(),
          fileSize: parsedSize,
          contentType: form.contentType.trim(),
          isPublicFile: form.isPublicFile,
        },
      });

      const payload = extractEntityData<PresignedUploadData>(response);
      setResult(payload);
      toast({ title: 'Đã tạo presigned URL', description: payload?.id ? `File id: ${payload.id}` : 'API đã trả upload URL.' });
    } catch (error) {
      toast({
        title: 'Tạo presigned URL thất bại',
        description: extractApiErrorMessage(error, 'Không thể tạo presigned upload URL.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Presigned Upload URL</CardTitle>
        <p className="text-sm text-gray-500">Dùng API `/api/v1/files` để lấy upload URL và file id.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>File name</Label>
            <Input value={form.fileName} onChange={(event) => setForm((prev) => ({ ...prev, fileName: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Content type</Label>
            <Input value={form.contentType} onChange={(event) => setForm((prev) => ({ ...prev, contentType: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>File size</Label>
            <Input value={form.fileSize} onChange={(event) => setForm((prev) => ({ ...prev, fileSize: event.target.value }))} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Public file</p>
              <p className="text-xs text-gray-500">Bật nếu file được public.</p>
            </div>
            <Switch checked={form.isPublicFile} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublicFile: checked }))} />
          </div>
        </div>

        <Button onClick={() => void handleSubmit()} disabled={loading}>
          <UploadCloud className="h-4 w-4 mr-2" />
          {loading ? 'Đang tạo...' : 'Lấy presigned URL'}
        </Button>

        {result && (
          <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">File ID</p>
                <p className="font-mono text-sm text-gray-900 break-all">{result.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">File Name</p>
                <p className="text-sm text-gray-900 break-all">{result.fileName}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Upload URL</p>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-800 break-all">
                {result.uploadUrl}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Form Data
              </p>
              <div className="space-y-2">
                {Object.entries(result.formData ?? {}).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs">
                    <p className="font-medium text-gray-700">{key}</p>
                    <p className="font-mono text-gray-900 break-all">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
