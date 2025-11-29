import { configureStore } from '@reduxjs/toolkit';
import goalsReducer from './goalSlice';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage

import { combineReducers } from 'redux';

const persistConfig = {
	key: 'root',
	storage,
};

const rootReducer = combineReducers({
	goals: goalsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false, // required for redux-persist
		}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
