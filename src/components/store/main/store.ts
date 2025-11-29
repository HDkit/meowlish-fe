import { configureStore, combineReducers, Reducer } from '@reduxjs/toolkit';
import { createTransform, persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage

import attemptsReducer from '../attemptSlice';
import blogsReducer from '../blogSlice';
import commentsReducer from '../commentSlice';
import currUserReducer from '../currUserSlice';
import examsReducer from '../examSlice';
import flashCardsReducer from '../flashCardSlice';
import goalsReducer from '../goalSlice';
import notesReducer from '../noteSlice';
import questionsReducer from '../questionSlice';
import repliesReducer from '../replySlice';
import reportsReducer from '../reportSlice';
import sectionsReducer from '../sectionSlice';
import tagsReducer from '../tagSlice';
import usersReducer from '../userSlice';

// Persist configuration
const persistConfig = {
	key: 'root',
	storage,
	whitelist: [
		'users',
		'goals',
		'currUser',
		'exams',
		'questions',
		'flashCards',
		'attempts',
		'notes',
		'reports',
		'tags',
		'sections',
		'comments',
		'replies',
		'blogs',
	],
};

// Combine reducers
const rootReducer = combineReducers({
	users: usersReducer,
	goals: goalsReducer,
	exams: examsReducer,
	currUser: currUserReducer,
	questions: questionsReducer,
	flashCards: flashCardsReducer,
	attempts: attemptsReducer,
	notes: notesReducer,
	reports: reportsReducer,
	tags: tagsReducer,
	sections: sectionsReducer,
	comments: commentsReducer,
	replies: repliesReducer,
	blogs: blogsReducer,
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
