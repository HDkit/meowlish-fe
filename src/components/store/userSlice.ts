import { User } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const users: User[] = [
	{
		id: 'u1',
		email: 'alice@example.com',
		password: 'password123',
		fullName: 'Alice Johnson',
		roleId: 'role-staff', // Staff role
		status: 'active',
		createdAt: new Date('2025-01-01').getTime(),
		lastLoginAt: Date.now(),
	},
	{
		id: 'u2',
		email: 'bob@example.com',
		password: 'secret456',
		fullName: 'Bob Smith',
		roleId: 'role-learner', // Learner role
		status: 'active',
		createdAt: new Date('2025-02-15').getTime(),
	},
	// Add initial head staff user
	{
		id: 'u-head-staff',
		email: 'admin@englishprep.com',
		password: 'admin123',
		fullName: 'Head Staff Admin',
		roleId: 'role-head-staff',
		status: 'active',
		createdAt: new Date('2025-01-01').getTime(),
		lastLoginAt: Date.now(),
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
