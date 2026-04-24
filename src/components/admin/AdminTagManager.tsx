'use client';

import { useEffect, useMemo, useState } from 'react';
import { TagsService } from '@/lib/api-client';
import { extractApiErrorMessage, extractEntityData } from '@/lib/api-response';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, Plus, Network, ListTree, Edit2, Move, Trash2 } from 'lucide-react';

type TagTreeNode = {
  id: string;
  name: string;
  children?: TagTreeNode[];
};

type TagListItem = {
  id: string;
  name: string;
  parentId?: string;
};

function TagTree({ nodes, onRename, onMove, onDelete }: { 
  nodes: TagTreeNode[];
  onRename: (id: string, currentName: string) => void;
  onMove: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <div key={`${node.id}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{node.name}</p>
              <p className="text-xs text-gray-500">id: {node.id}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onRename(node.id, node.name)}>
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => onMove(node.id)}>
                <Move className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(node.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {node.children && node.children.length > 0 && (
            <div className="mt-2 space-y-2 border-l border-gray-200 pl-3">
              <TagTree nodes={node.children} onRename={onRename} onMove={onMove} onDelete={onDelete} />
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
        description: extractApiErrorMessage(error, 'Không thể tải dữ liệu tag từ hệ thống.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTags();
  }, []);

  const flatPreview = useMemo(() => list.slice(0, 50), [list]);

  const handleCreateTag = async () => {
    if (!tagName.trim()) {
      toast({ title: 'Thiếu tên tag', description: 'Vui lòng nhập tên tag.', variant: 'destructive' });
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
      toast({ title: 'Đã tạo tag', description: `Tag mới có id: ${payload?.id}` });
      await loadTags();
    } catch (error) {
      toast({ title: 'Tạo tag thất bại', description: extractApiErrorMessage(error, 'Lỗi'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRename = async (id: string, currentName: string) => {
    const newName = window.prompt('Nhập tên mới cho tag:', currentName);
    if (!newName || newName.trim() === currentName) return;

    setLoading(true);
    try {
      await TagsService.tagGatewayControllerUpdateTagV1({
        id,
        requestBody: { name: newName.trim() }
      });
      toast({ title: 'Đã đổi tên tag', description: `Thành công đổi tên thành "${newName.trim()}"` });
      await loadTags();
    } catch (error) {
      toast({ title: 'Đổi tên thất bại', description: extractApiErrorMessage(error, 'Lỗi'), variant: 'destructive' });
      setLoading(false);
    }
  };

  const handleMove = async (id: string) => {
    const newParentId = window.prompt('Nhập ID của tag cha mới (để trống nếu muốn đưa lên Root):');
    if (newParentId === null) return; // User cancelled

    setLoading(true);
    try {
      await TagsService.tagGatewayControllerMoveTagV1({
        id,
        requestBody: { parentId: newParentId.trim() || undefined }
      });
      toast({ title: 'Đã di chuyển tag', description: `Thành công di chuyển tag` });
      await loadTags();
    } catch (error) {
      toast({ title: 'Di chuyển thất bại', description: extractApiErrorMessage(error, 'Lỗi'), variant: 'destructive' });
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tag này? Các tag con (nếu có) có thể bị ảnh hưởng.')) return;

    setLoading(true);
    try {
      await TagsService.tagGatewayControllerDeleteTagV1({ id });
      toast({ title: 'Đã xóa tag' });
      await loadTags();
    } catch (error) {
      toast({ title: 'Xóa thất bại', description: extractApiErrorMessage(error, 'Lỗi'), variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Tag Manager</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Quản lý cây tag và danh sách tag toàn hệ thống.</p>
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
          <div className="rounded-2xl border border-gray-100 bg-white p-4 max-h-[600px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white pb-2 z-10">
              <Network className="h-4 w-4 text-blue-600" />
              <h3 className="font-medium text-gray-900">Tag Tree</h3>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">Đang tải...</p>
            ) : tree.length === 0 ? (
              <p className="text-sm text-gray-500">API chưa trả cây tag nào.</p>
            ) : (
              <TagTree nodes={tree} onRename={handleRename} onMove={handleMove} onDelete={handleDelete} />
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 max-h-[600px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white pb-2 z-10">
              <ListTree className="h-4 w-4 text-purple-600" />
              <h3 className="font-medium text-gray-900">Tag List (Phẳng)</h3>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">Đang tải...</p>
            ) : flatPreview.length === 0 ? (
              <p className="text-sm text-gray-500">API chưa trả danh sách tag nào.</p>
            ) : (
              <div className="space-y-2">
                {flatPreview.map((tag) => (
                  <div key={tag.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{tag.name}</p>
                      <p className="text-xs text-gray-500">id: <span className="font-mono">{tag.id}</span> • parent: <span className="font-mono">{tag.parentId ?? 'root'}</span></p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleRename(tag.id, tag.name)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handleMove(tag.id)}>
                        <Move className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(tag.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {list.length > flatPreview.length && (
                  <p className="text-xs text-center text-gray-400 font-medium py-2">Đang hiển thị {flatPreview.length}/{list.length} tag.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
