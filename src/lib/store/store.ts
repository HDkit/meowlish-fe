'use client';

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import reducers (will be moved to lib/store/)
import attemptsReducer from '@/components/store/attemptSlice';
import blogsReducer from '@/components/store/blogSlice';
import commentsReducer from '@/components/store/commentSlice';
import currUserReducer from '@/components/store/currUserSlice';
import examsReducer from '@/components/store/examSlice';
import flashCardsReducer from '@/components/store/flashCardSlice';
import flashcardListsReducer from '@/components/store/flashcardListSlice';
import goalsReducer from '@/components/store/goalSlice';
import notesReducer from '@/components/store/noteSlice';
import questionsReducer from '@/components/store/questionSlice';
import repliesReducer from '@/components/store/replySlice';
import reportsReducer from '@/components/store/reportSlice';
import sectionsReducer from '@/components/store/sectionSlice';
import tagsReducer from '@/components/store/tagSlice';
import usersReducer from '@/components/store/userSlice';

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
		'flashcardLists',
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
	flashcardLists: flashcardListsReducer,
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

// Create store function (called per request/client)
export const makeStore = () => {
	return configureStore({
		reducer: persistedReducer,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				serializableCheck: {
					ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
				},
			}),
	});
};

// Types
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
