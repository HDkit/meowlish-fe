import { Role } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

// Seed initial roles
const roles: Role[] = [
	{
		id: 'role-learner',
		name: 'learner',
		description: 'Students who take exams',
	},
	{
		id: 'role-staff',
		name: 'staff',
		description: 'Staff who create and manage exams',
	},
	{
		id: 'role-head-staff',
		name: 'head_staff',
		description: 'Head staff who approve exams and manage users',
	},
];

const rolesSlice = createGenericSlice<Role>('roles', roles);

export const {
	addItem: addRole,
	updateItem: updateRole,
	removeItem: removeRole,
	setList: setRoles,
} = rolesSlice.actions;

export default rolesSlice.reducer;
