'use client';

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore, createMigrate, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
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
// NEW: Admin reducers
import rolesReducer from '@/components/store/roleSlice';
import permissionsReducer from '@/components/store/permissionSlice';
import sectionClosuresReducer from '@/components/store/sectionClosureSlice';
import filesReducer from '@/components/store/fileSlice';

// Seed users and roles that must always exist (merged with persisted data)
const REQUIRED_USERS = [
	{
		id: 'u-head-staff',
		email: 'admin@lingriser.com',
		password: 'admin123',
		fullName: 'Head Staff Admin',
		roleId: 'role-head-staff',
		status: 'active' as const,
		createdAt: new Date('2025-01-01').getTime(),
	},
	{
		id: 'u1',
		email: 'alice@example.com',
		password: 'password123',
		fullName: 'Alice Johnson',
		roleId: 'role-staff',
		status: 'active' as const,
		createdAt: new Date('2025-01-01').getTime(),
	},
];

const REQUIRED_ROLES = [
	{ id: 'role-learner', name: 'learner' as const, description: 'Students who take exams' },
	{ id: 'role-staff', name: 'staff' as const, description: 'Staff who create and manage exams' },
	{ id: 'role-head-staff', name: 'head_staff' as const, description: 'Head staff who approve exams and manage users' },
];

// Required permissions that must always exist
const REQUIRED_PERMISSIONS = [
	{ id: 'perm-1', roleId: 'role-learner', resource: 'exam', action: 'read' },
	{ id: 'perm-2', roleId: 'role-staff', resource: 'exam', action: 'create' },
	{ id: 'perm-3', roleId: 'role-staff', resource: 'exam', action: 'update' },
	{ id: 'perm-4', roleId: 'role-staff', resource: 'exam', action: 'read' },
	{ id: 'perm-5', roleId: 'role-head-staff', resource: 'exam', action: 'create' },
	{ id: 'perm-6', roleId: 'role-head-staff', resource: 'exam', action: 'update' },
	{ id: 'perm-7', roleId: 'role-head-staff', resource: 'exam', action: 'read' },
	{ id: 'perm-8', roleId: 'role-head-staff', resource: 'exam', action: 'approve' },
	{ id: 'perm-9', roleId: 'role-head-staff', resource: 'exam', action: 'delete' },
	{ id: 'perm-10', roleId: 'role-head-staff', resource: 'user', action: 'create' },
	{ id: 'perm-11', roleId: 'role-head-staff', resource: 'user', action: 'update' },
	{ id: 'perm-12', roleId: 'role-head-staff', resource: 'user', action: 'delete' },
];

// Migration: merge required seed data into persisted state so new users/roles/permissions
// added to the seed always appear even for users with existing localStorage data.
const migrations: Record<number, (state: any) => any> = {
	2: (state: any) => {
		const existingUsers: any[] = state?.users?.list ?? [];
		const mergedUsers = [...existingUsers];
		for (const required of REQUIRED_USERS) {
			if (!mergedUsers.some((u: any) => u.id === required.id)) {
				mergedUsers.push(required);
			}
		}

		const existingRoles: any[] = state?.roles?.list ?? [];
		const mergedRoles = [...existingRoles];
		for (const required of REQUIRED_ROLES) {
			if (!mergedRoles.some((r: any) => r.id === required.id)) {
				mergedRoles.push(required);
			}
		}

		const existingPerms: any[] = state?.permissions?.list ?? [];
		const mergedPerms = [...existingPerms];
		for (const required of REQUIRED_PERMISSIONS) {
			if (!mergedPerms.some((p: any) => p.id === required.id)) {
				mergedPerms.push(required);
			}
		}

		return {
			...state,
			users: { list: mergedUsers },
			roles: { list: mergedRoles },
			permissions: { list: mergedPerms },
		};
	},
};

// Persist configuration
const persistConfig = {
	key: 'root',
	storage,
	version: 2,
	migrate: createMigrate(migrations as any, { debug: false }),
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
		// NEW: Admin states
		'roles',
		'permissions',
		'sectionClosures',
		'files',
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
	// NEW: Admin reducers
	roles: rolesReducer,
	permissions: permissionsReducer,
	sectionClosures: sectionClosuresReducer,
	files: filesReducer,
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
