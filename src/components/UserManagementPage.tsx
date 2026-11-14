'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Lock, Phone, RefreshCw, ShieldCheck, Unlock, UserCog, Users, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthService } from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import { normalizeApiError } from '@/lib/api-errors';
import { asQueryArray, initials, roleLabel, roleTone } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormErrorSummary } from '@/components/ui/form-feedback';
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
	type DataColumn,
} from './admin';

const PAGE_SIZE = 20;

type IdentityUser = {
	id: string;
	username: string;
	fullName?: string;
	phoneNumber?: string;
	/** Role names ("admin", "mod", …). */
	roles: string[];
	permissions: string[];
	isLocked?: boolean;
};

type RoleInfo = { id: string; name: string; permissions: string[] };

type SearchMode = 'name' | 'phone';

type Confirm =
	| { kind: 'lock'; user: IdentityUser }
	| { kind: 'remove-role'; user: IdentityUser; role: string }
	| null;

export default function UserManagementPage() {
	const { currUser, isHeadStaff } = useAuth();
	const { toast } = useToast();
	// GET /auth/identities and /auth/roles are admin-only (Role.Admin == the "head staff" UI role).
	const allowed = Boolean(currUser) && isHeadStaff;

	const [roles, setRoles] = useState<RoleInfo[]>([]);
	const [users, setUsers] = useState<IdentityUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string[]>([]);

	const [searchMode, setSearchMode] = useState<SearchMode>('name');
	const [searchInput, setSearchInput] = useState('');
	const [query, setQuery] = useState('');
	const [roleFilter, setRoleFilter] = useState('all');
	// Cursor stack: cursors[i] loads page i (undefined = first page).
	const [cursors, setCursors] = useState<Array<string | undefined>>([undefined]);
	const [nextCursor, setNextCursor] = useState<string | undefined>();

	const [roleDialogUser, setRoleDialogUser] = useState<IdentityUser | null>(null);
	const [confirm, setConfirm] = useState<Confirm>(null);

	const page = cursors.length - 1;

	// Debounce the name search; the phone search runs on Enter (it needs a full-ish number).
	useEffect(() => {
		if (searchMode !== 'name') return;
		const t = setTimeout(() => setQuery(searchInput.trim()), 350);
		return () => clearTimeout(t);
	}, [searchInput, searchMode]);

	// A new query or filter starts from the first page.
	useEffect(() => {
		setCursors([undefined]);
	}, [query, roleFilter, searchMode]);

	useEffect(() => {
		if (!allowed) return;
		AuthService.authGatewayControllerGetRoleListV1()
			.then((res: any) => {
				const list = res?.data?.roles;
				setRoles(Array.isArray(list) ? list : list ? [list] : []);
			})
			.catch((err) => console.warn('UserManagement: roles failed', err));
	}, [allowed]);

	const cursor = cursors[cursors.length - 1];
	const fetchUsers = useCallback(async () => {
		if (!allowed) return;
		setLoading(true);
		setLoadError([]);
		try {
			const res: any =
				searchMode === 'phone' && query
					? await AuthService.authGatewayControllerFindIdentitiesByPhoneV1(query, cursor, PAGE_SIZE)
					: await AuthService.authGatewayControllerFindIdentitiesV1(
							query || undefined,
							undefined,
							roleFilter === 'all' ? undefined : asQueryArray([roleFilter]),
							cursor,
							PAGE_SIZE,
						);
			const list: IdentityUser[] = res?.data?.identities ?? [];
			setUsers(list);
			// The backend always returns a next cursor; a short page means there is no next page.
			setNextCursor(list.length === PAGE_SIZE ? res?.data?.nextCursor || undefined : undefined);
		} catch (err) {
			setUsers([]);
			setLoadError(normalizeApiError(err, { fallback: 'Không thể tải danh sách người dùng' }).messages);
		} finally {
			setLoading(false);
		}
	}, [allowed, searchMode, query, roleFilter, cursor]);

	useEffect(() => {
		void fetchUsers();
	}, [fetchUsers]);

	const roleIdByName = useMemo(() => new Map(roles.map((r) => [r.name, r.id])), [roles]);

	const patchUser = (id: string, patch: (u: IdentityUser) => IdentityUser) => {
		setUsers((prev) => prev.map((u) => (u.id === id ? patch(u) : u)));
		setRoleDialogUser((u) => (u && u.id === id ? patch(u) : u));
	};

	const assignRole = async (user: IdentityUser, roleName: string) => {
		const roleId = roleIdByName.get(roleName);
		if (!roleId) throw new Error('Không tìm thấy vai trò này');
		await AuthService.authGatewayControllerAssignRoleToV1(user.id, { roleId: roleId });
		patchUser(user.id, (u) => ({ ...u, roles: [...u.roles, roleName] }));
		toast({ title: 'Đã gán vai trò', description: `${roleLabel(roleName)} cho ${user.username}. Người dùng cần đăng nhập lại.` });
	};

	// Identities list role NAMES, but the endpoint takes the role ID.
	const removeRole = async (user: IdentityUser, roleName: string) => {
		const roleId = roleIdByName.get(roleName);
		if (!roleId) throw new Error('Không tìm thấy vai trò này');
		await AuthService.authGatewayControllerRemoveRoleFromV1(user.id, { roleId: roleId });
		patchUser(user.id, (u) => ({ ...u, roles: u.roles.filter((r) => r !== roleName) }));
		toast({ title: 'Đã gỡ vai trò', description: `${roleLabel(roleName)} khỏi ${user.username}.` });
	};

	const toggleLock = async (user: IdentityUser) => {
		if (user.isLocked) await AuthService.authGatewayControllerUnlockIdentityV1(user.id);
		else await AuthService.authGatewayControllerLockIdentityV1(user.id);
		patchUser(user.id, (u) => ({ ...u, isLocked: !u.isLocked }));
		toast({ title: user.isLocked ? `Đã mở khóa ${user.username}` : `Đã khóa ${user.username}` });
	};

	if (!allowed) {
		return <AccessDenied description="Chỉ quản trị viên mới quản lý được người dùng và vai trò." />;
	}

	const isSelf = (u: IdentityUser) => u.id === currUser?.id;

	const columns: DataColumn<IdentityUser>[] = [
		{
			id: 'user',
			header: 'Người dùng',
			cell: (u) => (
				<div className="flex min-w-0 items-center gap-3">
					<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
						{initials(u.fullName || u.username)}
					</span>
					<div className="min-w-0">
						<p className="truncate font-medium text-foreground">
							{u.fullName || u.username}
							{isSelf(u) && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(bạn)</span>}
						</p>
						<p className="truncate text-xs text-muted-foreground">@{u.username}</p>
					</div>
				</div>
			),
		},
		{
			id: 'roles',
			header: 'Vai trò',
			cell: (u) =>
				u.roles.length === 0 ? (
					<span className="text-muted-foreground">—</span>
				) : (
					<div className="flex flex-wrap gap-1">
						{u.roles.map((r) => (
							<StatusBadge key={r} tone={roleTone(r)} dot={false}>
								{roleLabel(r)}
							</StatusBadge>
						))}
					</div>
				),
		},
		{
			id: 'phone',
			header: 'Số điện thoại',
			className: 'hidden lg:table-cell',
			cell: (u) => <span className="tabular-nums text-muted-foreground">{u.phoneNumber || '—'}</span>,
		},
		{
			id: 'permissions',
			header: 'Quyền',
			className: 'hidden xl:table-cell',
			cell: (u) => <span className="text-muted-foreground">{u.permissions?.length ?? 0} quyền</span>,
		},
		{
			id: 'status',
			header: 'Trạng thái',
			cell: (u) =>
				u.isLocked ? <StatusBadge tone="danger">Đã khóa</StatusBadge> : <StatusBadge tone="success">Hoạt động</StatusBadge>,
		},
	];

	const searchLabel = searchMode === 'phone' ? 'Số điện thoại (nhấn Enter)' : 'Tên đăng nhập, email hoặc ID';
	const filtered = Boolean(query) || roleFilter !== 'all';

	return (
		<div className="space-y-5">
			<AdminPageHeader
				icon={Users}
				title="Quản lý người dùng"
				description="Tìm tài khoản, gán hoặc gỡ vai trò và khóa tài khoản vi phạm."
				actions={
					<Button variant="outline" size="sm" onClick={() => void fetchUsers()} disabled={loading}>
						<RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
						Làm mới
					</Button>
				}
			/>

			<AdminToolbar
				summary={!(loading && users.length === 0) && loadError.length === 0 ? `Trang ${page + 1} · ${users.length} người dùng` : undefined}
			>
				<AdminFilterSelect
					label="Tìm theo"
					value={searchMode}
					onChange={(v) => {
						setSearchMode(v as SearchMode);
						setSearchInput('');
						setQuery('');
					}}
					options={[
						{ value: 'name', label: 'Tìm theo tên / email' },
						{ value: 'phone', label: 'Tìm theo số điện thoại' },
					]}
				/>
				<AdminSearchInput
					value={searchInput}
					onChange={(v) => {
						setSearchInput(v);
						if (searchMode === 'phone' && !v) setQuery('');
					}}
					onSubmit={() => setQuery(searchInput.trim())}
					placeholder={searchLabel}
				/>
				{searchMode === 'name' && (
					<AdminFilterSelect
						label="Vai trò"
						value={roleFilter}
						onChange={setRoleFilter}
						options={[{ value: 'all', label: 'Mọi vai trò' }, ...roles.map((r) => ({ value: r.name, label: roleLabel(r.name) }))]}
					/>
				)}
				{filtered && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setSearchInput('');
							setQuery('');
							setRoleFilter('all');
						}}
					>
						<X className="mr-1 h-4 w-4" />
						Xóa lọc
					</Button>
				)}
			</AdminToolbar>

			<DataTable
				caption="Danh sách người dùng"
				columns={columns}
				rows={users}
				rowKey={(u) => u.id}
				loading={loading}
				error={loadError}
				onRetry={() => void fetchUsers()}
				empty={{
					icon: searchMode === 'phone' ? Phone : Users,
					title: filtered ? 'Không có người dùng phù hợp' : 'Chưa có người dùng',
					description: filtered ? 'Thử từ khóa khác hoặc bỏ bộ lọc vai trò.' : undefined,
				}}
				rowActions={(u) => (
					<RowActions
						label={u.username}
						actions={[
							{ label: 'Quản lý vai trò', icon: UserCog, onSelect: () => setRoleDialogUser(u), disabled: isSelf(u) },
							{
								label: u.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản',
								icon: u.isLocked ? Unlock : Lock,
								destructive: !u.isLocked,
								disabled: isSelf(u),
								onSelect: () => setConfirm({ kind: 'lock', user: u }),
							},
						]}
					/>
				)}
			/>

			<AdminPagination
				hasPrev={page > 0}
				hasNext={Boolean(nextCursor)}
				disabled={loading}
				label={`Trang ${page + 1}`}
				onPrev={() => setCursors((c) => (c.length > 1 ? c.slice(0, -1) : c))}
				onNext={() => nextCursor && setCursors((c) => [...c, nextCursor])}
			/>

			<RoleDialog
				user={roleDialogUser}
				roles={roles}
				onClose={() => setRoleDialogUser(null)}
				onAssign={assignRole}
				onRequestRemove={(user, role) => setConfirm({ kind: 'remove-role', user: user, role: role })}
			/>

			<ConfirmDialog
				open={confirm?.kind === 'lock'}
				onOpenChange={(o) => !o && setConfirm(null)}
				destructive={confirm?.kind === 'lock' && !confirm.user.isLocked}
				title={confirm?.kind === 'lock' && confirm.user.isLocked ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
				description={
					confirm?.kind === 'lock'
						? confirm.user.isLocked
							? `"${confirm.user.username}" sẽ đăng nhập lại được.`
							: `"${confirm.user.username}" sẽ bị đăng xuất và không đăng nhập được cho tới khi được mở khóa.`
						: undefined
				}
				confirmLabel={confirm?.kind === 'lock' && confirm.user.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
				onConfirm={() => (confirm?.kind === 'lock' ? toggleLock(confirm.user) : undefined)}
			/>

			<ConfirmDialog
				open={confirm?.kind === 'remove-role'}
				onOpenChange={(o) => !o && setConfirm(null)}
				destructive
				title="Gỡ vai trò?"
				description={
					confirm?.kind === 'remove-role'
						? `Gỡ "${roleLabel(confirm.role)}" khỏi ${confirm.user.username}. Người dùng sẽ bị đăng xuất để áp dụng thay đổi.`
						: undefined
				}
				confirmLabel="Gỡ vai trò"
				onConfirm={() => (confirm?.kind === 'remove-role' ? removeRole(confirm.user, confirm.role) : undefined)}
			/>
		</div>
	);
}

