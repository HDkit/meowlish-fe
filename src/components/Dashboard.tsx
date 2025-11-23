import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { BookOpen, Headphones, Mic, PenTool, Target, Clock, TrendingUp } from 'lucide-react';
import type { TestType, Skill, User } from '../App';

interface DashboardProps {
  onStartTest: (testType: TestType, skill: Skill) => void;
  onGoToTestSelection: () => void;
  user: User | null;
}

export function Dashboard({ onStartTest, onGoToTestSelection, user }: DashboardProps) {
  const skillIcons = {
    reading: BookOpen,
    listening: Headphones,
    speaking: Mic,
    writing: PenTool
  };

  const mockProgress = {
    ielts: { current: user?.progress?.ieltsScore || 6.5, target: 7.5, progress: 65 },
    toeic: { current: user?.progress?.toeicScore || 750, target: 900, progress: 83 },
    dailyGoal: { completed: 3, total: 5, progress: 60 },
    streak: user?.progress?.studyStreak || 7
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-semibold">
          Chào mừng {user?.fullName ? user.fullName.split(' ').slice(-1)[0] : 'bạn'} 👋
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Hãy tiếp tục hành trình chinh phục IELTS và TOEIC với hệ thống AI thông minh. 
          Nhận câu hỏi cá nhân hóa và phản hồi tức thì.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              IELTS Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{mockProgress.ielts.current}</span>
              <span className="text-sm text-muted-foreground">/ {mockProgress.ielts.target}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              TOEIC Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{mockProgress.toeic.current}</span>
              <span className="text-sm text-muted-foreground">/ {mockProgress.toeic.target}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Study Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{mockProgress.streak}</span>
              <span className="text-sm text-muted-foreground">ngày</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* IELTS Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              IELTS Practice
              <Badge variant="secondary">International</Badge>
            </CardTitle>
            <CardDescription>
              International English Language Testing System for academic and general purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(['reading', 'listening', 'writing', 'speaking'] as Skill[]).map((skill) => {
                const Icon = skillIcons[skill];
                return (
                  <Button
                    key={skill}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => onStartTest('ielts', skill)}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="capitalize">{skill}</span>
                  </Button>
                );
              })}
            </div>
            
            <div className="pt-4 border-t">
              <Button className="w-full" onClick={onGoToTestSelection}>
                Xem tất cả đề thi IELTS
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TOEIC Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              TOEIC Practice
              <Badge variant="secondary">Business</Badge>
            </CardTitle>
            <CardDescription>
              Test of English for International Communication for workplace English
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(['reading', 'listening'] as Skill[]).map((skill) => {
                const Icon = skillIcons[skill];
                return (
                  <Button
                    key={skill}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => onStartTest('toeic', skill)}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="capitalize">{skill}</span>
                  </Button>
                );
              })}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <PenTool className="h-6 w-6" />
                Writing
                <Badge variant="outline" size="sm">Coming Soon</Badge>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Mic className="h-6 w-6" />
                Speaking
                <Badge variant="outline" size="sm">Coming Soon</Badge>
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <Button className="w-full" onClick={onGoToTestSelection}>
                Xem tất cả đề thi TOEIC
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Features Highlight */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Features</CardTitle>
          <CardDescription>
            Experience personalized learning with our advanced AI technology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">Adaptive Questions</h4>
              <p className="text-sm text-muted-foreground">
                Questions automatically adjust to your skill level for optimal learning
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">Instant Feedback</h4>
              <p className="text-sm text-muted-foreground">
                Get detailed explanations and improvement suggestions immediately
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">Personalized Path</h4>
              <p className="text-sm text-muted-foreground">
                AI creates custom study plans based on your strengths and weaknesses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}