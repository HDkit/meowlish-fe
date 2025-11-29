import { createSlice, Draft, PayloadAction } from '@reduxjs/toolkit';
import { MockDbType } from '../../../types/client';

interface GenericState<T extends MockDbType> {
	list: T[];
}

export function createGenericSlice<T extends MockDbType>(name: string, initialList: T[] = []) {
	const initialState: GenericState<T> = { list: initialList };

	const slice = createSlice({
		name,
		initialState,
		reducers: {
			addItem: (state, action: PayloadAction<T>) => {
				state.list.push(action.payload as Draft<T>);
			},
			updateItem: (state, action: PayloadAction<T>) => {
				const index = state.list.findIndex((item) => item.id === action.payload.id);
				if (index !== -1) state.list[index] = action.payload as Draft<T>;
			},
			removeItem: (state, action: PayloadAction<string>) => {
				state.list = state.list.filter((item) => item.id !== action.payload);
			},
			setList: (state, action: PayloadAction<T[]>) => {
				state.list = action.payload as Draft<T[]>;
			},
		},
	});

	return slice;
}
