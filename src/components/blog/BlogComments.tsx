'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, CornerDownRight, Flag, MessageSquare, Pencil, Reply, Trash2 } from 'lucide-react';
import { BlogCommentService, type BlogComment } from '@/lib/api/services/BlogCommentService';
import {
  MAX_VISUAL_DEPTH,
  collectAuthorIds,
  countVisible,
  insertReply,
  removeComment,
  replaceComment,
  visualDepth,
} from '@/lib/comment-tree';
import { canModerate, communityErrorMessage } from '@/lib/forum';
import { type Identity, displayName } from '@/lib/identity-cache';
import { blogCommentTargetId } from '@/lib/report-targets';
import { useAuth } from '@/lib/hooks/useAuth';
import { useIdentities } from '@/hooks/useIdentities';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { ReportDialog } from '@/components/ReportDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ConfirmDialog } from '@/components/community/ConfirmDialog';
import { RelativeTime } from '@/components/community/RelativeTime';
import { ErrorState, ListSkeleton } from '@/components/community/States';
import { UserAvatar } from '@/components/community/UserAvatar';

const PAGE_SIZE = 10;
const CONTENT_MAX = 5000;

const actionClass = 'h-7 gap-1 rounded-md px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800';

interface ComposerProps {
  initial?: string;
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  onSubmit: (content: string) => Promise<boolean>;
}

