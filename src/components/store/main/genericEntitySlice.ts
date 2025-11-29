import { createSlice, Draft, PayloadAction } from '@reduxjs/toolkit';

// Constraint that T must have an 'id' field
export interface WithId {
	id: string;
}

interface GenericEntityState<T extends WithId> {
	current: T | null;
}

export function createEntitySlice<T extends WithId>(name: string) {
	const initialState: GenericEntityState<T> = { current: null };

	const slice = createSlice({
		name,
		initialState,
		reducers: {
			// Set the entity
			setEntity: (state, action: PayloadAction<T>) => {
				state.current = action.payload as Draft<T>;
			},
			// Partial update
			updateEntity: (state, action: PayloadAction<Partial<T>>) => {
				if (state.current) {
					state.current = { ...state.current, ...action.payload };
				}
			},
			// Clear the entity
			clearEntity: (state) => {
				state.current = null;
			},
		},
	});

	return slice;
}
