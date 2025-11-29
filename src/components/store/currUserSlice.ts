import { User } from '../../types/client';
import { createEntitySlice } from './main/genericEntitySlice';

const currUserSlice = createEntitySlice<User>('user');

export const { setEntity: setUser, updateEntity: updateUser, clearEntity: clearUser } = currUserSlice.actions;
export default currUserSlice.reducer;
