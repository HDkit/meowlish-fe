'use client';

import { useEffect, useMemo, useState } from 'react';
import { TagsService } from '@/lib/api-client';
import { extractApiErrorMessage, extractEntityData } from '@/lib/api-response';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, Plus, Network, ListTree } from 'lucide-react';

type TagTreeNode = {
  name: string;
  children?: TagTreeNode[];
};

type TagListItem = {
  name: string;
  parent?: string;
};

function TagTree({ nodes }: { nodes: TagTreeNode[] }) {
  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <div key={`${node.name}-${node.children?.length ?? 0}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-900">{node.name}</p>
          {node.children && node.children.length > 0 && (
            <div className="mt-2 space-y-2 border-l border-gray-200 pl-3">
              <TagTree nodes={node.children} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function AdminTagManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tagName, setTagName] = useState('');
  const [parentId, setParentId] = useState('');
  const [createdTagId, setCreatedTagId] = useState('');
  const [tree, setTree] = useState<TagTreeNode[]>([]);
  const [list, setList] = useState<TagListItem[]>([]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const [treeResponse, listResponse] = await Promise.all([
        TagsService.tagGatewayControllerGetTagTreeV1(),
        TagsService.tagGatewayControllerGetTagListV1(),
      ]);

      setTree(extractEntityData<{ trees: TagTreeNode[] }>(treeResponse)?.trees ?? []);
      setList(extractEntityData<{ list: TagListItem[] }>(listResponse)?.list ?? []);
    } catch (error) {
      toast({
        title: 'Không tải được tag',
        description: extractApiErrorMessage(error, 'Không thể tải cây tag từ hệ thống.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTags();
  }, []);

  const flatPreview = useMemo(() => list.slice(0, 12), [list]);

  const handleCreateTag = async () => {
    if (!tagName.trim()) {
      toast({ title: 'Thiếu tên tag', description: 'Vui lòng nhập tên tag trước khi tạo.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await TagsService.tagGatewayControllerAddTagV1({
        requestBody: {
          name: tagName.trim(),
          parentId: parentId.trim() || undefined,
        },
      });

      const payload = extractEntityData<{ id?: string }>(response);
      setCreatedTagId(payload?.id ?? '');
      setTagName('');
      setParentId('');
      toast({
        title: 'Đã tạo tag',
        description: payload?.id ? `Tag mới có id: ${payload.id}` : 'Tag đã được tạo thành công.',
      });
      await loadTags();
    } catch (error) {
      toast({
        title: 'Tạo tag thất bại',
        description: extractApiErrorMessage(error, 'Không thể tạo tag mới.'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Tag Manager</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Tạo tag mới và kiểm tra dữ liệu tag từ API.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadTags()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input
            placeholder="Tên tag"
            value={tagName}
            onChange={(event) => setTagName(event.target.value)}
          />
          <Input
            placeholder="Parent tag id (tuỳ chọn)"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
          />
          <Button onClick={() => void handleCreateTag()} disabled={submitting}>
            <Plus className="h-4 w-4 mr-2" />
            {submitting ? 'Đang tạo...' : 'Tạo tag'}
          </Button>
        </div>

        {createdTagId && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Tag vừa tạo có id: <span className="font-mono">{createdTagId}</span>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Network className="h-4 w-4 text-blue-600" />
              <h3 className="font-medium text-gray-900">Tag Tree</h3>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">Đang tải cây tag...</p>
            ) : tree.length === 0 ? (
              <p className="text-sm text-gray-500">API chưa trả cây tag nào.</p>
            ) : (
              <TagTree nodes={tree} />
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <ListTree className="h-4 w-4 text-purple-600" />
              <h3 className="font-medium text-gray-900">Tag List</h3>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">Đang tải danh sách tag...</p>
            ) : flatPreview.length === 0 ? (
              <p className="text-sm text-gray-500">API chưa trả danh sách tag nào.</p>
            ) : (
              <div className="space-y-2">
                {flatPreview.map((tag) => (
                  <div key={`${tag.parent ?? 'root'}-${tag.name}`} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                    <p className="font-medium text-gray-900">{tag.name}</p>
                    <p className="text-xs text-gray-500">parent: {tag.parent ?? 'root'}</p>
                  </div>
                ))}
                {list.length > flatPreview.length && (
                  <p className="text-xs text-gray-400">Đang hiển thị {flatPreview.length}/{list.length} tag đầu tiên.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
