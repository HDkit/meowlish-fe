import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Clock, Target, Award, CheckCircle2, Circle, Filter, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { ExamPracticeService } from '@/lib/api/services/ExamPracticeService';
import type { MinimalAttemptInfoDto } from '@/lib/api/models/MinimalAttemptInfoDto';
import type { AttemptsHistoryDto } from '@/lib/api/models/AttemptsHistoryDto';
import { get_users_attempt_history_req_dto_SortOptionsDto } from '@/lib/api/models/get_users_attempt_history_req_dto_SortOptionsDto';

const { key: SortKey, direction: SortDir } = get_users_attempt_history_req_dto_SortOptionsDto;

const LIMIT = 15;

type SortOption = 'endedAt_desc' | 'startedAt_desc' | 'score_desc' | 'score_asc';

const SORT_MAP: Record<SortOption, get_users_attempt_history_req_dto_SortOptionsDto> = {
	endedAt_desc: { key: SortKey.ENDED_AT, direction: SortDir.DESC },
	startedAt_desc: { key: SortKey.STARTED_AT, direction: SortDir.DESC },
	score_desc: { key: SortKey.SCORE, direction: SortDir.DESC },
	score_asc: { key: SortKey.SCORE, direction: SortDir.ASC },
};

function formatDuration(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	if (h > 0) return `${h}h ${m}m`;
	return `${m} phút`;
}

