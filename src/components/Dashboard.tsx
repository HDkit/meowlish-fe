import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Target, BookOpen, Headphones, Mic, PenTool, TrendingUp } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AddGoalButton } from './AddGoalBtn';
import { EditGoalButton } from './EditGoalBtn';
import { useAppSelector } from './store/main/hook';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const skillIcons = {
	reading: BookOpen,
	listening: Headphones,
	speaking: Mic,
	writing: PenTool,
};

export function Dashboard() {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	useEffect(() => {
		if (!currentUser) {
			navigate('/auth'); // redirect if not logged in
		}
	}, [currentUser, navigate]);
	const goals = useAppSelector((state) => state.goals.list);

	const handleStartTest = (testType: 'ielts' | 'toeic', skill: keyof typeof skillIcons) => {
		// TODO: start test logic
		console.log(`Start ${testType} test for ${skill}`);
	};

	const handleGoToTestSelection = () => {
		console.log('Navigate to test selection');
	};

	return (
		<div className='space-y-8'>
			{/* Welcome Section */}
			<div className='text-center space-y-4'>
				<h2 className='text-3xl font-semibold'>Chào mừng bạn 👋</h2>
				<p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
					Hãy tiếp tục hành trình chinh phục IELTS và TOEIC với hệ thống AI thông minh. Nhận câu hỏi cá nhân hóa và phản
					hồi tức thì.
				</p>
			</div>

			{/* Test Selection */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
				{/* IELTS */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>Luyện thi IELTS</CardTitle>
						<CardDescription>
							Hệ thống kiểm tra tiếng Anh quốc tế cho mục đích học thuật và tổng quát
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-2 gap-3'>
							{([
								{ key: 'reading', label: 'Đọc' },
								{ key: 'listening', label: 'Nghe' },
								{ key: 'writing', label: 'Viết' },
								{ key: 'speaking', label: 'Nói' },
							] as const).map(({ key, label }) => {
								const Icon = skillIcons[key];
								return (
									<Button
										key={key}
										variant='outline'
										className='h-auto p-4 flex flex-col items-center gap-2'
										onClick={() => handleStartTest('ielts', key)}
									>
										<Icon className='h-6 w-6' />
										<span>{label}</span>
									</Button>
								);
							})}
						</div>
						<div className='pt-4 border-t'>
							<Button className='w-full' onClick={handleGoToTestSelection}>
								Xem tất cả đề thi IELTS
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* TOEIC */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>Luyện thi TOEIC</CardTitle>
						<CardDescription>Bài kiểm tra tiếng Anh giao tiếp quốc tế trong môi trường công sở</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-2 gap-3'>
							{([
								{ key: 'reading', label: 'Đọc' },
								{ key: 'listening', label: 'Nghe' },
							] as const).map(({ key, label }) => {
								const Icon = skillIcons[key];
								return (
									<Button
										key={key}
										variant='outline'
										className='h-auto p-4 flex flex-col items-center gap-2'
										onClick={() => handleStartTest('toeic', key)}
									>
										<Icon className='h-6 w-6' />
										<span>{label}</span>
									</Button>
								);
							})}
						</div>
						<div className='grid grid-cols-2 gap-3'>
							<Button variant='outline' className='h-auto p-4 flex flex-col items-center gap-2'>
								<PenTool className='h-6 w-6' />
								Viết
							</Button>
							<Button variant='outline' className='h-auto p-4 flex flex-col items-center gap-2'>
								<Mic className='h-6 w-6' />
								Nói
							</Button>
						</div>
						<div className='pt-4 border-t'>
							<Button className='w-full' onClick={handleGoToTestSelection}>
								Xem tất cả đề thi TOEIC
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
			{/* AI Features */}
			<Card>
				<CardHeader>
					<CardTitle>Tính năng AI thông minh</CardTitle>
					<CardDescription>Trải nghiệm học tập cá nhân hóa với công nghệ AI tiên tiến</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						{[
							{
								icon: Target,
								title: 'Câu hỏi thích ứng',
								desc: 'Câu hỏi tự động điều chỉnh theo trình độ của bạn để tối ưu hóa việc học',
							},
							{
								icon: TrendingUp,
								title: 'Phản hồi tức thì',
								desc: 'Nhận giải thích chi tiết và gợi ý cải thiện ngay lập tức',
							},
							{
								icon: BookOpen,
								title: 'Lộ trình cá nhân hóa',
								desc: 'AI tạo kế hoạch học tập riêng dựa trên điểm mạnh và điểm yếu của bạn',
							},
						].map(({ icon: Icon, title, desc }) => (
							<div key={title} className='text-center space-y-2'>
								<div className='mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center'>
									<Icon className='h-6 w-6 text-primary' />
								</div>
								<h4 className='font-medium'>{title}</h4>
								<p className='text-sm text-muted-foreground'>{desc}</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
