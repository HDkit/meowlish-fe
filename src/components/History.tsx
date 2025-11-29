import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Clock, Target, Award, BookOpen, Headphones, PenTool, Mic, Filter } from 'lucide-react';
import type { TestType, Skill, TestSession } from '../slop';

interface HistoryProps {
	userId?: string;
}

// Mock data for history
const mockSessions: (TestSession & {
	completedAt: Date;
	score: number;
	accuracy: number;
})[] = [
	{
		id: 'session-1',
		testType: 'ielts',
		skill: 'reading',
		questions: [],
		currentQuestionIndex: 0,
		answers: [],
		startTime: new Date('2024-01-15T10:00:00'),
		completed: true,
		completedAt: new Date('2024-01-15T11:30:00'),
		score: 7.5,
		accuracy: 85,
	},
	{
		id: 'session-2',
		testType: 'toeic',
		skill: 'listening',
		questions: [],
		currentQuestionIndex: 0,
		answers: [],
		startTime: new Date('2024-01-14T14:00:00'),
		completed: true,
		completedAt: new Date('2024-01-14T15:15:00'),
		score: 800,
		accuracy: 78,
	},
	{
		id: 'session-3',
		testType: 'ielts',
		skill: 'writing',
		questions: [],
		currentQuestionIndex: 0,
		answers: [],
		startTime: new Date('2024-01-13T09:00:00'),
		completed: true,
		completedAt: new Date('2024-01-13T10:45:00'),
		score: 6.5,
		accuracy: 72,
	},
	{
		id: 'session-4',
		testType: 'ielts',
		skill: 'speaking',
		questions: [],
		currentQuestionIndex: 0,
		answers: [],
		startTime: new Date('2024-01-12T16:00:00'),
		completed: true,
		completedAt: new Date('2024-01-12T16:30:00'),
		score: 7.0,
		accuracy: 80,
	},
	{
		id: 'session-5',
		testType: 'toeic',
		skill: 'reading',
		questions: [],
		currentQuestionIndex: 0,
		answers: [],
		startTime: new Date('2024-01-11T11:00:00'),
		completed: true,
		completedAt: new Date('2024-01-11T12:30:00'),
		score: 750,
		accuracy: 76,
	},
];

