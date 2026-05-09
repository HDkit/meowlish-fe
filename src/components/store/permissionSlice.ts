import { Permission } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

// Seed initial permissions
const permissions: Permission[] = [
	// Learner permissions
	{ id: 'perm-1', roleId: 'role-learner', resource: 'exam', action: 'read' },

	// Mod permissions (exam:write, exam:review, user:lock)
	{ id: 'perm-mod-1', roleId: 'role-mod', resource: 'exam', action: 'create' },
	{ id: 'perm-mod-2', roleId: 'role-mod', resource: 'exam', action: 'update' },
	{ id: 'perm-mod-3', roleId: 'role-mod', resource: 'exam', action: 'read' },
	{ id: 'perm-mod-4', roleId: 'role-mod', resource: 'exam', action: 'approve' },
	{ id: 'perm-mod-5', roleId: 'role-mod', resource: 'user', action: 'update' },
	
	// Staff permissions
	{ id: 'perm-2', roleId: 'role-staff', resource: 'exam', action: 'create' },
	{ id: 'perm-3', roleId: 'role-staff', resource: 'exam', action: 'update' },
	{ id: 'perm-4', roleId: 'role-staff', resource: 'exam', action: 'read' },
	
	// Head Staff permissions (all of staff + approve + user management)
	{ id: 'perm-5', roleId: 'role-head-staff', resource: 'exam', action: 'create' },
	{ id: 'perm-6', roleId: 'role-head-staff', resource: 'exam', action: 'update' },
	{ id: 'perm-7', roleId: 'role-head-staff', resource: 'exam', action: 'read' },
	{ id: 'perm-8', roleId: 'role-head-staff', resource: 'exam', action: 'approve' },
	{ id: 'perm-9', roleId: 'role-head-staff', resource: 'exam', action: 'delete' },
	{ id: 'perm-10', roleId: 'role-head-staff', resource: 'user', action: 'create' },
	{ id: 'perm-11', roleId: 'role-head-staff', resource: 'user', action: 'update' },
	{ id: 'perm-12', roleId: 'role-head-staff', resource: 'user', action: 'delete' },
];

const permissionsSlice = createGenericSlice<Permission>('permissions', permissions);

export const {
	addItem: addPermission,
	updateItem: updatePermission,
	removeItem: removePermission,
	setList: setPermissions,
} = permissionsSlice.actions;

export default permissionsSlice.reducer;
