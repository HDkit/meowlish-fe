import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  User, 
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
  History,
  Star,
  Flame,
  Users,
  Download,
  Share2,
  Headphones,
  PenTool,
  Mic,
  Filter
} from 'lucide-react';
import { User as UserType, TestType, Skill, TestSession } from '../App';

interface UserPageProps {
  user: UserType;
  onUpdateUser: (user: UserType) => void;
  onNavigateProfile: () => void;
  onNavigateHistory: () => void;
  onNavigateProgress: () => void;
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

const mockAchievements: Achievement[] = [
  {
    id: 'first-test',
    title: 'Bước đầu tiên',
    description: 'Hoàn thành bài test đầu tiên',
    icon: <Trophy className="h-5 w-5 text-yellow-500" />,
    earned: true,
    earnedDate: new Date('2024-01-15')
  },
  {
    id: 'week-streak',
    title: 'Học liên tục',
    description: 'Học 7 ngày liên tiếp',
    icon: <Flame className="h-5 w-5 text-orange-500" />,
    earned: true,
    earnedDate: new Date('2024-01-22')
  },
  {
    id: 'ielts-6',
    title: 'IELTS 6.0+',
    description: 'Đạt điểm IELTS 6.0 trở lên',
    icon: <GraduationCap className="h-5 w-5 text-blue-500" />,
    earned: true,
    earnedDate: new Date('2024-02-01')
  },
  {
    id: 'toeic-750',
    title: 'TOEIC 750+',
    description: 'Đạt điểm TOEIC 750 trở lên',
    icon: <BookOpen className="h-5 w-5 text-green-500" />,
    earned: true,
    earnedDate: new Date('2024-02-10')
  },
  {
    id: 'reading-master',
    title: 'Bậc thầy đọc hiểu',
    description: 'Hoàn thành 50 bài Reading',
    icon: <Award className="h-5 w-5 text-purple-500" />,
    earned: false,
    progress: 32,
    maxProgress: 50
  },
  {
    id: 'listening-expert',
    title: 'Chuyên gia nghe',
    description: 'Đạt 90% độ chính xác Listening',
    icon: <Star className="h-5 w-5 text-indigo-500" />,
    earned: false,
    progress: 85,
    maxProgress: 90
  }
];

const mockRecentActivity = [
  {
    id: '1',
    type: 'test_completed',
    title: 'Hoàn thành IELTS Reading Practice 1',
    score: 7.5,
    date: new Date('2024-02-15'),
    duration: '45 phút'
  },
  {
    id: '2',
    type: 'achievement_earned',
    title: 'Đạt thành tích "TOEIC 750+"',
    date: new Date('2024-02-10')
  },
  {
    id: '3',
    type: 'test_completed',
    title: 'Hoàn thành TOEIC Listening Test',
    score: 780,
    date: new Date('2024-02-08'),
    duration: '120 phút'
  },
  {
    id: '4',
    type: 'streak_milestone',
    title: 'Đạt mốc học liên tục 7 ngày',
    date: new Date('2024-02-05')
  }
];

// Mock data for test history
const mockTestHistory: (TestSession & { 
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
  {
    id: 'session-6',
    testType: 'ielts',
    skill: 'listening',
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    startTime: new Date('2024-01-10T13:00:00'),
    completed: true,
    completedAt: new Date('2024-01-10T13:45:00'),
    score: 6.0,
    accuracy: 70,
  },
];

export function UserPage({ user, onUpdateUser, onNavigateProfile, onNavigateHistory, onNavigateProgress }: UserPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterTestType, setFilterTestType] = useState<TestType | 'all'>('all');
  const [filterSkill, setFilterSkill] = useState<Skill | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'accuracy'>('date');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'test_completed': return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'achievement_earned': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'streak_milestone': return <Flame className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const skillIcons = {
    reading: BookOpen,
    listening: Headphones,
    speaking: Mic,
    writing: PenTool
  };

  const getSkillIcon = (skill: Skill) => {
    const Icon = skillIcons[skill];
    return <Icon className="h-4 w-4" />;
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

  const filteredSessions = mockTestHistory.filter(session => {
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

  const historyStats = {
    totalSessions: mockTestHistory.length,
    averageAccuracy: Math.round(mockTestHistory.reduce((sum, s) => sum + s.accuracy, 0) / mockTestHistory.length),
    bestIELTS: Math.max(...mockTestHistory.filter(s => s.testType === 'ielts').map(s => s.score)),
    bestTOEIC: Math.max(...mockTestHistory.filter(s => s.testType === 'toeic').map(s => s.score)),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.fullName}`} />
            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user.fullName}</h1>
            <p className="text-muted-foreground flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              {user.email}
            </p>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-2" />
              Tham gia từ {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onNavigateProfile}>
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa hồ sơ
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số bài thi</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.progress.totalTests}</div>
            <p className="text-xs text-muted-foreground">
              +3 từ tuần trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm IELTS</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.progress.ieltsScore}</div>
            <p className="text-xs text-muted-foreground">
              +0.5 điểm cải thiện
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm TOEIC</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.progress.toeicScore}</div>
            <p className="text-xs text-muted-foreground">
              +50 điểm cải thiện
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chuỗi học tập</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.progress.studyStreak}</div>
            <p className="text-xs text-muted-foreground">
              ngày liên tiếp
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="achievements">Thành tích</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skill Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Điểm số theo kỹ năng
                </CardTitle>
                <CardDescription>
                  Thành tích của bạn trong từng kỹ năng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(user.progress.skillScores).map(([skill, score]) => (
                  <div key={skill} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">
                        {skill === 'listening' && 'Nghe'}
                        {skill === 'reading' && 'Đọc'}
                        {skill === 'writing' && 'Viết'}
                        {skill === 'speaking' && 'Nói'}
                      </span>
                      <span className="font-medium">{score}/9.0</span>
                    </div>
                    <Progress value={(score / 9) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Study Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê học tập</CardTitle>
                <CardDescription>
                  Tổng quan về hoạt động học tập của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tổng thời gian học</p>
                      <p className="font-medium">{Math.round(user.progress.totalStudyTime / 60)} giờ</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Độ chính xác TB</p>
                      <p className="font-medium">85%</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cải thiện tháng này</p>
                      <p className="font-medium">+12%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockAchievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.earned ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${achievement.earned ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{achievement.title}</h3>
                        {achievement.earned && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            Đã đạt
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {achievement.earned && achievement.earnedDate && (
                        <p className="text-xs text-muted-foreground">
                          Đạt được vào {formatDate(achievement.earnedDate)}
                        </p>
                      )}
                      {!achievement.earned && achievement.progress && achievement.maxProgress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Tiến độ</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm">Tổng số bài</p>
                    <p className="text-2xl">{historyStats.totalSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm">Độ chính xác TB</p>
                    <p className="text-2xl">{historyStats.averageAccuracy}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm">IELTS cao nhất</p>
                    <p className="text-2xl text-green-600">{historyStats.bestIELTS}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm">TOEIC cao nhất</p>
                    <p className="text-2xl text-blue-600">{historyStats.bestTOEIC}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Bộ lọc và sắp xếp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Loại thi</label>
                  <Select value={filterTestType} onValueChange={(value: TestType | 'all') => setFilterTestType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="ielts">IELTS</SelectItem>
                      <SelectItem value="toeic">TOEIC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm">Kỹ năng</label>
                  <Select value={filterSkill} onValueChange={(value: Skill | 'all') => setFilterSkill(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="reading">Reading</SelectItem>
                      <SelectItem value="listening">Listening</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="speaking">Speaking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm">Sắp xếp theo</label>
                  <Select value={sortBy} onValueChange={(value: 'date' | 'score' | 'accuracy') => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Ngày làm bài</SelectItem>
                      <SelectItem value="score">Điểm số</SelectItem>
                      <SelectItem value="accuracy">Độ chính xác</SelectItem>
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
              <div className="space-y-4">
                {sortedSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getSkillIcon(session.skill)}
                          <Badge variant={getBadgeVariant(session.testType)}>
                            {session.testType.toUpperCase()}
                          </Badge>
                          <span className="capitalize">{session.skill}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Điểm số</p>
                          <p className={`${getScoreColor(session.score, session.testType)}`}>
                            {session.score}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Độ chính xác</p>
                          <p>{session.accuracy}%</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Thời gian</p>
                          <p>
                            {Math.round((session.completedAt.getTime() - session.startTime.getTime()) / (1000 * 60))} phút
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Ngày làm</p>
                          <p>
                            {session.completedAt.toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {sortedSessions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Không tìm thấy bài kiểm tra nào phù hợp với bộ lọc.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}