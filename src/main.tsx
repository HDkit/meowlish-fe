import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Provider } from 'react-redux';
import { persistor, store } from './components/store/main/store.ts';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
	<Provider store={store}>
		<PersistGate loading={null} persistor={persistor}>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</PersistGate>
	</Provider>
);
