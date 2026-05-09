import { configureStore, combineReducers, Reducer } from '@reduxjs/toolkit';
import { createTransform, persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage

import attemptsReducer from '../attemptSlice';
import blogsReducer from '../blogSlice';
import chatMessagesReducer from '../chatMessageSlice';
import chatRoomsReducer from '../chatRoomSlice';
import commentsReducer from '../commentSlice';
import currUserReducer from '../currUserSlice';
import examsReducer from '../examSlice';
import flashCardsReducer from '../flashCardSlice';
import flashcardListsReducer from '../flashcardListSlice';
import goalsReducer from '../goalSlice';
import notesReducer from '../noteSlice';
import notificationsReducer from '../notificationSlice';
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
		'flashcardLists',
		'attempts',
		'notes',
		'reports',
		'tags',
		'sections',
		'comments',
		'replies',
		'blogs',
		'notifications',
		'chatRooms',
		'chatMessages',
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
	notifications: notificationsReducer,
	chatRooms: chatRoomsReducer,
	chatMessages: chatMessagesReducer,
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
