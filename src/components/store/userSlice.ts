import { User } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const users: User[] = [
	{
		id: 'u1',
		email: 'alice@example.com',
		password: 'password123',
		fullName: 'Alice Johnson',
		createdAt: new Date('2025-01-01').getTime(),
	},
	{
		id: 'u2',
		email: 'bob@example.com',
		password: 'secret456',
		fullName: 'Bob Smith',
		createdAt: new Date('2025-02-15').getTime(),
	},
];

const usersSlice = createGenericSlice<User>('users', users);

export const {
	addItem: addUser,
	updateItem: updateUser,
	removeItem: removeUser,
	setList: setUsers,
} = usersSlice.actions;
export default usersSlice.reducer;
