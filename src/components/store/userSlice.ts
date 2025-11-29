// store/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Your User type
export interface User {
	id: string;
	email: string;
	fullName: string;
	createdAt: Date;
}

// Define the initial state
interface UserState {
	currentUser: User | null;
}

const initialState: UserState = {
	currentUser: null,
};

const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		// Set user info (login)
		setUser(state, action: PayloadAction<User>) {
			state.currentUser = action.payload;
		},
		// Update user info partially
		updateUser(state, action: PayloadAction<Partial<User>>) {
			if (state.currentUser) {
				state.currentUser = { ...state.currentUser, ...action.payload };
			}
		},
		// Clear user info (logout)
		clearUser(state) {
			state.currentUser = null;
		},
	},
});

// Export actions
export const { setUser, updateUser, clearUser } = userSlice.actions;

// Export reducer to add to the store
export default userSlice.reducer;
