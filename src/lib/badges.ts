/** Badge families: which counter of the user's progress unlocks them. */
export type BadgeFamily = 'attempts' | 'goodScore' | 'perfectScore' | 'loginDays' | 'loginStreak';

/** Medal metal, from the first milestone to the hardest one. */
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface BadgeInfo {
	name: string;
	family: BadgeFamily;
	tier: BadgeTier;
	/** Counter value that unlocks it. */
	target: number;
	title: string;
	description: string;
}

/** GET /achievements/badges/my/progress */
export interface BadgeProgress {
	loginProgress?: { total?: number; streak?: number; longestStreak?: number };
	submissionProgress?: { total?: number; goodScore?: number; perfectScore?: number };
}

export const FAMILY_LABELS: Record<BadgeFamily, { title: string; hint: string }> = {
	attempts: { title: 'Chăm chỉ luyện đề', hint: 'Hoàn thành bài thi' },
	goodScore: { title: 'Điểm tốt', hint: 'Đạt điểm tốt' },
	perfectScore: { title: 'Điểm tuyệt đối', hint: 'Đạt điểm tuyệt đối' },
	loginDays: { title: 'Ngày học', hint: 'Tổng số ngày học' },
	loginStreak: { title: 'Chuỗi ngày học', hint: 'Học liên tục nhiều ngày' },
};

export const FAMILY_ORDER: BadgeFamily[] = ['attempts', 'goodScore', 'perfectScore', 'loginDays', 'loginStreak'];

/**
 * The 17 badges of the achievement service (by `name`), with Vietnamese texts. Unknown names still
 * render, using the backend's own texts.
 */
const CATALOGUE: BadgeInfo[] = [
	{ name: 'FIRST_COMPLETE_ATTEMPT', family: 'attempts', tier: 'bronze', target: 1, title: 'Bước đầu tiên', description: 'Hoàn thành bài thi đầu tiên' },
	{ name: 'TENTH_COMPLETE_ATTEMPT', family: 'attempts', tier: 'silver', target: 10, title: 'Khởi động', description: 'Hoàn thành 10 bài thi' },
	{ name: 'HUNDREDTH_COMPLETE_ATTEMPT', family: 'attempts', tier: 'gold', target: 100, title: 'Bách chiến', description: 'Hoàn thành 100 bài thi' },
	{ name: 'FIRST_GOOD_SCORE', family: 'goodScore', tier: 'bronze', target: 1, title: 'Khá lắm!', description: 'Đạt điểm tốt lần đầu' },
	{ name: 'TENTH_GOOD_SCORE', family: 'goodScore', tier: 'silver', target: 10, title: 'Ngày càng giỏi', description: 'Đạt điểm tốt 10 lần' },
	{ name: 'HUNDREDTH_GOOD_SCORE', family: 'goodScore', tier: 'gold', target: 100, title: 'Thói quen xuất sắc', description: 'Đạt điểm tốt 100 lần' },
	{ name: 'FIRST_PERFECT_SCORE', family: 'perfectScore', tier: 'bronze', target: 1, title: 'Hoàn hảo', description: 'Đạt điểm tuyệt đối lần đầu' },
	{ name: 'TENTH_PERFECT_SCORE', family: 'perfectScore', tier: 'silver', target: 10, title: 'Chính xác tuyệt đối', description: 'Đạt điểm tuyệt đối 10 lần' },
	{ name: 'HUNDREDTH_PERFECT_SCORE', family: 'perfectScore', tier: 'gold', target: 100, title: 'Người cầu toàn', description: 'Đạt điểm tuyệt đối 100 lần' },
	{ name: 'LOGIN_SEVEN_DAYS', family: 'loginDays', tier: 'bronze', target: 7, title: 'Bắt nhịp', description: 'Học tổng cộng 7 ngày' },
	{ name: 'LOGIN_TWO_WEEKS', family: 'loginDays', tier: 'silver', target: 14, title: 'Nhà khám phá', description: 'Học tổng cộng 14 ngày' },
	{ name: 'LOGIN_ONE_MONTH', family: 'loginDays', tier: 'gold', target: 30, title: 'Học viên tận tụy', description: 'Học tổng cộng 30 ngày' },
	{ name: 'LOGIN_ONE_YEAR', family: 'loginDays', tier: 'diamond', target: 365, title: 'Tròn một năm', description: 'Học tổng cộng 365 ngày' },
	{ name: 'LOGIN_SEVEN_DAYS_STREAK', family: 'loginStreak', tier: 'bronze', target: 7, title: 'Đều đặn', description: 'Học 7 ngày liên tiếp' },
	{ name: 'LOGIN_TWO_WEEKS_STREAK', family: 'loginStreak', tier: 'silver', target: 14, title: 'Chú ong chăm chỉ', description: 'Học 14 ngày liên tiếp' },
	{ name: 'LOGIN_ONE_MONTH_STREAK', family: 'loginStreak', tier: 'gold', target: 30, title: 'Không ngại khó', description: 'Học 30 ngày liên tiếp' },
	{ name: 'LOGIN_ONE_YEAR_STREAK', family: 'loginStreak', tier: 'diamond', target: 365, title: 'V.I.P', description: 'Học mỗi ngày suốt một năm' },
];

