import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
	Mail,
	Calendar,
	Trophy,
	Target,
	Clock,
	TrendingUp,
	BookOpen,
	GraduationCap,
	Edit,
	Settings,
	Award,
	BarChart3,
	Flame,
	Headphones,
	PenTool,
	Mic,
	Filter,
	Star,
} from 'lucide-react';

type TestType = 'ielts' | 'toeic';
type Skill = 'reading' | 'listening' | 'writing' | 'speaking';

interface UserType {
	fullName: string;
	email: string;
	createdAt: Date;
	progress: {
		totalTests: number;
		ieltsScore: number;
		toeicScore: number;
		studyStreak: number;
		totalStudyTime: number;
		skillScores: Record<Skill, number>;
	};
}

interface TestSession {
	id: string;
	testType: TestType;
	skill: Skill;
	startTime: Date;
	completedAt: Date;
	score: number;
	accuracy: number;
}

interface Achievement {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	earned: boolean;
	earnedDate?: Date;
	progress?: number;
	maxProgress?: number;
}

// Mock user
const mockUser: UserType = {
	fullName: 'Nguyen Hai Dang',
	email: 'hai.dang@example.com',
	createdAt: new Date('2024-01-01'),
	progress: {
		totalTests: 12,
		ieltsScore: 6.5,
		toeicScore: 780,
		studyStreak: 7,
		totalStudyTime: 480, // minutes
		skillScores: { reading: 7, listening: 6, writing: 6.5, speaking: 7 },
	},
};

// Mock achievements
const mockAchievements: Achievement[] = [
	{
		id: 'first-test',
		title: 'Bước đầu tiên',
		description: 'Hoàn thành bài test đầu tiên',
		icon: <Trophy className='h-5 w-5 text-yellow-500' />,
		earned: true,
		earnedDate: new Date('2024-01-15'),
	},
	{
		id: 'week-streak',
		title: 'Học liên tục',
		description: 'Học 7 ngày liên tiếp',
		icon: <Flame className='h-5 w-5 text-orange-500' />,
		earned: true,
		earnedDate: new Date('2024-01-22'),
	},
	{
		id: 'ielts-6',
		title: 'IELTS 6.0+',
		description: 'Đạt điểm IELTS 6.0 trở lên',
		icon: <GraduationCap className='h-5 w-5 text-blue-500' />,
		earned: true,
		earnedDate: new Date('2024-02-01'),
	},
	{
		id: 'reading-master',
		title: 'Bậc thầy đọc hiểu',
		description: 'Hoàn thành 50 bài Reading',
		icon: <Award className='h-5 w-5 text-purple-500' />,
		earned: false,
		progress: 32,
		maxProgress: 50,
	},
];

// Mock test history
const mockTestHistory: TestSession[] = [
	{
		id: '1',
		testType: 'ielts',
		skill: 'reading',
		startTime: new Date('2024-01-15T10:00'),
		completedAt: new Date('2024-01-15T11:30'),
		score: 7.5,
		accuracy: 85,
	},
	{
		id: '2',
		testType: 'toeic',
		skill: 'listening',
		startTime: new Date('2024-01-14T14:00'),
		completedAt: new Date('2024-01-14T15:15'),
		score: 780,
		accuracy: 78,
	},
];

