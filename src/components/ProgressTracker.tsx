'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { ExamPracticeService } from '@/lib/api';
import type { UserStatsDto } from '@/lib/api/models/UserStatsDto';
import type { UserCalendarDto } from '@/lib/api/models/UserCalendarDto';
import type { AttemptsHistoryDto } from '@/lib/api/models/AttemptsHistoryDto';
import {
  Target,
  Trophy,
  CalendarDays,
  Clock,
  FileText,
  TrendingUp,
  Loader2,
  CheckCircle2,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

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

  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/60';
    if (count === 1) return 'bg-green-200 dark:bg-green-800/50';
    if (count === 2) return 'bg-green-400 dark:bg-green-600/70';
    return 'bg-green-600 dark:bg-green-500';
  };

  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div>
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
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Tiến Độ Học Tập</h2>
          <p className="text-muted-foreground">Theo dõi quá trình luyện tập của bạn</p>
        </div>
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Tiến Độ Học Tập</h2>
        <p className="text-muted-foreground">Theo dõi quá trình luyện tập của bạn</p>
      </div>

      {/* Overview Cards */}
      {computedStats && (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bài đã làm</p>
                <p className="text-2xl font-bold">{computedStats.attemptCounts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Điểm trung bình</p>
                <p className={`text-2xl font-bold ${getScoreColor(computedStats.averageScoreInPercentage)}`}>
                  {Math.round(computedStats.averageScoreInPercentage)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày đã luyện</p>
                <p className="text-2xl font-bold">{activeDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Tag Performance */}
      {sortedTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Phân tích theo chủ đề
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
  );
}
