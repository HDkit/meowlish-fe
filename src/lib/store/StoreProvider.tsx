'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { makeStore, AppStore } from './store';

// Loading component for PersistGate
function PersistLoading() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="text-center space-y-4">
				<div className="relative w-16 h-16 mx-auto">
					<div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
					<div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
				</div>
				<p className="text-lg font-medium text-gray-600">Loading your data...</p>
			</div>
		</div>
	);
}

export default function StoreProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const storeRef = useRef<AppStore>();
	const persistorRef = useRef<any>();

	if (!storeRef.current) {
		// Create the store instance the first time this renders
		storeRef.current = makeStore();
		persistorRef.current = persistStore(storeRef.current);
	}

	return (
		<Provider store={storeRef.current}>
			<PersistGate loading={<PersistLoading />} persistor={persistorRef.current}>
				{children}
			</PersistGate>
		</Provider>
	);
}
