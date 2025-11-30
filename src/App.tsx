import { Dashboard } from './components/Dashboard';
// import { TestInterface } from './components/TestInterface';
// import { ResultsView } from './components/ResultsView';
import { ProgressTracker } from './components/ProgressTracker';
import { AuthForm } from './components/AuthForm';
import { TestSelection } from './components/TestSelection';
import { LandingPage } from './components/LandingPage';
import { MainNavbar } from './components/MainNavbar';
import { History } from './components/History';
import { UserPage } from './components/UserPage';
import { Routes, Route } from 'react-router-dom';
import { ExamDetailPage } from './components/TestDetail';

export default function App() {
	return (
		<div className='min-h-screen bg-background'>
			<MainNavbar />

			<main className='container mx-auto px-4 py-6'>
				<Routes>
					{/* trang lúc mới vào có cái banner */}
					<Route path='/' element={<LandingPage />} />
					{/* trang đăng nhập, đăng ký /auth là đăng nhập /auth?mode=register là đăng ký */}
					<Route path='/auth' element={<AuthForm />} />
					{/* dashboard */}
					<Route path='/dashboard' element={<Dashboard />} />
					{/* trang tìm kiếm đề thi */}
					<Route path='/test-selection' element={<TestSelection />} />
					{/* trang làm bài đang đc sửa */}
					{/* <Route path='/test/do/:id' element={<TestInterface />} /> */}
					{/* trang xem kq làm bài đang đc sửa */}
					{/* <Route path='/results' element={<ResultsView />} /> */}
					{/* 3 trang dưới chỉ quan tâm /user th */}
					<Route path='/progress' element={<ProgressTracker />} />
					<Route path='/history' element={<History />} />
					<Route path='/user' element={<UserPage />} />

					{/* New pages added here  */}
					<Route path='/test/:id' element={<ExamDetailPage />} />

					{/* Edit later, DO NOT DEMO */}
					{/* <Route path='/speaking-test' element={<SpeakingTest />} /> */}
				</Routes>
			</main>
		</div>
	);
}
