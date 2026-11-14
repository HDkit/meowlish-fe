'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  Flag,
  Lock,
  LockOpen,
  MessageSquare,
  MessageSquareQuote,
  Pencil,
  Pin,
  PinOff,
  Reply,
  Trash2,
  X,
} from 'lucide-react';
import {
  ForumService,
  type ForumReply,
  type ForumThread,
  type ListForumRepliesResponse,
} from '@/lib/api/services/ForumService';
import {
  REPLIES_PER_PAGE,
  canModerate,
  communityErrorMessage,
  pageOfPosition,
  parsePageParam,
  totalPages,
} from '@/lib/forum';
import { displayName } from '@/lib/identity-cache';
import { forumReplyTargetId, type ReportTargetType } from '@/lib/report-targets';
import { useAuth } from '@/lib/hooks/useAuth';
import { useIdentities } from '@/hooks/useIdentities';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { ReportDialog } from '@/components/ReportDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NavPagination } from '@/components/ui/nav-pagination';
import { useToast } from '@/components/ui/use-toast';
import { ConfirmDialog } from '@/components/community/ConfirmDialog';
import { RelativeTime } from '@/components/community/RelativeTime';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/community/States';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/community/UserAvatar';
import { ForumBreadcrumb } from './ForumBreadcrumb';
import { BODY_MAX, ThreadEditorDialog } from './ThreadEditorDialog';

type ReportTarget = { type: ReportTargetType; id: string };
type PendingDelete = { kind: 'thread' } | { kind: 'reply'; reply: ForumReply };

const actionClass = 'h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900';

