import { Permission } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const permissions: Permission[] = [];

const permissionsSlice = createGenericSlice<Permission>('permissions', permissions);

export const {
	addItem: addPermission,
	updateItem: updatePermission,
	removeItem: removePermission,
	setList: setPermissions,
} = permissionsSlice.actions;

export default permissionsSlice.reducer;
