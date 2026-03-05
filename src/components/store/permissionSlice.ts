import { Permission } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

// Seed initial permissions
const permissions: Permission[] = [
	// Learner permissions
	{ id: 'perm-1', roleId: 'role-learner', resource: 'exam', action: 'read' },
	
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
