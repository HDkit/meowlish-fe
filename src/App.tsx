import { Dashboard } from './components/Dashboard';
// import { TestInterface } from './components/TestInterface';
// import { ResultsView } from './components/ResultsView';
import { ProgressTracker } from './components/ProgressTracker';
import { AuthForm } from './components/AuthForm';
import { TestSelection } from './components/TestSelection';
import { LandingPage } from './components/LandingPage';
import { MainNavbar } from './components/MainNavbar';
import { History } from './components/History';
import { TestsPage } from './components/TestsPage';
import { UserPage } from './components/UserPage';
import { SpeakingTest } from './components/SpeakingTest';
import { Routes, Route } from 'react-router-dom';

export default function App() {
	return (
		<div className='min-h-screen bg-background'>
			<MainNavbar />

			<main className='container mx-auto px-4 py-6'>
				<Routes>
					<Route path='/' element={<LandingPage />} />
					<Route path='/auth' element={<AuthForm />} />
					<Route path='/dashboard' element={<Dashboard />} />
					{/* <Route path='/tests' element={<TestsPage />} />
					<Route path='/test-selection' element={<TestSelection />} /> */}
					{/* <Route path='/test/:id' element={<TestInterface />} /> */}
					{/* <Route path='/results' element={<ResultsView />} /> */}
					<Route path='/progress' element={<ProgressTracker />} />
					<Route path='/history' element={<History />} />
					<Route path='/user' element={<UserPage />} />

					{/* Edit later, DO NOT DEMO */}
					{/* <Route path='/speaking-test' element={<SpeakingTest />} /> */}
				</Routes>
			</main>
		</div>
	);
}
