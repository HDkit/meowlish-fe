'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
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
		storeRef.current = makeStore();
		persistorRef.current = persistStore(storeRef.current);
	}

	return (
		<Provider store={storeRef.current}>
			{children}
		</Provider>
	);
}
