import { useAppSelector } from '../store/hooks';
import { useMemo } from 'react';

export function useAuth() {
	const currUser = useAppSelector(state => state.currUser.current);
	const roles = useAppSelector(state => state.roles.list);
	const permissions = useAppSelector(state => state.permissions.list);

	// Derive role name directly from roleId — no dependency on roles.list being hydrated
	const roleIdToName = (roleId: string | undefined): string | null => {
		if (!roleId) return null;
		if (roleId === 'role-learner') return 'learner';
		if (roleId === 'role-staff') return 'staff';
		if (roleId === 'role-head-staff') return 'head_staff';
		// Fallback: try to find in roles slice
		return roles.find(r => r.id === roleId)?.name ?? null;
	};

	const userRole = useMemo(() => {
		if (!currUser) return null;
		return roles.find(r => r.id === currUser.roleId) ?? null;
	}, [currUser, roles]);

	const roleName = roleIdToName(currUser?.roleId ?? undefined);

	const isAuthenticated = !!currUser;
	const isLearner = roleName === 'learner';
	const isStaff = roleName === 'staff';
	const isHeadStaff = roleName === 'head_staff';
	const isAdmin = isStaff || isHeadStaff;

	const userPermissions = useMemo(() => {
		if (!currUser) return [];
		const roleId = currUser.roleId;
		return permissions.filter(p => p.roleId === roleId);
	}, [currUser, permissions]);

	const hasPermission = (resource: string, action: string) =>
		userPermissions.some(p => p.resource === resource && p.action === action);

	const canApproveExams = useMemo(() =>
		hasPermission('exam', 'approve') || isHeadStaff,
		[userPermissions, isHeadStaff]
	);

	const canManageUsers = useMemo(() =>
		hasPermission('user', 'update') || isHeadStaff,
		[userPermissions, isHeadStaff]
	);

	return {
		currUser,
		userRole,
		userPermissions,
		isAuthenticated,
		isLearner,
		isStaff,
		isHeadStaff,
		isAdmin,
		hasPermission,
		canApproveExams,
		canManageUsers,
	};
}