export function History({ userId }: HistoryProps) {
	const [filterTestType, setFilterTestType] = useState<TestType | 'all'>('all');
	const [filterSkill, setFilterSkill] = useState<Skill | 'all'>('all');
	const [sortBy, setSortBy] = useState<'date' | 'score' | 'accuracy'>('date');

	const skillIcons = {
		reading: BookOpen,
		listening: Headphones,
		speaking: Mic,
		writing: PenTool,
	};

	const getSkillIcon = (skill: Skill) => {
		const Icon = skillIcons[skill];
		return <Icon className='h-4 w-4' />;
	};

	const getBadgeVariant = (testType: TestType) => {
		return testType === 'ielts' ? 'default' : 'secondary';
	};

	const getScoreColor = (score: number, testType: TestType) => {
		if (testType === 'ielts') {
			return score >= 7 ? 'text-green-600' : score >= 6 ? 'text-yellow-600' : 'text-red-600';
		} else {
			return score >= 785 ? 'text-green-600' : score >= 605 ? 'text-yellow-600' : 'text-red-600';
		}
	};

	const filteredSessions = mockSessions.filter((session) => {
		const testTypeMatch = filterTestType === 'all' || session.testType === filterTestType;
		const skillMatch = filterSkill === 'all' || session.skill === filterSkill;
		return testTypeMatch && skillMatch;
	});

	const sortedSessions = [...filteredSessions].sort((a, b) => {
		switch (sortBy) {
			case 'date':
				return b.completedAt.getTime() - a.completedAt.getTime();
			case 'score':
				return b.score - a.score;
			case 'accuracy':
				return b.accuracy - a.accuracy;
			default:
				return 0;
		}
	});

	const stats = {
		totalSessions: mockSessions.length,
		averageAccuracy: Math.round(mockSessions.reduce((sum, s) => sum + s.accuracy, 0) / mockSessions.length),
		bestIELTS: Math.max(...mockSessions.filter((s) => s.testType === 'ielts').map((s) => s.score)),
		bestTOEIC: Math.max(...mockSessions.filter((s) => s.testType === 'toeic').map((s) => s.score)),
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='space-y-2'>
				<h1 className='text-3xl font-semibold'>Lịch sử làm bài</h1>
				<p className='text-muted-foreground'>Xem lại các bài kiểm tra đã hoàn thành và theo dõi tiến bộ của bạn</p>
			</div>

			{/* Statistics Overview */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<Award className='h-5 w-5 text-primary' />
							<div>
								<p className='text-sm font-medium'>Tổng số bài</p>
								<p className='text-2xl font-semibold'>{stats.totalSessions}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<Target className='h-5 w-5 text-primary' />
							<div>
								<p className='text-sm font-medium'>Độ chính xác TB</p>
								<p className='text-2xl font-semibold'>{stats.averageAccuracy}%</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<Award className='h-5 w-5 text-green-600' />
							<div>
								<p className='text-sm font-medium'>IELTS cao nhất</p>
								<p className='text-2xl font-semibold text-green-600'>{stats.bestIELTS}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<Award className='h-5 w-5 text-blue-600' />
							<div>
								<p className='text-sm font-medium'>TOEIC cao nhất</p>
								<p className='text-2xl font-semibold text-blue-600'>{stats.bestTOEIC}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Filter className='h-5 w-5' />
						Bộ lọc và sắp xếp
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Loại thi</label>
							<Select value={filterTestType} onValueChange={(value: TestType | 'all') => setFilterTestType(value)}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>Tất cả</SelectItem>
									<SelectItem value='ielts'>IELTS</SelectItem>
									<SelectItem value='toeic'>TOEIC</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<label className='text-sm font-medium'>Kỹ năng</label>
							<Select value={filterSkill} onValueChange={(value: Skill | 'all') => setFilterSkill(value)}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>Tất cả</SelectItem>
									<SelectItem value='reading'>Reading</SelectItem>
									<SelectItem value='listening'>Listening</SelectItem>
									<SelectItem value='writing'>Writing</SelectItem>
									<SelectItem value='speaking'>Speaking</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<label className='text-sm font-medium'>Sắp xếp theo</label>
							<Select value={sortBy} onValueChange={(value: 'date' | 'score' | 'accuracy') => setSortBy(value)}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='date'>Ngày làm bài</SelectItem>
									<SelectItem value='score'>Điểm số</SelectItem>
									<SelectItem value='accuracy'>Độ chính xác</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* History List */}
			<Card>
				<CardHeader>
					<CardTitle>Lịch sử chi tiết ({sortedSessions.length} bài)</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						{sortedSessions.map((session) => (
							<div key={session.id} className='border rounded-lg p-4 hover:bg-muted/50 transition-colors'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center space-x-4'>
										<div className='flex items-center space-x-2'>
											{getSkillIcon(session.skill)}
											<Badge variant={getBadgeVariant(session.testType)}>{session.testType.toUpperCase()}</Badge>
											<span className='font-medium capitalize'>{session.skill}</span>
										</div>
									</div>

									<div className='flex items-center space-x-6'>
										<div className='text-right'>
											<p className='text-sm text-muted-foreground'>Điểm số</p>
											<p className={`font-semibold ${getScoreColor(session.score, session.testType)}`}>
												{session.score}
											</p>
										</div>

										<div className='text-right'>
											<p className='text-sm text-muted-foreground'>Độ chính xác</p>
											<p className='font-semibold'>{session.accuracy}%</p>
										</div>

										<div className='text-right'>
											<p className='text-sm text-muted-foreground'>Thời gian</p>
											<p className='font-semibold'>
												{Math.round((session.completedAt.getTime() - session.startTime.getTime()) / (1000 * 60))} phút
											</p>
										</div>

										<div className='text-right'>
											<p className='text-sm text-muted-foreground'>Ngày làm</p>
											<p className='font-semibold'>{session.completedAt.toLocaleDateString('vi-VN')}</p>
										</div>

										<Button variant='outline' size='sm'>
											Xem chi tiết
										</Button>
									</div>
								</div>
							</div>
						))}

						{sortedSessions.length === 0 && (
							<div className='text-center py-8'>
								<p className='text-muted-foreground'>Không tìm thấy bài kiểm tra nào phù hợp với bộ lọc.</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
