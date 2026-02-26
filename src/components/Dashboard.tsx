'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Target, BookOpen, Headphones, Mic, PenTool, TrendingUp } from 'lucide-react';
import { AddGoalButton } from './AddGoalBtn';
import { EditGoalButton } from './EditGoalBtn';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const skillIcons = {
	reading: BookOpen,
	listening: Headphones,
	speaking: Mic,
	writing: PenTool,
};

export function Dashboard() {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const router = useRouter();
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (!currentUser) {
			router.push('/auth'); // redirect if not logged in
		}
	}, [currentUser, router]);
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
			<div className='text-center space-y-3 p-8 rounded-lg bg-gray-100'>
				<h2 className='text-3xl font-bold text-gray-900'>
					Chào mừng bạn 👋
				</h2>
				<p className='text-gray-700'>
					Bắt đầu hành trình chinh phục IELTS và TOEIC của bạn
				</p>
			</div>

			{/* Test Selection */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
				{/* IELTS */}
				<Card className='border-gray-200'>
					<CardHeader className='bg-gray-50'>
						<CardTitle className='text-gray-900'>Luyện thi IELTS</CardTitle>
						<CardDescription className='text-gray-700'>
							Hệ thống kiểm tra tiếng Anh quốc tế cho mục đích học thuật và tổng quát
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4 pt-6'>
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
										className='h-auto p-4 flex flex-col items-center gap-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700'
										onClick={() => handleStartTest('ielts', key)}
									>
										<Icon className='h-6 w-6' />
										<span className='font-semibold'>{label}</span>
									</Button>
								);
							})}
						</div>
						<div className='pt-4 border-t border-gray-200'>
							<Button className='w-full bg-gray-900 hover:bg-black text-white' onClick={handleGoToTestSelection}>
								Xem tất cả đề thi IELTS
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* TOEIC */}
				<Card className='border-gray-200'>
					<CardHeader className='bg-gray-50'>
						<CardTitle className='text-gray-900'>Luyện thi TOEIC</CardTitle>
						<CardDescription className='text-gray-700'>Bài kiểm tra tiếng Anh giao tiếp quốc tế trong môi trường công sở</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4 pt-6'>
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
										className='h-auto p-4 flex flex-col items-center gap-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700'
										onClick={() => handleStartTest('toeic', key)}
									>
										<Icon className='h-6 w-6' />
										<span className='font-semibold'>{label}</span>
									</Button>
								);
							})}
						</div>
						<div className='grid grid-cols-2 gap-3'>
							<Button variant='outline' className='h-auto p-4 flex flex-col items-center gap-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700'>
								<PenTool className='h-6 w-6' />
								<span className='font-semibold'>Viết</span>
							</Button>
							<Button variant='outline' className='h-auto p-4 flex flex-col items-center gap-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700'>
								<Mic className='h-6 w-6' />
								<span className='font-semibold'>Nói</span>
							</Button>
						</div>
						<div className='pt-4 border-t border-gray-200'>
							<Button className='w-full bg-gray-900 hover:bg-black text-white' onClick={handleGoToTestSelection}>
								Xem tất cả đề thi TOEIC
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
			{/* AI Features */}
			<Card className='border-gray-200'>
				<CardHeader className='bg-gray-50'>
					<CardTitle className='text-gray-900'>Tính năng AI thông minh</CardTitle>
					<CardDescription className='text-gray-700'>Trải nghiệm học tập cá nhân hóa với công nghệ AI tiên tiến</CardDescription>
				</CardHeader>
				<CardContent className='pt-6'>
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
								<div key={title} className='text-center space-y-2 p-4 rounded-lg bg-white border border-gray-200'>
									<div className='mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center'>
										<Icon className='h-6 w-6 text-gray-700' />
									</div>
									<h4 className='font-medium text-gray-900'>{title}</h4>
									<p className='text-sm text-gray-700'>{desc}</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
