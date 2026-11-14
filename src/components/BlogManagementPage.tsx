'use client';

import { AuthorFilter, type AuthorSelection } from './admin/AuthorFilter';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, ExternalLink, Loader2, Newspaper, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { BlogService, type BlogResponse } from '@/lib/api/services/BlogService';
import { invalidateBlogTags, useBlogTags } from '@/lib/blog-tags';
import { useToast } from '@/components/ui/use-toast';
import { normalizeApiError } from '@/lib/api-errors';
import { formatDate, matchesSearch } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FieldError, FormErrorSummary, fieldA11y } from '@/components/ui/form-feedback';
import { MarkdownEditor } from './MarkdownEditor';
import {
	AccessDenied,
	AdminFilterSelect,
	AdminPageHeader,
	AdminPagination,
	AdminSearchInput,
	AdminToolbar,
	ConfirmDialog,
	DataTable,
	RowActions,
	StatusBadge,
	useIdentityNames,
	type DataColumn,
	IdentityNameText,
} from './admin';

const PAGE_SIZE = 20;

type BlogFormData = { title: string; content: string; tags: string[] };
type ViewMode = { type: 'list' } | { type: 'create' } | { type: 'edit'; blog: BlogResponse };

const excerpt = (markdown: string) =>
	markdown
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[#*_~`>|-]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 140);

export default function BlogManagementPage() {
	const router = useRouter();
	const { currUser, isMod, isStaff, isHeadStaff } = useAuth();
	const { toast } = useToast();
	const allowed = Boolean(currUser) && (isStaff || isHeadStaff || isMod);

	const [blogs, setBlogs] = useState<BlogResponse[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string[]>([]);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [tagFilter, setTagFilter] = useState('all');
	const serverTags = useBlogTags();
	const knownTags = useMemo(() => [...(serverTags ?? [])].sort((a, b) => a.localeCompare(b)), [serverTags]);
	// Only admins may edit other people's posts, so everyone else manages their own; admins can
	// narrow the list to one author (server-side, across all pages).
	const [author, setAuthor] = useState<AuthorSelection>(null);
	const authorId = !isHeadStaff ? currUser?.id : author?.id;

	const [viewMode, setViewMode] = useState<ViewMode>({ type: 'list' });
	const [toDelete, setToDelete] = useState<BlogResponse | null>(null);

	useEffect(() => setPage(1), [tagFilter, author]);

	const fetchBlogs = useCallback(async () => {
		if (!allowed || !currUser) return;
		setLoading(true);
		setLoadError([]);
		try {
			const res = await BlogService.listBlogs(
				authorId,
				page,
				PAGE_SIZE,
				tagFilter === 'all' ? undefined : [tagFilter],
			);
			const data = ((res as { data?: unknown }).data ?? res) as { blogs?: BlogResponse[]; totalCount?: number };
			const list = data.blogs ?? [];
			setBlogs(list);
			setTotalCount(data.totalCount ?? list.length);
		} catch (err) {
			setBlogs([]);
			setLoadError(normalizeApiError(err, { fallback: 'Không thể tải danh sách bài viết' }).messages);
		} finally {
			setLoading(false);
		}
	}, [allowed, currUser, authorId, page, tagFilter]);

	useEffect(() => {
		void fetchBlogs();
	}, [fetchBlogs]);

	const names = useIdentityNames(blogs.map((b) => b.authorId));
	const visible = useMemo(() => blogs.filter((b) => matchesSearch(search, b.title, b.content)), [blogs, search]);

	if (!allowed) return <AccessDenied description="Trang này dành cho người viết bài và quản trị viên." />;

	if (viewMode.type !== 'list') {
		return (
			<BlogEditor
				blog={viewMode.type === 'edit' ? viewMode.blog : undefined}
				onCancel={() => setViewMode({ type: 'list' })}
				onSaved={() => {
					setViewMode({ type: 'list' });
					void fetchBlogs();
				}}
				authorId={currUser!.id}
			/>
		);
	}

	const remove = async (blog: BlogResponse) => {
		await BlogService.deleteBlog(blog.id);
		invalidateBlogTags();
		toast({ title: 'Đã xóa bài viết', description: blog.title });
		void fetchBlogs();
	};

	const canModify = (b: BlogResponse) => isHeadStaff || b.authorId === currUser?.id;
	const hasFilters = Boolean(search) || tagFilter !== 'all' || Boolean(author);

	const columns: DataColumn<BlogResponse>[] = [
		{
			id: 'title',
			header: 'Bài viết',
			cell: (b) => (
				<div className="min-w-0 max-w-xl">
					<p className="line-clamp-1 font-medium text-foreground [overflow-wrap:anywhere]">{b.title}</p>
					<p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">{excerpt(b.content)}</p>
				</div>
			),
		},
		{
			id: 'tags',
			header: 'Nhãn',
			className: 'hidden lg:table-cell',
			cell: (b) =>
				(b.tags ?? []).length === 0 ? (
					<span className="text-muted-foreground">—</span>
				) : (
					<div className="flex max-w-56 flex-wrap gap-1">
						{b.tags.slice(0, 3).map((t) => (
							<StatusBadge key={t} dot={false}>
								{t}
							</StatusBadge>
						))}
						{b.tags.length > 3 && <span className="text-xs text-muted-foreground">+{b.tags.length - 3}</span>}
					</div>
				),
		},
		{
			id: 'author',
			header: 'Tác giả',
			className: 'whitespace-nowrap',
			cell: (b) => (
				<span className="text-muted-foreground">{b.authorId === currUser?.id ? 'Bạn' : <IdentityNameText id={b.authorId} names={names} />}</span>
			),
		},
		{
			id: 'created',
			header: 'Ngày đăng',
			className: 'hidden md:table-cell whitespace-nowrap',
			cell: (b) => <span className="tabular-nums text-muted-foreground">{formatDate(b.createdAt)}</span>,
		},
	];

	return (
		<div className="space-y-5">
			<AdminPageHeader
				icon={Newspaper}
				title="Quản lý bài viết"
				description={isHeadStaff ? 'Viết, sửa và gỡ bài viết trên blog.' : 'Viết và sửa các bài viết của bạn trên blog.'}
				actions={
					<>
						<Button variant="outline" size="sm" onClick={() => void fetchBlogs()} disabled={loading}>
							<RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
							Làm mới
						</Button>
						<Button size="sm" onClick={() => setViewMode({ type: 'create' })}>
							<Plus className="mr-1.5 h-4 w-4" />
							Viết bài mới
						</Button>
					</>
				}
			/>

			<AdminToolbar summary={!(loading && blogs.length === 0) && `${totalCount} bài viết`}>
				<AdminSearchInput value={search} onChange={setSearch} placeholder="Lọc trang này theo tiêu đề, nội dung…" />
				<AdminFilterSelect
					label="Nhãn"
					value={tagFilter}
					onChange={setTagFilter}
					options={[
						{ value: 'all', label: 'Mọi nhãn' },
						...[...new Set([...knownTags, ...(tagFilter === 'all' ? [] : [tagFilter])])].map((t) => ({ value: t, label: t })),
					]}
				/>
				{isHeadStaff && currUser && (
					<AuthorFilter
						value={author}
						onChange={setAuthor}
						currentUser={{ id: currUser.id, name: currUser.fullName || 'Bạn' }}
					/>
				)}
				{hasFilters && (
					<Button variant="ghost" size="sm" onClick={() => { setSearch(''); setTagFilter('all'); setAuthor(null); }}>
						<X className="mr-1 h-4 w-4" />
						Xóa lọc
					</Button>
				)}
			</AdminToolbar>

			<DataTable
				caption="Danh sách bài viết"
				columns={columns}
				rows={visible}
				rowKey={(b) => b.id}
				loading={loading}
				error={loadError}
				onRetry={() => void fetchBlogs()}
				onRowClick={(b) => (canModify(b) ? setViewMode({ type: 'edit', blog: b }) : router.push(`/blog/${b.id}`))}
				empty={
					search && blogs.length > 0
						? { icon: Search, title: 'Không có bài viết phù hợp trong trang này' }
						: hasFilters
							? { icon: Newspaper, title: 'Không có bài viết với nhãn này' }
							: {
									icon: Newspaper,
									title: 'Chưa có bài viết nào',
									description: 'Bài viết sẽ hiển thị trên trang Blog cho mọi người dùng.',
									action: (
										<Button size="sm" onClick={() => setViewMode({ type: 'create' })}>
											<Plus className="mr-1.5 h-4 w-4" />
											Viết bài mới
										</Button>
									),
								}
				}
				rowActions={(b) => (
					<RowActions
						label={b.title}
						actions={[
							{ label: 'Xem trên blog', icon: ExternalLink, onSelect: () => router.push(`/blog/${b.id}`) },
							{ label: 'Chỉnh sửa', icon: Edit, hidden: !canModify(b), onSelect: () => setViewMode({ type: 'edit', blog: b }) },
							{ label: 'Xóa bài viết', icon: Trash2, destructive: true, hidden: !canModify(b), onSelect: () => setToDelete(b) },
						]}
					/>
				)}
			/>

			<AdminPagination page={page} pageSize={PAGE_SIZE} total={totalCount} onPageChange={setPage} itemLabel="bài viết" />

			<ConfirmDialog
				open={Boolean(toDelete)}
				onOpenChange={(o) => !o && setToDelete(null)}
				destructive
				title="Xóa bài viết?"
				description={toDelete ? `"${toDelete.title}" sẽ bị gỡ khỏi blog. Không thể hoàn tác.` : undefined}
				confirmLabel="Xóa bài viết"
				onConfirm={() => (toDelete ? remove(toDelete) : undefined)}
			/>
		</div>
	);
}

function BlogEditor({
	blog,
	authorId,
	onCancel,
	onSaved,
}: {
	blog?: BlogResponse;
	authorId: string;
	onCancel: () => void;
	onSaved: () => void;
}) {
	const { toast } = useToast();
	const [form, setForm] = useState<BlogFormData>({
		title: blog?.title ?? '',
		content: blog?.content ?? '',
		tags: blog?.tags ?? [],
	});
	const [fieldErrors, setFieldErrors] = useState<Partial<Record<'title' | 'content' | 'tags', string>>>({});
	const [formErrors, setFormErrors] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);
	const isEdit = Boolean(blog);

	const set = <K extends keyof BlogFormData>(key: K, value: BlogFormData[K]) => {
		setForm((p) => ({ ...p, [key]: value }));
		if (fieldErrors[key]) setFieldErrors(({ [key]: _, ...rest }) => rest);
	};

	const save = async () => {
		const missing: typeof fieldErrors = {};
		if (!form.title.trim()) missing.title = 'Vui lòng nhập tiêu đề';
		if (!form.content.trim()) missing.content = 'Vui lòng nhập nội dung bài viết';
		setFieldErrors(missing);
		setFormErrors([]);
		if (Object.keys(missing).length > 0) return;

		setSaving(true);
		try {
			if (blog) {
				await BlogService.updateBlog(blog.id, { title: form.title.trim(), content: form.content, tags: form.tags });
			} else {
				await BlogService.createBlog({
					title: form.title.trim(),
					content: form.content,
					authorId: authorId,
					tags: form.tags.length > 0 ? form.tags : undefined,
				});
			}
			invalidateBlogTags();
			toast({ title: isEdit ? 'Đã lưu bài viết' : 'Đã đăng bài viết' });
			onSaved();
		} catch (err) {
			const res = normalizeApiError(err, {
				fallback: isEdit ? 'Không thể lưu bài viết' : 'Không thể đăng bài viết',
				fields: { title: 'title', content: 'content', tags: 'tags' },
			});
			setFieldErrors(res.fieldErrors);
			setFormErrors(res.messages);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-5">
			<AdminPageHeader
				icon={Newspaper}
				title={isEdit ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
				description={isEdit ? blog?.title : 'Bài viết dùng Markdown và hiển thị trên trang Blog.'}
				actions={
					<>
						<Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
							<ArrowLeft className="mr-1.5 h-4 w-4" />
							Quay lại
						</Button>
						<Button size="sm" onClick={() => void save()} disabled={saving}>
							{saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
							{isEdit ? 'Lưu thay đổi' : 'Đăng bài'}
						</Button>
					</>
				}
			/>

			<div className="space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
				<FormErrorSummary messages={formErrors} />
				<div className="space-y-1.5">
					<Label htmlFor="blog-title">
						Tiêu đề <span className="text-destructive">*</span>
					</Label>
					<Input
						{...fieldA11y('blog-title', fieldErrors.title)}
						value={form.title}
						onChange={(e) => set('title', e.target.value)}
						placeholder="Nhập tiêu đề bài viết"
					/>
					<FieldError id="blog-title" message={fieldErrors.title} />
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="blog-tags">Nhãn</Label>
					<BlogTagInput tags={form.tags} onChange={(tags) => set('tags', tags)} />
					<FieldError id="blog-tags" message={fieldErrors.tags} />
				</div>
				<div className="space-y-1.5">
					<Label>
						Nội dung <span className="text-destructive">*</span>
					</Label>
					<MarkdownEditor
						value={form.content}
						onChange={(content) => set('content', content)}
						placeholder="Viết nội dung đầy đủ của bài viết tại đây..."
						rows={20}
					/>
					<FieldError id="blog-content" message={fieldErrors.content} />
				</div>
			</div>
		</div>
	);
}

function BlogTagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
	const [tagInput, setTagInput] = useState('');

	const addTag = () => {
		const t = tagInput.trim();
		if (t && !tags.includes(t)) onChange([...tags, t]);
		setTagInput('');
	};

	return (
		<div className="space-y-2">
			<div className="flex gap-2">
				<Input
					id="blog-tags"
					value={tagInput}
					onChange={(e) => setTagInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addTag();
						}
					}}
					placeholder="Nhập nhãn rồi nhấn Enter…"
					className="flex-1"
				/>
				<Button type="button" variant="outline" onClick={addTag} disabled={!tagInput.trim()}>
					<Plus className="mr-1 h-4 w-4" />
					Thêm
				</Button>
			</div>
			{tags.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{tags.map((tag) => (
						<Badge key={tag} variant="secondary" className="max-w-full gap-1">
							<span className="truncate">{tag}</span>
							<button
								type="button"
								aria-label={`Bỏ nhãn ${tag}`}
								onClick={() => onChange(tags.filter((t) => t !== tag))}
								className="ml-0.5 hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}
