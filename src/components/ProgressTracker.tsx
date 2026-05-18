'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { ExamPracticeService } from '@/lib/api';
import type { UserStatsDto } from '@/lib/api/models/UserStatsDto';
import type { UserCalendarDto } from '@/lib/api/models/UserCalendarDto';
import type { AttemptsHistoryDto } from '@/lib/api/models/AttemptsHistoryDto';
import type { TagInfoDto } from '@/lib/api/models/TagInfoDto';
import {
  Target,
  Trophy,
  CalendarDays,
  Clock,
  FileText,
  TrendingUp,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Flame,
  Zap,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Award,
  Brain,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

// ─── Helpers ───

function getScoreColor(pct: number) {
  if (pct >= 70) return 'text-green-600 dark:text-green-400';
  if (pct >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function getIndicatorClass(pct: number) {
  if (pct >= 70) return '[&_[data-slot=progress-indicator]]:bg-green-500';
  if (pct >= 40) return '[&_[data-slot=progress-indicator]]:bg-amber-500';
  return '[&_[data-slot=progress-indicator]]:bg-red-500';
}

function computeStreak(calendarData: Record<string, number>): { current: number; best: number } {
  const days = Object.entries(calendarData)
    .filter(([, count]) => count > 0)
    .map(([epoch]) => {
      const d = new Date(Number(epoch) * 1000);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
    .sort((a, b) => a - b);

  if (days.length === 0) return { current: 0, best: 0 };

  const ONE_DAY = 86400000;
  let best = 1;
  let streak = 1;

  for (let i = 1; i < days.length; i++) {
    const diff = days[i] - days[i - 1];
    if (diff === ONE_DAY) {
      streak++;
      best = Math.max(best, streak);
    } else if (diff > ONE_DAY) {
      streak = 1;
    }
  }
  best = Math.max(best, streak);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = days[days.length - 1];
  const daysSinceLast = (today.getTime() - lastDay) / ONE_DAY;
  const currentStreak = daysSinceLast <= 1 ? streak : 0;

  return { current: currentStreak, best };
}

function getBarColor(pct: number) {
  if (pct >= 70) return '#22c55e';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

// ─── Activity Heatmap ───

function ActivityHeatmap({ data }: { data: Record<string, number> }) {
  const weeks = useMemo(() => {
    const dateMap = new Map<string, number>();
    for (const [epochStr, count] of Object.entries(data)) {
      const date = new Date(Number(epochStr) * 1000);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dateMap.set(key, (dateMap.get(key) || 0) + count);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - (25 * 7 + today.getDay()));

    const grid: { date: Date; count: number }[][] = [];
    let week: { date: Date; count: number }[] = [];

    const current = new Date(start);
    while (current <= today) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const count = dateMap.get(key) || 0;
      week.push({ date: new Date(current), count });

      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
      current.setDate(current.getDate() + 1);
    }
    if (week.length > 0) grid.push(week);

    return grid;
  }, [data]);

  const totalPracticed = useMemo(
    () => Object.values(data).reduce((s, v) => s + v, 0),
    [data],
  );

  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/60';
    if (count === 1) return 'bg-green-200 dark:bg-green-800/50';
    if (count === 2) return 'bg-green-400 dark:bg-green-600/70';
    return 'bg-green-600 dark:bg-green-500';
  };

  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{totalPracticed}</span> bài luyện tập trong 6 tháng
        </p>
      </div>
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        <div className="flex flex-col gap-[3px] mr-1 shrink-0">
          {dayLabels.map((d, i) => (
            <div key={i} className="h-[13px] text-[10px] text-muted-foreground flex items-center leading-none">
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-[13px] h-[13px] rounded-[3px] ${getCellColor(day.count)} transition-colors`}
                title={`${day.date.toLocaleDateString('vi-VN')}: ${day.count} lần`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground justify-end">
        <span>Ít</span>
        <div className="flex gap-[3px]">
          <div className="w-[13px] h-[13px] rounded-[3px] bg-slate-100 dark:bg-slate-800/60" />
          <div className="w-[13px] h-[13px] rounded-[3px] bg-green-200 dark:bg-green-800/50" />
          <div className="w-[13px] h-[13px] rounded-[3px] bg-green-400 dark:bg-green-600/70" />
          <div className="w-[13px] h-[13px] rounded-[3px] bg-green-600 dark:bg-green-500" />
        </div>
        <span>Nhiều</span>
      </div>
    </div>
  );
}

// ─── Score Trend Chart ───

function ScoreTrendChart({ data }: { data: { date: string; score: number; name: string }[] }) {
  if (data.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <RechartsTooltip
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--card))',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            padding: '10px 14px',
          }}
          formatter={(value: number, _: string, props: any) => [
            `${value}%`,
            props.payload.name,
          ]}
          labelFormatter={() => ''}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          fill="url(#scoreGradient)"
          dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Skill Radar ───

function SkillRadarChart({ tags }: { tags: TagInfoDto[] }) {
  const data = tags.map((t) => ({
    subject: t.name.length > 12 ? t.name.slice(0, 12) + '…' : t.name,
    fullName: t.name,
    score: Math.round(t.correctPercentage),
  }));

  if (data.length < 3) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v) => `${v}%`}
        />
        <Radar
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <RechartsTooltip
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--card))',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            padding: '10px 14px',
          }}
          formatter={(value: number, _: string, props: any) => [
            `${value}%`,
            props.payload.fullName,
          ]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Skill Bar Chart (fallback when < 3 tags or mobile) ───

function SkillBarChart({ tags }: { tags: TagInfoDto[] }) {
  const data = [...tags]
    .sort((a, b) => b.correctPercentage - a.correctPercentage)
    .map((t) => ({
      name: t.name,
      score: Math.round(t.correctPercentage),
    }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v) => `${v}%`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <RechartsTooltip
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--card))',
            padding: '8px 12px',
          }}
          formatter={(value: number) => [`${value}%`, 'Đúng']}
        />
        <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={getBarColor(entry.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Insight Card ───

function InsightCard({
  icon: Icon,
  iconBg,
  title,
  value,
  description,
}: {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border/50">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <p className="font-bold text-sm mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───

export function ProgressTracker() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStatsDto | null>(null);
  const [calendar, setCalendar] = useState<UserCalendarDto | null>(null);
  const [history, setHistory] = useState<AttemptsHistoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const results = await Promise.allSettled([
        ExamPracticeService.examPracticeGatewayControllerGetUsesStatsV1(),
        ExamPracticeService.examPracticeGatewayControllerGetUsersAttemptSummaryV1({
          from: sixMonthsAgo.toISOString(),
          to: now.toISOString(),
        }),
        ExamPracticeService.examPracticeGatewayControllerGetUsersAttemptHistoryV1(
          undefined, undefined, 50
        ),
      ]);

      const [statsResult, calendarResult, historyResult] = results;

      if (statsResult.status === 'fulfilled' && statsResult.value.data) {
        setStats(statsResult.value.data as UserStatsDto);
      }
      if (calendarResult.status === 'fulfilled' && calendarResult.value.data) {
        setCalendar(calendarResult.value.data as UserCalendarDto);
      }
      if (historyResult.status === 'fulfilled' && historyResult.value.data) {
        setHistory(historyResult.value.data as AttemptsHistoryDto);
      }

      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        console.error('All API calls failed:', results);
        setError('Không thể tải dữ liệu tiến độ. Vui lòng thử lại sau.');
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const sortedTags = useMemo(() => {
    if (!stats?.tagInfos) return [];
    return [...stats.tagInfos].sort((a, b) => a.correctPercentage - b.correctPercentage);
  }, [stats]);

  const computedStats = useMemo(() => {
    if (stats) return stats;
    if (!history?.attempts?.length) return null;

    const completed = history.attempts.filter(a => a.endedAt && a.score != null && a.totalPoints);
    if (completed.length === 0) return null;

    const avgScore = completed.reduce((sum, a) => sum + ((a.score! / a.totalPoints!) * 100), 0) / completed.length;

    return {
      attemptCounts: history.attempts.length,
      averageScoreInPercentage: avgScore,
      tagInfos: [],
    } as UserStatsDto;
  }, [stats, history]);

  const activeDays = useMemo(() => {
    if (!calendar?.history) return 0;
    return Object.values(calendar.history).filter(v => v > 0).length;
  }, [calendar]);

  const streakData = useMemo(() => {
    if (!calendar?.history) return { current: 0, best: 0 };
    return computeStreak(calendar.history);
  }, [calendar]);

  const scoreTrend = useMemo(() => {
    if (!history?.attempts) return [];
    return history.attempts
      .filter(a => a.endedAt && a.score != null && a.totalPoints)
      .sort((a, b) => new Date(a.endedAt!).getTime() - new Date(b.endedAt!).getTime())
      .map(a => ({
        date: new Date(a.endedAt!).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        score: Math.round((a.score! / a.totalPoints!) * 100),
        name: a.examName,
      }));
  }, [history]);

  const bestScore = useMemo(() => {
    if (!history?.attempts) return null;
    const scores = history.attempts
      .filter(a => a.endedAt && a.score != null && a.totalPoints)
      .map(a => Math.round((a.score! / a.totalPoints!) * 100));
    return scores.length > 0 ? Math.max(...scores) : null;
  }, [history]);

  const insights = useMemo(() => {
    const result = {
      strongest: null as TagInfoDto | null,
      weakest: null as TagInfoDto | null,
      trend: 'stable' as 'improving' | 'declining' | 'stable',
      trendDiff: 0,
    };

    if (sortedTags.length > 0) {
      result.strongest = sortedTags[sortedTags.length - 1];
      result.weakest = sortedTags[0];
    }

    if (scoreTrend.length >= 4) {
      const half = Math.floor(scoreTrend.length / 2);
      const recentAvg = scoreTrend.slice(-half).reduce((s, v) => s + v.score, 0) / half;
      const olderAvg = scoreTrend.slice(0, half).reduce((s, v) => s + v.score, 0) / half;
      result.trendDiff = Math.round(recentAvg - olderAvg);
      result.trend = result.trendDiff > 3 ? 'improving' : result.trendDiff < -3 ? 'declining' : 'stable';
    }

    return result;
  }, [sortedTags, scoreTrend]);

  // ─── Render states ───

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Đang tải dữ liệu tiến độ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <Target className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-destructive font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!computedStats && (!history?.attempts?.length)) {
    return (
      <div className="pb-20">
        <div className="relative overflow-hidden bg-primary text-white shadow-xl mb-10 pt-16 pb-20 px-4 md:px-6 lg:px-8 xl:px-10 text-center">
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-bold shadow-sm mb-2">
              <TrendingUp className="w-4 h-4" /> TIẾN ĐỘ HỌC TẬP
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight mb-5">
              Theo Dõi Tiến Độ
            </h2>
            <p className="text-primary-foreground/80 text-lg md:text-xl font-medium">
              Phân tích chi tiết quá trình luyện tập, điểm mạnh và điểm cần cải thiện của bạn.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 -mt-12 relative z-10">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-14 text-center space-y-5">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Chưa có dữ liệu</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hãy làm bài thi thử để bắt đầu<br />theo dõi tiến độ học tập.
                </p>
              </div>
              <button
                onClick={() => router.push('/test-selection')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Chọn đề thi
                <ChevronRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasInsights = insights.strongest || insights.weakest || insights.trend !== 'stable';

  return (
    <div className="pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-primary text-white shadow-xl mb-10 pt-16 pb-24 px-4 md:px-6 lg:px-8 xl:px-10 text-center">
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-bold shadow-sm mb-2">
            <TrendingUp className="w-4 h-4" /> TIẾN ĐỘ HỌC TẬP
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight mb-5">
            Theo Dõi Tiến Độ
          </h2>
          <p className="text-primary-foreground/80 text-lg md:text-xl font-medium">
            Phân tích chi tiết quá trình luyện tập, điểm mạnh và điểm cần cải thiện của bạn.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-6 -mt-16 relative z-10">

        {/* Stats Overview - 4 Cards */}
        {computedStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-lg border-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Bài đã làm</p>
                    <p className="text-2xl font-bold">{computedStats.attemptCounts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Điểm trung bình</p>
                    <p className={`text-2xl font-bold ${getScoreColor(computedStats.averageScoreInPercentage)}`}>
                      {Math.round(computedStats.averageScoreInPercentage)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Streak hiện tại</p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-2xl font-bold">{streakData.current}</p>
                      <span className="text-xs text-muted-foreground">ngày</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Star className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Điểm cao nhất</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {bestScore != null ? `${bestScore}%` : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Personalized Insights */}
        {hasInsights && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Nhận xét cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {insights.strongest && (
                  <InsightCard
                    icon={Zap}
                    iconBg="bg-green-100 dark:bg-green-900/30 text-green-600"
                    title="Điểm mạnh nhất"
                    value={insights.strongest.name}
                    description={`Tỉ lệ đúng ${Math.round(insights.strongest.correctPercentage)}% — bạn nắm rất tốt chủ đề này!`}
                  />
                )}
                {insights.weakest && insights.weakest.name !== insights.strongest?.name && (
                  <InsightCard
                    icon={Brain}
                    iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                    title="Cần cải thiện"
                    value={insights.weakest.name}
                    description={`Tỉ lệ đúng ${Math.round(insights.weakest.correctPercentage)}% — hãy luyện thêm chủ đề này.`}
                  />
                )}
                {insights.trend !== 'stable' && (
                  <InsightCard
                    icon={insights.trend === 'improving' ? ArrowUpRight : ArrowDownRight}
                    iconBg={insights.trend === 'improving'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-500'}
                    title="Xu hướng"
                    value={insights.trend === 'improving' ? 'Đang tiến bộ!' : 'Cần nỗ lực thêm'}
                    description={`Điểm trung bình ${insights.trend === 'improving' ? 'tăng' : 'giảm'} ${Math.abs(insights.trendDiff)}% so với giai đoạn trước.`}
                  />
                )}
                {insights.trend === 'stable' && scoreTrend.length >= 4 && (
                  <InsightCard
                    icon={Minus}
                    iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                    title="Xu hướng"
                    value="Ổn định"
                    description="Điểm số của bạn khá đều đặn. Hãy thử thách bản thân với đề khó hơn!"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section — 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Trend */}
          {scoreTrend.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Biểu đồ điểm số
                  {insights.trend !== 'stable' && (
                    <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                      insights.trend === 'improving'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      {insights.trend === 'improving' ? '+' : ''}{insights.trendDiff}%
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreTrendChart data={scoreTrend} />
              </CardContent>
            </Card>
          )}

          {/* Skill Radar/Bar */}
          {sortedTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Phân tích kỹ năng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedTags.length >= 3 ? (
                  <>
                    <div className="hidden md:block">
                      <SkillRadarChart tags={sortedTags} />
                    </div>
                    <div className="md:hidden">
                      <SkillBarChart tags={sortedTags} />
                    </div>
                  </>
                ) : (
                  <SkillBarChart tags={sortedTags} />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tag Performance Detail (full width) */}
        {sortedTags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-primary" />
                Chi tiết theo chủ đề
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedTags.map((tag) => (
                <div key={tag.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate mr-3">{tag.name}</span>
                    <span className={`font-semibold tabular-nums shrink-0 ${getScoreColor(tag.correctPercentage)}`}>
                      {Math.round(tag.correctPercentage)}%
                    </span>
                  </div>
                  <Progress
                    value={tag.correctPercentage}
                    className={`h-2.5 bg-slate-100 dark:bg-slate-800/60 ${getIndicatorClass(tag.correctPercentage)}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Achievements Row */}
        {(streakData.best > 0 || activeDays > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-primary" />
                Thành tích
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border border-orange-200/50 dark:border-orange-800/30">
                  <Flame className="h-8 w-8 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-lg font-bold">{streakData.best}</p>
                    <p className="text-xs text-muted-foreground">Streak kỷ lục</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border border-green-200/50 dark:border-green-800/30">
                  <CalendarDays className="h-8 w-8 text-green-500 shrink-0" />
                  <div>
                    <p className="text-lg font-bold">{activeDays}</p>
                    <p className="text-xs text-muted-foreground">Ngày đã luyện</p>
                  </div>
                </div>
                {bestScore != null && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
                    <Star className="h-8 w-8 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-lg font-bold">{bestScore}%</p>
                      <p className="text-xs text-muted-foreground">Điểm cao nhất</p>
                    </div>
                  </div>
                )}
                {computedStats && computedStats.attemptCounts >= 10 && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/50 dark:border-purple-800/30">
                    <CheckCircle2 className="h-8 w-8 text-purple-500 shrink-0" />
                    <div>
                      <p className="text-lg font-bold">{computedStats.attemptCounts}</p>
                      <p className="text-xs text-muted-foreground">Bài hoàn thành</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Calendar */}
        {calendar?.history && Object.keys(calendar.history).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary" />
                Lịch luyện tập
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap data={calendar.history} />
            </CardContent>
          </Card>
        )}

        {/* Recent Attempts */}
        {history?.attempts && history.attempts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Lịch sử gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.attempts.map((attempt) => {
                  const scorePercent = attempt.score != null && attempt.totalPoints
                    ? Math.round((attempt.score / attempt.totalPoints) * 100)
                    : null;
                  const dateStr = attempt.endedAt
                    ? new Date(attempt.endedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'Đang làm';

                  return (
                    <div
                      key={attempt.id}
                      onClick={() => router.push(`/results/${attempt.id}/detail`)}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          scorePercent != null && scorePercent >= 70
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : scorePercent != null
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          {scorePercent != null ? (
                            scorePercent >= 70
                              ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                              : <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{attempt.examName}</p>
                          <p className="text-xs text-muted-foreground">{dateStr}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {scorePercent != null && (
                          <span className={`font-bold text-sm tabular-nums ${getScoreColor(scorePercent)}`}>
                            {attempt.score}/{attempt.totalPoints}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
