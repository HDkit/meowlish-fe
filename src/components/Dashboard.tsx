import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Target, BookOpen, Headphones, Mic, PenTool, TrendingUp } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store/main/store';
import { AddGoalButton } from './AddGoalBtn';
import { EditGoalButton } from './EditGoalBtn';

const skillIcons = {
	reading: BookOpen,
	listening: Headphones,
	speaking: Mic,
	writing: PenTool,
};

export function Dashboard() {
	const dispatch = useDispatch();
	const goals = useSelector((state: RootState) => state.goals.list);

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

			{/* Goals Section */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr'>
				{goals.map((goal) => (
					<Card key={goal.id}>
						<CardHeader className='pb-3'>
							<CardTitle className='text-sm font-medium flex items-center gap-1'>
								<Target className='h-4 w-4' />
								<span>{goal.targetExam}</span>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center justify-between w-full'>
								<span className='text-2xl font-semibold'>{goal.target}</span>
								<EditGoalButton goal={goal} />
							</div>
						</CardContent>
					</Card>
				))}
				<AddGoalButton className='h-full flex items-center justify-center' />
			</div>

			{/* Test Selection */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
				{/* IELTS */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>IELTS Practice</CardTitle>
						<CardDescription>
							International English Language Testing System for academic and general purposes
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-2 gap-3'>
							{(['reading', 'listening', 'writing', 'speaking'] as const).map((skill) => {
								const Icon = skillIcons[skill];
								return (
									<Button
										key={skill}
										variant='outline'
										className='h-auto p-4 flex flex-col items-center gap-2'
										onClick={() => handleStartTest('ielts', skill)}
									>
										<Icon className='h-6 w-6' />
										<span className='capitalize'>{skill}</span>
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
						<CardTitle className='flex items-center gap-2'>TOEIC Practice</CardTitle>
						<CardDescription>Test of English for International Communication for workplace English</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-2 gap-3'>
							{(['reading', 'listening'] as const).map((skill) => {
								const Icon = skillIcons[skill];
								return (
									<Button
										key={skill}
										variant='outline'
										className='h-auto p-4 flex flex-col items-center gap-2'
										onClick={() => handleStartTest('toeic', skill)}
									>
										<Icon className='h-6 w-6' />
										<span className='capitalize'>{skill}</span>
									</Button>
								);
							})}
						</div>
						<div className='grid grid-cols-2 gap-3'>
							<Button variant='outline' className='h-auto p-4 flex flex-col items-center gap-2'>
								<PenTool className='h-6 w-6' />
								Writing
							</Button>
							<Button variant='outline' className='h-auto p-4 flex flex-col items-center gap-2'>
								<Mic className='h-6 w-6' />
								Speaking
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
					<CardTitle>AI-Powered Features</CardTitle>
					<CardDescription>Experience personalized learning with our advanced AI technology</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						{[
							{
								icon: Target,
								title: 'Adaptive Questions',
								desc: 'Questions automatically adjust to your skill level for optimal learning',
							},
							{
								icon: TrendingUp,
								title: 'Instant Feedback',
								desc: 'Get detailed explanations and improvement suggestions immediately',
							},
							{
								icon: BookOpen,
								title: 'Personalized Path',
								desc: 'AI creates custom study plans based on your strengths and weaknesses',
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