function RoleDialog({
	user,
	roles,
	onClose,
	onAssign,
	onRequestRemove,
}: {
	user: IdentityUser | null;
	roles: RoleInfo[];
	onClose: () => void;
	onAssign: (user: IdentityUser, roleName: string) => Promise<void>;
	onRequestRemove: (user: IdentityUser, roleName: string) => void;
}) {
	const [selected, setSelected] = useState('');
	const [pending, setPending] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);

	useEffect(() => {
		setSelected('');
		setErrors([]);
	}, [user?.id]);

	const available = roles.filter((r) => !user?.roles.includes(r.name));

	const assign = async () => {
		if (!user || !selected) return;
		setPending(true);
		setErrors([]);
		try {
			await onAssign(user, selected);
			setSelected('');
		} catch (err) {
			setErrors(normalizeApiError(err, { fallback: 'Không thể gán vai trò' }).messages);
		} finally {
			setPending(false);
		}
	};

	return (
		<Dialog open={Boolean(user)} onOpenChange={(o) => !o && !pending && onClose()}>
			<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5 text-primary" />
						Vai trò của {user?.fullName || user?.username}
					</DialogTitle>
					<DialogDescription>
						Thay đổi vai trò sẽ đăng xuất người dùng để quyền mới có hiệu lực ngay.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2">
					<Label>Vai trò hiện tại</Label>
					{user && user.roles.length > 0 ? (
						<ul className="divide-y rounded-lg border">
							{user.roles.map((r) => (
								<li key={r} className="flex items-center justify-between gap-2 px-3 py-2">
									<StatusBadge tone={roleTone(r)} dot={false}>
										{roleLabel(r)}
									</StatusBadge>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
										onClick={() => onRequestRemove(user, r)}
									>
										Gỡ
									</Button>
								</li>
							))}
						</ul>
					) : (
						<p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">Chưa có vai trò nào.</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="assign-role">Thêm vai trò</Label>
					<div className="flex gap-2">
						<Select value={selected} onValueChange={setSelected} disabled={available.length === 0}>
							<SelectTrigger id="assign-role" className="flex-1">
								<SelectValue placeholder={available.length ? 'Chọn vai trò' : 'Đã có mọi vai trò'} />
							</SelectTrigger>
							<SelectContent>
								{available.map((r) => (
									<SelectItem key={r.id} value={r.name}>
										{roleLabel(r.name)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button onClick={() => void assign()} disabled={!selected || pending}>
							{pending ? 'Đang gán…' : 'Gán'}
						</Button>
					</div>
				</div>

				<FormErrorSummary messages={errors} />

				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={pending}>
						Đóng
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