function formatElapsed(startedAt: string, endedAt?: string): string {
	const start = new Date(startedAt).getTime();
	const end = endedAt ? new Date(endedAt).getTime() : Date.now();
	const diffSeconds = Math.round((end - start) / 1000);
	return formatDuration(diffSeconds);
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function getScorePercent(attempt: MinimalAttemptInfoDto): number | null {
	if (attempt.score == null || attempt.totalPoints == null || attempt.totalPoints === 0) return null;
	return Math.round((attempt.score / attempt.totalPoints) * 100);
}

function ScoreColor({ pct }: { pct: number }) {
	const cls = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
	return <span className={`font-semibold ${cls}`}>{pct}%</span>;
}

export function History() {
	const [attempts, setAttempts] = useState<MinimalAttemptInfoDto[]>([]);
	const [cursor, setCursor] = useState<string | undefined>(undefined);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sortOption, setSortOption] = useState<SortOption>('endedAt_desc');

	const fetchHistory = useCallback(
		async (reset: boolean, nextCursor?: string) => {
			try {
				const res = await ExamPracticeService.examPracticeGatewayControllerGetUsersAttemptHistoryV1(
					undefined,
					nextCursor,
					LIMIT,
					SORT_MAP[sortOption],
				);

				if (!res.success || !res.data) {
					throw new Error((res.error as any)?.message ?? 'Không thể tải lịch sử');
				}

				const data = res.data as unknown as AttemptsHistoryDto;
				const newAttempts = data.attempts ?? [];
				const newCursor = data.cursor || undefined;

				setAttempts(prev => (reset ? newAttempts : [...prev, ...newAttempts]));
				setCursor(newCursor);
				setHasMore(newAttempts.length >= LIMIT && !!newCursor);
			} catch (err: any) {
				setError(err?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu');
			}
		},
		[sortOption],
	);

	// Initial load + reload when sort changes
	useEffect(() => {
		setLoading(true);
		setError(null);
		setCursor(undefined);
		setAttempts([]);
		fetchHistory(true).finally(() => setLoading(false));
	}, [sortOption]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleLoadMore = async () => {
		if (!cursor || loadingMore) return;
		setLoadingMore(true);
		await fetchHistory(false, cursor);
		setLoadingMore(false);
	};

	// Stats
	const completed = attempts.filter(a => a.endedAt != null && a.score != null);
	const pcts = completed.map(a => getScorePercent(a)).filter((v): v is number => v !== null);
	const avgScore = pcts.length > 0 ? Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length) : null;
	const bestScore = pcts.length > 0 ? Math.max(...pcts) : null;

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='space-y-2'>
				<h1 className='text-3xl font-semibold'>Lịch sử làm bài</h1>
				<p className='text-muted-foreground'>Xem lại các bài kiểm tra đã hoàn thành và theo dõi tiến bộ của bạn</p>
			</div>

			{/* Stats */}
			<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<Award className='h-5 w-5 text-primary' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Tổng số bài</p>
								<p className='text-2xl font-semibold'>{loading ? '—' : attempts.length}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<CheckCircle2 className='h-5 w-5 text-green-600' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Hoàn thành</p>
								<p className='text-2xl font-semibold'>{loading ? '—' : completed.length}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<Target className='h-5 w-5 text-primary' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Điểm TB</p>
								<p className='text-2xl font-semibold'>{loading ? '—' : avgScore != null ? `${avgScore}%` : '—'}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<Award className='h-5 w-5 text-green-600' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Điểm cao nhất</p>
								<p className='text-2xl font-semibold text-green-600'>
									{loading ? '—' : bestScore != null ? `${bestScore}%` : '—'}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2 text-base'>
						<Filter className='h-4 w-4' />
						Sắp xếp
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='max-w-xs'>
						<Select value={sortOption} onValueChange={(v: SortOption) => setSortOption(v)}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='endedAt_desc'>Ngày kết thúc (mới nhất)</SelectItem>
								<SelectItem value='startedAt_desc'>Ngày bắt đầu (mới nhất)</SelectItem>
								<SelectItem value='score_desc'>Điểm cao nhất</SelectItem>
								<SelectItem value='score_asc'>Điểm thấp nhất</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* List */}
			<Card>
				<CardHeader>
					<CardTitle>
						Lịch sử chi tiết
						{!loading && <span className='font-normal text-muted-foreground text-sm ml-2'>({attempts.length} bài)</span>}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className='flex items-center justify-center py-16 text-muted-foreground gap-2'>
							<Loader2 className='h-5 w-5 animate-spin' />
							<span>Đang tải...</span>
						</div>
					) : error ? (
						<div className='flex items-center justify-center py-16 text-destructive gap-2'>
							<AlertCircle className='h-5 w-5' />
							<span>{error}</span>
						</div>
					) : attempts.length === 0 ? (
						<div className='text-center py-16 text-muted-foreground'>
							<Calendar className='h-12 w-12 mx-auto mb-3 opacity-30' />
							<p>Bạn chưa có bài kiểm tra nào.</p>
						</div>
					) : (
						<div className='space-y-3'>
							{attempts.map(attempt => {
								const isPending = !attempt.endedAt;
								const scorePct = getScorePercent(attempt);

								return (
									<div
										key={attempt.id}
										className='border rounded-lg p-4 hover:bg-muted/50 transition-colors'
									>
										<div className='flex items-center justify-between flex-wrap gap-3'>
											{/* Left: status + dates */}
											<div className='flex items-center gap-3 flex-wrap'>
												{isPending ? (
													<span className='flex items-center gap-1.5 text-amber-600 text-sm font-medium'>
														<Circle className='h-4 w-4' />
														Đang làm
													</span>
												) : (
													<span className='flex items-center gap-1.5 text-green-600 text-sm font-medium'>
														<CheckCircle2 className='h-4 w-4' />
														Hoàn thành
													</span>
												)}

												<div className='text-sm text-muted-foreground flex items-center gap-1'>
													<Calendar className='h-3.5 w-3.5' />
													{formatDate(attempt.startedAt)}
												</div>

												{attempt.isStrict && (
													<span className='text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200'>
														Strict
													</span>
												)}
											</div>

											{/* Right: score, duration, actions */}
											<div className='flex items-center gap-5 flex-wrap'>
												{isPending ? (
													<div className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-sm font-medium'>
														<Loader2 className='h-3.5 w-3.5 animate-spin' />
														Chưa nộp
													</div>
												) : (
													<>
														<div className='text-right'>
															<p className='text-xs text-muted-foreground'>Điểm</p>
															{scorePct != null ? (
																<ScoreColor pct={scorePct} />
															) : (
																<span className='text-sm text-muted-foreground'>Chưa có</span>
															)}
														</div>

														{attempt.score != null && attempt.totalPoints != null && (
															<div className='text-right'>
																<p className='text-xs text-muted-foreground'>Thô</p>
																<span className='font-medium text-sm'>
																	{attempt.score}/{attempt.totalPoints}
																</span>
															</div>
														)}
													</>
												)}

												<div className='text-right'>
													<p className='text-xs text-muted-foreground'>Thời gian</p>
													<span className='font-medium text-sm flex items-center gap-1'>
														<Clock className='h-3.5 w-3.5 text-muted-foreground' />
														{attempt.endedAt
															? formatElapsed(attempt.startedAt, attempt.endedAt)
															: formatDuration(attempt.durationLimit)}
													</span>
												</div>

												<Button
													variant='outline'
													size='sm'
													onClick={() => (window.location.href = `/results/${attempt.id}`)}
												>
													Xem chi tiết
												</Button>
											</div>
										</div>
									</div>
								);
							})}

							{/* Load more */}
							{hasMore && (
								<div className='flex justify-center pt-2'>
									<Button
										variant='outline'
										onClick={handleLoadMore}
										disabled={loadingMore}
										className='gap-2'
									>
										{loadingMore ? (
											<Loader2 className='h-4 w-4 animate-spin' />
										) : (
											<ChevronDown className='h-4 w-4' />
										)}
										Tải thêm
									</Button>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