const BY_NAME = new Map(CATALOGUE.map((b) => [b.name, b]));

/** The counter a family is measured by. Streak badges use the longest streak ever reached. */
export const familyValue = (family: BadgeFamily, progress: BadgeProgress | null | undefined): number => {
	const login = progress?.loginProgress;
	const submissions = progress?.submissionProgress;
	switch (family) {
		case 'attempts':
			return submissions?.total ?? 0;
		case 'goodScore':
			return submissions?.goodScore ?? 0;
		case 'perfectScore':
			return submissions?.perfectScore ?? 0;
		case 'loginDays':
			return login?.total ?? 0;
		case 'loginStreak':
			return Math.max(login?.longestStreak ?? 0, login?.streak ?? 0);
	}
};

export interface BadgeView extends BadgeInfo {
	earned: boolean;
	/** When it was earned (ISO), if earned. */
	earnedAt?: string;
	/** Progress toward the target, capped at the target. */
	current: number;
}

/**
 * Every badge with its state: earned ones (and when), locked ones with progress. Badges the
 * catalogue doesn't know are added from the backend list with their own texts.
 */
export function buildBadgeViews(
	all: ReadonlyArray<{ name: string; displayName?: string; description?: string }>,
	earned: ReadonlyArray<{ name: string; date?: string }>,
	progress: BadgeProgress | null | undefined,
): BadgeView[] {
	const earnedAt = new Map(earned.map((e) => [e.name, e.date]));
	const names = [...new Set([...CATALOGUE.map((b) => b.name), ...all.map((b) => b.name), ...earned.map((b) => b.name)])];
	return names
		.map((name): BadgeView => {
			const known = BY_NAME.get(name);
			const remote = all.find((b) => b.name === name);
			const info: BadgeInfo = known ?? {
				name: name,
				family: 'attempts',
				tier: 'bronze',
				target: 1,
				title: remote?.displayName || name,
				description: remote?.description ?? '',
			};
			const isEarned = earnedAt.has(name);
			const value = familyValue(info.family, progress);
			return {
				...info,
				earned: isEarned,
				earnedAt: earnedAt.get(name),
				current: isEarned ? info.target : Math.min(value, info.target),
			};
		})
		.filter((b) => BY_NAME.has(b.name) || all.some((a) => a.name === b.name) || b.earned);
}

/**
 * The locked badge you are closest to (by share of its target), to suggest as the next goal.
 * Badges whose target is already reached but not awarded yet (awarded at the next matching event)
 * are skipped.
 */
export const nextBadge = (views: readonly BadgeView[]): BadgeView | undefined =>
	views
		.filter((b) => !b.earned && b.current < b.target)
		.sort((a, b) => b.current / b.target - a.current / a.target || a.target - b.target)[0];
