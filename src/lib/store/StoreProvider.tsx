'use client';

import { createContext, useContext, useRef } from 'react';
import { Provider } from 'react-redux';
import { persistStore, Persistor } from 'redux-persist';
import { makeStore, AppStore } from './store';

const PersistorContext = createContext<Persistor | null>(null);

/** The persistor for the app store (for <PersistGate>, purge on logout, ...). */
export const usePersistor = () => useContext(PersistorContext);

export default function StoreProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const storeRef = useRef<AppStore | null>(null);
	const persistorRef = useRef<Persistor | null>(null);

	if (!storeRef.current) {
		storeRef.current = makeStore();
		persistorRef.current = persistStore(storeRef.current);
	}

	return (
		<Provider store={storeRef.current}>
			<PersistorContext.Provider value={persistorRef.current ?? null}>{children}</PersistorContext.Provider>
		</Provider>
	);
}
