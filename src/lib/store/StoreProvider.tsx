'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { makeStore, AppStore } from './store';

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
			<PersistGate loading={null} persistor={persistorRef.current}>
				{children}
			</PersistGate>
		</Provider>
	);
}
