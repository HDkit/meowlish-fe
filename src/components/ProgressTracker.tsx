import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Clock,
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  Trophy,
  Flame
} from 'lucide-react';

export function ProgressTracker() {
  // Mock data for demonstration
  const mockProgressData = {
    ieltsHistory: [
      { date: '2024-01-01', score: 5.5 },
      { date: '2024-01-15', score: 6.0 },
      { date: '2024-02-01', score: 6.5 },
      { date: '2024-02-15', score: 6.5 },
      { date: '2024-03-01', score: 7.0 },
    ],
    toeicHistory: [
      { date: '2024-01-01', score: 650 },
      { date: '2024-01-15', score: 700 },
      { date: '2024-02-01', score: 750 },
      { date: '2024-02-15', score: 780 },
      { date: '2024-03-01', score: 820 },
    ],
    skillBreakdown: [
      { skill: 'Reading', ielts: 7.0, toeic: 85 },
      { skill: 'Listening', ielts: 6.5, toeic: 80 },
      { skill: 'Writing', ielts: 6.0, toeic: 75 },
      { skill: 'Speaking', ielts: 6.5, toeic: 78 },
    ],
    weeklyActivity: [
      { day: 'Mon', minutes: 45 },
      { day: 'Tue', minutes: 60 },
      { day: 'Wed', minutes: 30 },
      { day: 'Thu', minutes: 75 },
      { day: 'Fri', minutes: 90 },
      { day: 'Sat', minutes: 120 },
      { day: 'Sun', minutes: 40 },
    ],
    testTypeDistribution: [
      { name: 'IELTS', value: 65, color: '#8884d8' },
      { name: 'TOEIC', value: 35, color: '#82ca9d' },
    ]
  };

  const skillIcons = {
    Reading: BookOpen,
    Listening: Headphones,
    Writing: PenTool,
    Speaking: Mic
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-semibold">Learning Progress</h2>
        <p className="text-muted-foreground">
          Track your improvement across all skills and test types
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Current IELTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-semibold">7.0</div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-3 w-3" />
                +0.5 this month
              </div>
              <Progress value={77.8} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Current TOEIC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-semibold">820</div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-3 w-3" />
                +40 this month
              </div>
              <Progress value={82} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Study Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-semibold">12 days</div>
              <div className="text-sm text-muted-foreground">Personal best: 25 days</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-secondary" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-semibold">7.5 hrs</div>
              <div className="text-sm text-muted-foreground">Target: 10 hrs</div>
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="scores" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scores">Score Trends</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="activity">Study Activity</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>IELTS Score Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockProgressData.ieltsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 9]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>TOEIC Score Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockProgressData.toeicHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 990]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skill Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockProgressData.skillBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="skill" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ielts" fill="#8884d8" name="IELTS (0-9)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Individual Skill Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockProgressData.skillBreakdown.map((skill) => {
                  const Icon = skillIcons[skill.skill as keyof typeof skillIcons];
                  const percentage = (skill.ielts / 9) * 100;
                  
                  return (
                    <div key={skill.skill} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{skill.skill}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{skill.ielts}</Badge>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Study Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockProgressData.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="minutes" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockProgressData.testTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockProgressData.testTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Study Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-semibold">47</div>
                  <p className="text-sm text-muted-foreground">Tests Completed</p>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold">89%</div>
                  <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold">156</div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold">23</div>
                  <p className="text-sm text-muted-foreground">Days Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  AI Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Strengths</h4>
                  <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
                    <li>• Reading comprehension is excellent</li>
                    <li>• Consistent improvement in listening</li>
                    <li>• Strong grammar foundation</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Areas for Improvement</h4>
                  <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
                    <li>• Writing task coherence needs work</li>
                    <li>• Speaking fluency can be enhanced</li>
                    <li>• Time management in reading section</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Personalized Study Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium">This Week</h4>
                    <p className="text-sm text-muted-foreground">Focus on writing Task 1 structure and practice 3 reading passages daily</p>
                  </div>
                  
                  <div className="border-l-4 border-secondary pl-4">
                    <h4 className="font-medium">Next Week</h4>
                    <p className="text-sm text-muted-foreground">Speaking fluency exercises and complete 2 full practice tests</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium">Month Goal</h4>
                    <p className="text-sm text-muted-foreground">Achieve consistent 7.5+ scores across all IELTS skills</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Learning Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Learning Patterns</h4>
                  <div className="space-y-2 text-sm">
                    <p>📈 You perform 23% better in morning study sessions</p>
                    <p>🎯 Reading accuracy improves with longer passages</p>
                    <p>⏰ Optimal study duration: 45-60 minutes per session</p>
                    <p>📚 Vocabulary retention is highest with spaced repetition</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Predicted Outcomes</h4>
                  <div className="space-y-2 text-sm">
                    <p>🎯 Current trajectory: IELTS 7.5 in 6 weeks</p>
                    <p>📊 TOEIC 900+ achievable in 8 weeks</p>
                    <p>⚡ With 20% more practice: 2 weeks faster</p>
                    <p>🏆 Test-ready confidence: 4 weeks</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}