function Composer({ initial = '', placeholder, submitLabel, autoFocus, onCancel, onSubmit }: ComposerProps) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const tooLong = value.length > CONTENT_MAX;

  const submit = async () => {
    if (!value.trim() || tooLong || busy) return;
    setBusy(true);
    const ok = await onSubmit(value.trim());
    setBusy(false);
    if (ok) setValue('');
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void submit();
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        rows={3}
        autoFocus={autoFocus}
        className="resize-y rounded-xl bg-white text-sm"
      />
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs ${tooLong ? 'text-red-600' : 'text-slate-400'}`}>
          {tooLong ? `Tối đa ${CONTENT_MAX} ký tự` : 'Hỗ trợ Markdown · Ctrl+Enter để gửi'}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
              Hủy
            </Button>
          )}
          <Button size="sm" onClick={submit} disabled={!value.trim() || tooLong || busy} className="rounded-lg">
            {busy ? 'Đang gửi…' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ItemContext {
  identities: Record<string, Identity>;
  currentUserId?: string;
  moderator: boolean;
  replyingTo: string | null;
  editing: string | null;
  collapsed: Set<string>;
  setReplyingTo: (id: string | null) => void;
  setEditing: (id: string | null) => void;
  toggleCollapsed: (id: string) => void;
  onReply: (parent: BlogComment, content: string) => Promise<boolean>;
  onEdit: (comment: BlogComment, content: string) => Promise<boolean>;
  onDelete: (comment: BlogComment) => void;
  onReport: (comment: BlogComment) => void;
}

function CommentItem({ comment, parent, ctx }: { comment: BlogComment; parent?: BlogComment; ctx: ItemContext }) {
  const author = ctx.identities[comment.authorId];
  const isAuthor = !!ctx.currentUserId && ctx.currentUserId === comment.authorId;
  const collapsed = ctx.collapsed.has(comment.id);
  const hiddenCount = countVisible(comment.replies);
  // Past the indentation cap, nest no further and say whom the reply answers instead.
  const capped = comment.depth > MAX_VISUAL_DEPTH;
  const nested = visualDepth(comment.depth + 1) > visualDepth(comment.depth);

  return (
    <li id={`comment-${comment.id}`} className="scroll-mt-24">
      <div className="flex gap-3">
        {comment.deleted ?
          <div className="size-8 shrink-0 rounded-full bg-slate-100" aria-hidden="true" />
        : <UserAvatar identity={author} className="size-8" />}
        <div className="min-w-0 flex-1">
          {comment.deleted ?
            <p className="py-1 text-sm italic text-slate-400">[đã xóa]</p>
          : <>
              <div className="flex flex-wrap items-center gap-x-2 text-sm">
                <span className="font-semibold text-slate-800">{displayName(author)}</span>
                <RelativeTime iso={comment.createdAt} className="text-xs text-slate-500" />
                {comment.editedAt && <span className="text-xs italic text-slate-400">(đã chỉnh sửa)</span>}
              </div>
              {capped && parent && (
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <CornerDownRight className="size-3" aria-hidden="true" />
                  trả lời {parent.deleted ? 'bình luận đã xóa' : displayName(ctx.identities[parent.authorId])}
                </div>
              )}
              {ctx.editing === comment.id ?
                <div className="mt-2">
                  <Composer
                    initial={comment.content}
                    placeholder="Chỉnh sửa bình luận"
                    submitLabel="Lưu"
                    autoFocus
                    onCancel={() => ctx.setEditing(null)}
                    onSubmit={content => ctx.onEdit(comment, content)}
                  />
                </div>
              : <MarkdownPreview content={comment.content} className="prose-sm mt-1 break-words prose-p:my-1" />}
            </>
          }

          <div className="mt-1 flex flex-wrap items-center gap-0.5">
            {!comment.deleted && ctx.currentUserId && ctx.editing !== comment.id && (
              <>
                <Button variant="ghost" className={actionClass} onClick={() => ctx.setReplyingTo(ctx.replyingTo === comment.id ? null : comment.id)}>
                  <Reply className="size-3.5" aria-hidden="true" /> Trả lời
                </Button>
                {isAuthor && (
                  <Button variant="ghost" className={actionClass} onClick={() => ctx.setEditing(comment.id)}>
                    <Pencil className="size-3.5" aria-hidden="true" /> Sửa
                  </Button>
                )}
                {(isAuthor || ctx.moderator) && (
                  <Button variant="ghost" className={`${actionClass} hover:text-red-600`} onClick={() => ctx.onDelete(comment)}>
                    <Trash2 className="size-3.5" aria-hidden="true" /> Xóa
                  </Button>
                )}
                {!isAuthor && (
                  <Button variant="ghost" className={actionClass} onClick={() => ctx.onReport(comment)}>
                    <Flag className="size-3.5" aria-hidden="true" /> Báo cáo
                  </Button>
                )}
              </>
            )}
            {comment.replies.length > 0 && (
              <Button
                variant="ghost"
                className={actionClass}
                aria-expanded={!collapsed}
                onClick={() => ctx.toggleCollapsed(comment.id)}
              >
                {collapsed ?
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                : <ChevronDown className="size-3.5" aria-hidden="true" />}
                {collapsed ? `Hiện ${hiddenCount} trả lời` : 'Ẩn trả lời'}
              </Button>
            )}
          </div>

          {ctx.replyingTo === comment.id && (
            <div className="mt-2">
              <Composer
                placeholder={`Trả lời ${displayName(author)}`}
                submitLabel="Trả lời"
                autoFocus
                onCancel={() => ctx.setReplyingTo(null)}
                onSubmit={content => ctx.onReply(comment, content)}
              />
            </div>
          )}

        </div>
      </div>

      {!collapsed && comment.replies.length > 0 && (
        <ul
          className={
            nested ? 'ml-4 mt-3 space-y-4 border-l-2 border-slate-100 pl-4 sm:ml-[15px] sm:pl-5' : 'mt-4 space-y-4'
          }
        >
          {comment.replies.map(r => (
            <CommentItem key={r.id} comment={r} parent={comment} ctx={ctx} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function BlogComments({ blogId }: { blogId: string }) {
  const { toast } = useToast();
  const { currUser } = useAuth();
  const moderator = canModerate(currUser?.roleId);

  const [comments, setComments] = useState<BlogComment[]>([]);
  const [totalThreads, setTotalThreads] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<BlogComment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reporting, setReporting] = useState<BlogComment | null>(null);

  const loadPage = useCallback(
    async (next: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await BlogCommentService.listComments(blogId, { page: next, limit: PAGE_SIZE });
        const data = res.data ?? { comments: [], totalThreads: 0, totalComments: 0 };
        // Later pages append; a thread already shown (page shift after new comments) is skipped.
        setComments(prev => {
          if (next === 1) return data.comments;
          const seen = new Set(prev.map(c => c.id));
          return [...prev, ...data.comments.filter(c => !seen.has(c.id))];
        });
        setTotalThreads(data.totalThreads);
        setTotalComments(data.totalComments);
        setPage(next);
      } catch (err) {
        setError(communityErrorMessage(err, 'Không tải được bình luận.'));
      } finally {
        setLoading(false);
      }
    },
    [blogId],
  );

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  // Links to a comment (e.g. from a report) carry #comment-<id>: scroll there once loaded.
  useEffect(() => {
    if (page !== 1 || typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash.startsWith('#comment-')) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [page, comments]);

  const authorIds = useMemo(() => [...collectAuthorIds(comments)], [comments]);
  const identities = useIdentities(authorIds);

  const fail = (title: string, err: unknown) =>
    toast({ title: title, description: communityErrorMessage(err), variant: 'destructive' });

  const createTopLevel = async (content: string) => {
    try {
      const res = await BlogCommentService.createComment(blogId, { content: content });
      if (res.data) setComments(prev => [res.data as BlogComment, ...prev]);
      setTotalThreads(n => n + 1);
      setTotalComments(n => n + 1);
      return true;
    } catch (err) {
      fail('Không gửi được bình luận', err);
      return false;
    }
  };

  const ctx: ItemContext = {
    identities: identities,
    currentUserId: currUser?.id,
    moderator: moderator,
    replyingTo: replyingTo,
    editing: editing,
    collapsed: collapsed,
    setReplyingTo: id => {
      setEditing(null);
      setReplyingTo(id);
    },
    setEditing: id => {
      setReplyingTo(null);
      setEditing(id);
    },
    toggleCollapsed: id =>
      setCollapsed(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    onReply: async (parent, content) => {
      try {
        const res = await BlogCommentService.createComment(blogId, { content: content, parentId: parent.id });
        const created = res.data;
        // Very deep replies are stored next to their parent, so insert under whatever the server chose.
        if (created) setComments(prev => insertReply(prev, created));
        setTotalComments(n => n + 1);
        setReplyingTo(null);
        setCollapsed(prev => {
          const next = new Set(prev);
          next.delete(created?.parentId ?? parent.id);
          return next;
        });
        return true;
      } catch (err) {
        fail('Không gửi được trả lời', err);
        return false;
      }
    },
    onEdit: async (comment, content) => {
      try {
        const res = await BlogCommentService.updateComment(comment.id, { content: content });
        if (res.data) setComments(prev => replaceComment(prev, res.data as BlogComment));
        setEditing(null);
        return true;
      } catch (err) {
        fail('Không lưu được chỉnh sửa', err);
        return false;
      }
    },
    onDelete: comment => setPendingDelete(comment),
    onReport: comment => setReporting(comment),
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await BlogCommentService.deleteComment(pendingDelete.id);
      const next = removeComment(comments, pendingDelete.id);
      if (!pendingDelete.parentId && !next.some(c => c.id === pendingDelete.id)) {
        setTotalThreads(n => Math.max(0, n - 1));
      }
      setComments(next);
      setTotalComments(n => Math.max(0, n - 1));
      setPendingDelete(null);
      toast({ title: 'Đã xóa bình luận' });
    } catch (err) {
      fail('Không xóa được bình luận', err);
    } finally {
      setDeleting(false);
    }
  };

  const hasMore = comments.length < totalThreads;

  return (
    <section aria-labelledby="comments-heading" className="space-y-5">
      <h2 id="comments-heading" className="flex items-center gap-2 text-xl font-bold text-slate-900">
        <MessageSquare className="size-5 text-primary" aria-hidden="true" />
        Bình luận
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-slate-600">{totalComments}</span>
      </h2>

      {currUser ?
        <div className="flex gap-3">
          <UserAvatar identity={identities[currUser.id] ?? { id: currUser.id, fullName: currUser.fullName }} className="size-9" />
          <div className="flex-1">
            <Composer placeholder="Viết bình luận của bạn…" submitLabel="Bình luận" onSubmit={createTopLevel} />
          </div>
        </div>
      : <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Đăng nhập để bình luận.</p>}

      {error && comments.length === 0 ?
        <ErrorState message={error} onRetry={() => void loadPage(1)} />
      : loading && comments.length === 0 ?
        <ListSkeleton rows={3} label="Đang tải bình luận" />
      : comments.length === 0 ?
        <p className="py-6 text-center text-sm text-slate-500">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ!</p>
      : <ul className="space-y-6">
          {comments.map(c => (
            <CommentItem key={c.id} comment={c} ctx={ctx} />
          ))}
        </ul>
      }

      {error && comments.length > 0 && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => void loadPage(page + 1)} disabled={loading} className="rounded-xl text-primary">
            {loading ? 'Đang tải…' : `Xem thêm bình luận (${totalThreads - comments.length})`}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
        title="Xóa bình luận này?"
        description={
          pendingDelete && pendingDelete.replies.length > 0 ?
            'Bình luận sẽ hiển thị là "[đã xóa]" để giữ lại các trả lời bên dưới.'
          : 'Bình luận sẽ bị xóa vĩnh viễn.'
        }
        busy={deleting}
        onConfirm={confirmDelete}
      />

      {currUser && reporting && (
        <ReportDialog
          key={reporting.id}
          open
          onOpenChange={open => !open && setReporting(null)}
          targetType="blog comment"
          targetId={blogCommentTargetId(blogId, reporting.id)}
          userId={currUser.id}
        />
      )}
    </section>
  );
}
