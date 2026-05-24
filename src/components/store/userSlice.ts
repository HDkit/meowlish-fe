import { User } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const users: User[] = [];

const usersSlice = createGenericSlice<User>('users', users);

export const {
	addItem: addUser,
	updateItem: updateUser,
	removeItem: removeUser,
	setList: setUsers,
} = usersSlice.actions;
export default usersSlice.reducer;
