import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage

import goalsReducer from './goalSlice';
import userReducer from './userSlice'; // <-- your new user slice

// Persist configuration
const persistConfig = {
	key: 'root',
	storage,
	whitelist: ['user', 'goals'], // only persist these slices
};

// Combine reducers
const rootReducer = combineReducers({
	goals: goalsReducer,
	user: userReducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false, // required for redux-persist
		}),
});

// Persistor for <PersistGate>
export const persistor = persistStore(store);

// Types for TS
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