export function ForumThreadView({ threadId }: { threadId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currUser } = useAuth();
  const moderator = canModerate(currUser?.roleId);

  const page = parsePageParam(searchParams.get('page'));
  const targetReplyId = searchParams.get('reply');

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [replies, setReplies] = useState<ListForumRepliesResponse | null>(null);
  const [repliesError, setRepliesError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [quoting, setQuoting] = useState<ForumReply | null>(null);
  const [posting, setPosting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingThread, setEditingThread] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [report, setReport] = useState<ReportTarget | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  const goToPage = useCallback(
    (p: number, replyId?: string) => {
      const params = new URLSearchParams();
      if (p > 1) params.set('page', String(p));
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}${replyId ? `#reply-${replyId}` : ''}`, { scroll: !replyId });
    },
    [pathname, router],
  );

  const loadThread = useCallback(() => {
    setThreadError(null);
    ForumService.getThread(threadId)
      .then(res => setThread(res.data))
      .catch(err => {
        if ((err as { status?: number })?.status === 404) setNotFound(true);
        else setThreadError(communityErrorMessage(err, 'Không tải được chủ đề.'));
      });
  }, [threadId]);

  // The thread is read once per visit (that read counts the view).
  useEffect(loadThread, [loadThread]);

  const loadReplies = useCallback(() => {
    setRepliesError(null);
    ForumService.listReplies(threadId, { page: page, limit: REPLIES_PER_PAGE })
      .then(res => setReplies(res.data ?? { replies: [], totalCount: 0 }))
      .catch(err => setRepliesError(communityErrorMessage(err, 'Không tải được các câu trả lời.')));
  }, [threadId, page]);

  useEffect(loadReplies, [loadReplies]);

  // `?reply=<id>` (links from reports): find the page holding that reply, then jump to it.
  useEffect(() => {
    if (!targetReplyId) return;
    let cancelled = false;
    (async () => {
      const batch = 100;
      for (let p = 1; p <= 20 && !cancelled; p++) {
        const res = await ForumService.listReplies(threadId, { page: p, limit: batch }).catch(() => null);
        const found = res?.data?.replies.find(r => r.id === targetReplyId);
        if (found) {
          if (!cancelled) goToPage(pageOfPosition(found.position), found.id);
          return;
        }
        if (!res?.data || p * batch >= res.data.totalCount) break;
      }
      if (!cancelled) toast({ title: 'Câu trả lời này không còn tồn tại' });
    })();
    return () => {
      cancelled = true;
    };
  }, [targetReplyId, threadId, goToPage, toast]);

  // Scroll to and flash `#reply-<id>` once that page has rendered.
  useEffect(() => {
    if (!replies || typeof window === 'undefined') return;
    const id = window.location.hash.replace(/^#reply-/, '');
    if (!id || id === window.location.hash) return;
    const el = document.getElementById(`reply-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightId(id);
      const t = setTimeout(() => setHighlightId(null), 2500);
      return () => clearTimeout(t);
    }
  }, [replies]);

  const identities = useIdentities([
    thread?.authorId,
    ...(replies?.replies ?? []).flatMap(r => [r.authorId, r.quotedReply?.authorId]),
  ]);

  const locked = !!thread?.isLocked;
  const mayWrite = !!currUser && (!locked || moderator);
  const pages = totalPages(replies?.totalCount ?? 0, REPLIES_PER_PAGE);

  const startQuote = (reply: ForumReply) => {
    setQuoting(reply);
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const postReply = async () => {
    const body = draft.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      const res = await ForumService.createReply(threadId, { body: body, quotedReplyId: quoting?.id });
      setDraft('');
      setQuoting(null);
      setThread(t => (t ? { ...t, replyCount: t.replyCount + 1, lastActivityAt: new Date().toISOString() } : t));
      const created = res.data;
      const targetPage = created ? pageOfPosition(created.position) : pages;
      if (targetPage === page) loadReplies();
      goToPage(targetPage, created?.id);
      toast({ title: 'Đã gửi trả lời' });
    } catch (err) {
      toast({ title: 'Không gửi được trả lời', description: communityErrorMessage(err), variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  const saveReplyEdit = async (reply: ForumReply) => {
    const body = editDraft.trim();
    if (!body || savingEdit) return;
    setSavingEdit(true);
    try {
      const res = await ForumService.updateReply(reply.id, { body: body });
      const updated = res.data;
      if (updated) {
        setReplies(r => (r ? { ...r, replies: r.replies.map(x => (x.id === updated.id ? updated : x)) } : r));
      }
      setEditingReplyId(null);
      toast({ title: 'Đã lưu chỉnh sửa' });
    } catch (err) {
      toast({ title: 'Không lưu được chỉnh sửa', description: communityErrorMessage(err), variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const saveThreadEdit = async (value: { title: string; body: string }) => {
    try {
      const res = await ForumService.updateThread(threadId, value);
      if (res.data) setThread(res.data);
      setEditingThread(false);
      toast({ title: 'Đã cập nhật chủ đề' });
    } catch (err) {
      toast({ title: 'Không cập nhật được chủ đề', description: communityErrorMessage(err), variant: 'destructive' });
    }
  };

  const moderate = async (change: { isPinned?: boolean; isLocked?: boolean }) => {
    try {
      const res = await ForumService.moderateThread(threadId, change);
      if (res.data) setThread(res.data);
      toast({
        title:
          change.isPinned !== undefined ?
            change.isPinned ? 'Đã ghim chủ đề' : 'Đã bỏ ghim'
          : change.isLocked ? 'Đã khóa chủ đề'
          : 'Đã mở khóa chủ đề',
      });
    } catch (err) {
      toast({ title: 'Thao tác thất bại', description: communityErrorMessage(err), variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.kind === 'thread') {
        await ForumService.deleteThread(threadId);
        toast({ title: 'Đã xóa chủ đề' });
        router.push(thread ? `/forum/${encodeURIComponent(thread.categoryId)}` : '/forum');
      } else {
        await ForumService.deleteReply(pendingDelete.reply.id);
        setThread(t => (t ? { ...t, replyCount: Math.max(0, t.replyCount - 1) } : t));
        const remaining = (replies?.totalCount ?? 1) - 1;
        if (page > totalPages(remaining, REPLIES_PER_PAGE)) goToPage(page - 1);
        else loadReplies();
        toast({ title: 'Đã xóa câu trả lời' });
      }
      setPendingDelete(null);
    } catch (err) {
      toast({ title: 'Không xóa được', description: communityErrorMessage(err), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <ForumBreadcrumb items={[{ label: 'Diễn đàn', href: '/forum' }, { label: 'Không tìm thấy' }]} />
        <EmptyState icon={<MessageSquare className="size-6" />} title="Chủ đề không tồn tại hoặc đã bị xóa">
          <Link href="/forum" className="text-primary hover:underline">
            Quay lại diễn đàn
          </Link>
        </EmptyState>
      </div>
    );
  }

  if (threadError) {
    return (
      <div className="mx-auto max-w-4xl">
        <ErrorState message={threadError} onRetry={loadThread} />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="mx-auto max-w-4xl space-y-5" role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">Đang tải chủ đề…</span>
        <Skeleton className="h-4 w-64 max-w-full bg-slate-100" />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-4 border-b border-slate-100 p-5 md:p-6">
            <Skeleton className="h-8 w-3/4 bg-slate-100" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 shrink-0 rounded-full bg-slate-100" />
              <Skeleton className="h-4 w-28 bg-slate-100" />
              <Skeleton className="h-4 w-20 bg-slate-100" />
            </div>
          </div>
          <div className="space-y-2.5 p-5 md:p-6">
            <Skeleton className="h-4 w-full bg-slate-100" />
            <Skeleton className="h-4 w-11/12 bg-slate-100" />
            <Skeleton className="h-4 w-2/3 bg-slate-100" />
          </div>
          <div className="h-12 border-t border-slate-100 bg-slate-50/60" />
        </div>
        <Skeleton className="h-5 w-32 bg-slate-100" />
        <ListSkeleton rows={2} label="Đang tải câu trả lời" />
      </div>
    );
  }

  const isThreadAuthor = currUser?.id === thread.authorId;
  const threadAuthor = identities[thread.authorId];

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-16">
      <ForumBreadcrumb
        items={[
          { label: 'Diễn đàn', href: '/forum' },
          { label: thread.categoryName, href: `/forum/${encodeURIComponent(thread.categoryId)}` },
          { label: thread.title },
        ]}
      />

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="thread-title">
        <header className="border-b border-slate-100 p-5 md:p-6">
          <div className="mb-2 flex flex-wrap gap-2">
            {thread.isPinned && (
              <Badge className="border-0 bg-amber-100 text-amber-800">
                <Pin className="mr-1 size-3" aria-hidden="true" /> Đã ghim
              </Badge>
            )}
            {thread.isLocked && (
              <Badge className="border-0 bg-slate-100 text-slate-700">
                <Lock className="mr-1 size-3" aria-hidden="true" /> Đã khóa
              </Badge>
            )}
          </div>
          <h2 id="thread-title" className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
            {thread.title}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <UserAvatar identity={threadAuthor} className="size-8" />
              <span className="font-medium text-slate-800">{displayName(threadAuthor)}</span>
            </span>
            <RelativeTime iso={thread.createdAt} />
            {thread.editedAt && (
              <span className="text-xs italic" title={thread.editedAt}>
                (đã chỉnh sửa)
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye className="size-4" aria-hidden="true" /> {thread.viewCount} lượt xem
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-4" aria-hidden="true" /> {thread.replyCount} trả lời
            </span>
          </div>
        </header>
        <div className="p-5 md:p-6">
          <MarkdownPreview content={thread.body} className="prose-table:block prose-table:overflow-x-auto" />
        </div>
        <footer className="flex flex-wrap gap-1 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
          {mayWrite && (
            <Button variant="ghost" className={actionClass} onClick={() => composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
              <Reply className="size-4" aria-hidden="true" /> Trả lời
            </Button>
          )}
          {isThreadAuthor && (!locked || moderator) && (
            <Button variant="ghost" className={actionClass} onClick={() => setEditingThread(true)}>
              <Pencil className="size-4" aria-hidden="true" /> Sửa
            </Button>
          )}
          {moderator && (
            <>
              <Button variant="ghost" className={actionClass} onClick={() => moderate({ isPinned: !thread.isPinned })}>
                {thread.isPinned ?
                  <PinOff className="size-4" aria-hidden="true" />
                : <Pin className="size-4" aria-hidden="true" />}
                {thread.isPinned ? 'Bỏ ghim' : 'Ghim'}
              </Button>
              <Button variant="ghost" className={actionClass} onClick={() => moderate({ isLocked: !thread.isLocked })}>
                {thread.isLocked ?
                  <LockOpen className="size-4" aria-hidden="true" />
                : <Lock className="size-4" aria-hidden="true" />}
                {thread.isLocked ? 'Mở khóa' : 'Khóa'}
              </Button>
            </>
          )}
          {(isThreadAuthor || moderator) && (
            <Button variant="ghost" className={`${actionClass} text-red-600 hover:bg-red-50 hover:text-red-700`} onClick={() => setPendingDelete({ kind: 'thread' })}>
              <Trash2 className="size-4" aria-hidden="true" /> Xóa
            </Button>
          )}
          {currUser && !isThreadAuthor && (
            <Button variant="ghost" className={`${actionClass} ml-auto`} onClick={() => setReport({ type: 'forum thread', id: thread.id })}>
              <Flag className="size-4" aria-hidden="true" /> Báo cáo
            </Button>
          )}
        </footer>
      </article>

      <section aria-labelledby="replies-heading" className="space-y-3">
        <h3 id="replies-heading" className="px-1 text-base font-semibold text-slate-800">
          {replies ? `${replies.totalCount} câu trả lời` : 'Câu trả lời'}
        </h3>

        {repliesError ?
          <ErrorState message={repliesError} onRetry={loadReplies} />
        : !replies ?
          <ListSkeleton rows={3} label="Đang tải câu trả lời" />
        : replies.replies.length === 0 ?
          <EmptyState icon={<MessageSquare className="size-6" />} title="Chưa có câu trả lời">
            {mayWrite ? 'Hãy là người đầu tiên trả lời chủ đề này.' : null}
          </EmptyState>
        : <ol className="space-y-3">
            {replies.replies.map(reply => {
              const author = identities[reply.authorId];
              const isAuthor = currUser?.id === reply.authorId;
              const editing = editingReplyId === reply.id;
              return (
                <li
                  key={reply.id}
                  id={`reply-${reply.id}`}
                  className={`scroll-mt-24 rounded-2xl border bg-white shadow-sm transition-colors ${highlightId === reply.id ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'}`}
                >
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-slate-100 px-4 py-2.5 text-sm">
                    <UserAvatar identity={author} className="size-8" />
                    <span className="font-medium text-slate-800">{displayName(author)}</span>
                    {reply.authorId === thread.authorId && (
                      <Badge variant="outline" className="h-5 border-emerald-200 px-1.5 text-[10px] text-emerald-700">
                        Tác giả
                      </Badge>
                    )}
                    <span className="text-slate-400">·</span>
                    <RelativeTime iso={reply.createdAt} className="whitespace-nowrap text-slate-500" />
                    {reply.editedAt && <span className="text-xs italic text-slate-400">(đã chỉnh sửa)</span>}
                    <a href={`#reply-${reply.id}`} className="ml-auto text-xs font-medium text-slate-400 hover:text-primary" aria-label={`Liên kết tới trả lời #${reply.position}`}>
                      #{reply.position}
                    </a>
                  </div>
                  <div className="px-4 py-3">
                    {reply.quotedReply && (
                      <blockquote className="mb-3 rounded-xl border-l-4 border-emerald-300 bg-emerald-50/60 px-3 py-2 text-sm text-slate-600">
                        <div className="mb-0.5 flex items-center gap-1 text-xs font-semibold text-emerald-800">
                          <MessageSquareQuote className="size-3.5" aria-hidden="true" />
                          {displayName(identities[reply.quotedReply.authorId])} đã viết:
                        </div>
                        <p className="line-clamp-3">{reply.quotedReply.excerpt}</p>
                      </blockquote>
                    )}
                    {editing ?
                      <div className="space-y-2">
                        <MarkdownEditor value={editDraft} onChange={setEditDraft} rows={6} />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingReplyId(null)} disabled={savingEdit}>
                            Hủy
                          </Button>
                          <Button size="sm" onClick={() => saveReplyEdit(reply)} disabled={!editDraft.trim() || editDraft.length > BODY_MAX || savingEdit}>
                            {savingEdit ? 'Đang lưu…' : 'Lưu'}
                          </Button>
                        </div>
                      </div>
                    : <MarkdownPreview content={reply.body} className="prose-sm prose-table:block prose-table:overflow-x-auto" />}
                  </div>
                  {!editing && currUser && (
                    <div className="flex flex-wrap gap-1 px-2 pb-2">
                      {mayWrite && (
                        <Button variant="ghost" className={actionClass} onClick={() => startQuote(reply)}>
                          <MessageSquareQuote className="size-4" aria-hidden="true" /> Trích dẫn
                        </Button>
                      )}
                      {isAuthor && (!locked || moderator) && (
                        <Button
                          variant="ghost"
                          className={actionClass}
                          onClick={() => {
                            setEditingReplyId(reply.id);
                            setEditDraft(reply.body);
                          }}
                        >
                          <Pencil className="size-4" aria-hidden="true" /> Sửa
                        </Button>
                      )}
                      {(isAuthor || moderator) && (
                        <Button variant="ghost" className={`${actionClass} text-red-600 hover:bg-red-50 hover:text-red-700`} onClick={() => setPendingDelete({ kind: 'reply', reply: reply })}>
                          <Trash2 className="size-4" aria-hidden="true" /> Xóa
                        </Button>
                      )}
                      {!isAuthor && (
                        <Button
                          variant="ghost"
                          className={`${actionClass} ml-auto`}
                          onClick={() => setReport({ type: 'forum reply', id: forumReplyTargetId(thread.id, reply.id) })}
                        >
                          <Flag className="size-4" aria-hidden="true" /> Báo cáo
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        }

        <NavPagination page={page} totalPages={pages} onPageChange={p => goToPage(p)} />
      </section>

      <section ref={composerRef} aria-labelledby="composer-heading" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <h3 id="composer-heading" className="mb-3 text-base font-semibold text-slate-800">
          Viết trả lời
        </h3>
        {!mayWrite ?
          <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Lock className="size-4" aria-hidden="true" /> Chủ đề đã bị khóa, không thể trả lời thêm.
          </p>
        : <div className="space-y-3">
            {quoting && (
              <div className="flex items-start gap-2 rounded-xl border-l-4 border-emerald-300 bg-emerald-50/60 px-3 py-2 text-sm">
                <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-emerald-800">
                    Trích dẫn {displayName(identities[quoting.authorId])} (#{quoting.position})
                  </div>
                  <p className="line-clamp-2 text-slate-600">{quoting.body}</p>
                </div>
                <button type="button" onClick={() => setQuoting(null)} className="rounded p-1 text-slate-500 hover:bg-emerald-100" aria-label="Bỏ trích dẫn">
                  <X className="size-4" />
                </button>
              </div>
            )}
            <MarkdownEditor value={draft} onChange={setDraft} rows={6} placeholder="Chia sẻ ý kiến của bạn… (hỗ trợ Markdown)" />
            {draft.length > BODY_MAX && <p className="text-xs text-red-600">Nội dung quá dài (tối đa {BODY_MAX} ký tự).</p>}
            <div className="flex justify-end">
              <Button onClick={postReply} disabled={!draft.trim() || draft.length > BODY_MAX || posting} className="rounded-xl">
                <Reply className="mr-1.5 size-4" aria-hidden="true" />
                {posting ? 'Đang gửi…' : 'Gửi trả lời'}
              </Button>
            </div>
          </div>
        }
      </section>

      <ThreadEditorDialog
        open={editingThread}
        onOpenChange={setEditingThread}
        mode="edit"
        initial={{ title: thread.title, body: thread.body }}
        onSubmit={saveThreadEdit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
        title={pendingDelete?.kind === 'thread' ? 'Xóa chủ đề này?' : 'Xóa câu trả lời này?'}
        description={
          pendingDelete?.kind === 'thread' ?
            'Chủ đề và toàn bộ câu trả lời sẽ bị xóa vĩnh viễn.'
          : 'Câu trả lời sẽ bị xóa vĩnh viễn.'
        }
        busy={deleting}
        onConfirm={confirmDelete}
      />

      {currUser && report && (
        <ReportDialog
          key={`${report.type}:${report.id}`}
          open
          onOpenChange={open => !open && setReport(null)}
          targetType={report.type}
          targetId={report.id}
          userId={currUser.id}
        />
      )}
    </div>
  );
}
