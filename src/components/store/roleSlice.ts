import { Role } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const roles: Role[] = [];

const rolesSlice = createGenericSlice<Role>('roles', roles);

export const {
	addItem: addRole,
	updateItem: updateRole,
	removeItem: removeRole,
	setList: setRoles,
} = rolesSlice.actions;

export default rolesSlice.reducer;