export function UserPage() {
	const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'history'>('overview');
	const [filterTestType, setFilterTestType] = useState<TestType | 'all'>('all');
	const [filterSkill, setFilterSkill] = useState<Skill | 'all'>('all');
	const [sortBy, setSortBy] = useState<'date' | 'score' | 'accuracy'>('date');

	const formatDate = (date: Date) =>
		new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);

	const skillIcons: Record<Skill, React.ElementType> = {
		reading: BookOpen,
		listening: Headphones,
		writing: PenTool,
		speaking: Mic,
	};

	const getSkillIcon = (skill: Skill) => {
		const Icon = skillIcons[skill];
		return <Icon className='h-4 w-4' />;
	};

	const filteredHistory = mockTestHistory.filter(
		(session) =>
			(filterTestType === 'all' || session.testType === filterTestType) &&
			(filterSkill === 'all' || session.skill === filterSkill)
	);

	const sortedHistory = [...filteredHistory].sort((a, b) => {
		if (sortBy === 'date') return b.completedAt.getTime() - a.completedAt.getTime();
		if (sortBy === 'score') return b.score - a.score;
		if (sortBy === 'accuracy') return b.accuracy - a.accuracy;
		return 0;
	});

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center space-x-4'>
				<Avatar className='h-16 w-16'>
					<AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${mockUser.fullName}`} />
					<AvatarFallback>
						{mockUser.fullName
							.split(' ')
							.map((n) => n[0])
							.join('')
							.slice(0, 2)}
					</AvatarFallback>
				</Avatar>
				<div>
					<h1 className='text-3xl font-bold'>{mockUser.fullName}</h1>
					<p className='text-muted-foreground flex items-center'>
						<Mail className='h-4 w-4 mr-2' />
						{mockUser.email}
					</p>
					<p className='text-sm text-muted-foreground flex items-center mt-1'>
						<Calendar className='h-4 w-4 mr-2' />
						Tham gia từ {formatDate(mockUser.createdAt)}
					</p>
				</div>
				<div className='ml-auto flex space-x-2'>
					<Button variant='outline'>
						<Edit className='h-4 w-4 mr-2' />
						Chỉnh sửa hồ sơ
					</Button>
					<Button variant='outline'>
						<Settings className='h-4 w-4 mr-2' />
						Cài đặt
					</Button>
				</div>
			</div>

			{/* Stats */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
				<Card>
					<CardContent>
						<p>Tổng số bài: {mockUser.progress.totalTests}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent>
						<p>IELTS: {mockUser.progress.ieltsScore}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent>
						<p>TOEIC: {mockUser.progress.toeicScore}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent>
						<p>Chuỗi học: {mockUser.progress.studyStreak} ngày</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='overview'>Tổng quan</TabsTrigger>
					<TabsTrigger value='achievements'>Thành tích</TabsTrigger>
					<TabsTrigger value='history'>Lịch sử</TabsTrigger>
				</TabsList>

				{/* Overview */}
				<TabsContent value='overview'>
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
						<Card>
							<CardHeader>
								<CardTitle>Điểm số theo kỹ năng</CardTitle>
							</CardHeader>
							<CardContent>
								{Object.entries(mockUser.progress.skillScores).map(([skill, score]) => (
									<div key={skill} className='space-y-1'>
										<div className='flex justify-between'>
											<span className='capitalize'>{skill}</span>
											<span>{score}/9</span>
										</div>
										<Progress value={(score / 9) * 100} className='h-2' />
									</div>
								))}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Achievements */}
				<TabsContent value='achievements' className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{mockAchievements.map((a) => (
						<Card key={a.id} className={a.earned ? 'border-green-200 bg-green-50' : ''}>
							<CardContent className='flex space-x-3'>
								<div className='p-2 rounded-full'>{a.icon}</div>
								<div className='flex-1'>
									<div className='flex justify-between'>
										<h3>{a.title}</h3>
										{a.earned && <Badge variant='default'>Đã đạt</Badge>}
									</div>
									<p>{a.description}</p>
									{a.earned && a.earnedDate && <p className='text-xs'>Đạt vào {formatDate(a.earnedDate)}</p>}
									{!a.earned && a.progress && a.maxProgress && <Progress value={(a.progress / a.maxProgress) * 100} />}
								</div>
							</CardContent>
						</Card>
					))}
				</TabsContent>

				{/* History */}
				<TabsContent value='history'>
					<div className='space-y-4'>
						{sortedHistory.map((session) => (
							<Card key={session.id} className='p-4'>
								<div className='flex justify-between items-center'>
									<div className='flex items-center space-x-2'>
										{getSkillIcon(session.skill)} <Badge>{session.testType.toUpperCase()}</Badge> {session.skill}
									</div>
									<div className='flex space-x-4 text-right'>
										<div>Điểm: {session.score}</div>
										<div>Độ chính xác: {session.accuracy}%</div>
										<div>
											Thời gian: {Math.round((session.completedAt.getTime() - session.startTime.getTime()) / 60000)}{' '}
											phút
										</div>
									</div>
									<Button variant='outline' size='sm'>
										Xem chi tiết
									</Button>
								</div>
							</Card>
						))}
						{sortedHistory.length === 0 && (
							<p className='text-center py-8 text-muted-foreground'>Không tìm thấy bài kiểm tra nào.</p>
						)}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
