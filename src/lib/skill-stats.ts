/** Helpers for the skill analysis on the progress page. */

export type Trend = { direction: 'up' | 'down' | 'flat'; delta: number };

const mean = (ns: number[]): number => ns.reduce((a, b) => a + b, 0) / ns.length;

/**
 * Compares the average of the latest scores with the scores just before them (up to three on each
 * side), so a single lucky or bad attempt doesn't flip the arrow. Null with fewer than 2 points.
 * Changes under 3 points count as flat.
 */
export function skillTrend(points: { percent: number }[]): Trend | null {
	if (points.length < 2) return null;
	const window = Math.min(3, Math.floor(points.length / 2));
	const recent = points.slice(-window).map(p => p.percent);
	const before = points.slice(-2 * window, -window).map(p => p.percent);
	const delta = Math.round(mean(recent) - mean(before));
	if (Math.abs(delta) < 3) return { direction: 'flat', delta: delta };
	return { direction: delta > 0 ? 'up' : 'down', delta: delta };
}

export type Level = { label: string; tone: 'low' | 'mid' | 'high' | 'top' };

export function levelOf(percent: number): Level {
	if (percent >= 80) return { label: 'Vững vàng', tone: 'top' };
	if (percent >= 60) return { label: 'Khá', tone: 'high' };
	if (percent >= 40) return { label: 'Đang tiến bộ', tone: 'mid' };
	return { label: 'Cần luyện thêm', tone: 'low' };
}

export type TagRow = {
	name: string;
	correct: number;
	incorrect: number;
	skipped: number;
	total: number;
	/** 0–100 */
	accuracy: number;
};

/** Tags with their totals and accuracy, weakest first (more questions first on ties). */
export function tagRows(
	tags: { name: string; correct: number; incorrect: number; skipped: number }[],
): TagRow[] {
	return tags
		.map(t => {
			const total = t.correct + t.incorrect + t.skipped;
			return { ...t, total: total, accuracy: total ? Math.round((t.correct / total) * 100) : 0 };
		})
		.filter(t => t.total > 0)
		.sort((a, b) => a.accuracy - b.accuracy || b.total - a.total || a.name.localeCompare(b.name));
}

/**
 * What to practise next: the weakest tags with enough questions behind them to trust the number,
 * below 80% accuracy.
 */
export function focusTags(rows: TagRow[], minQuestions = 5, count = 3): TagRow[] {
	return rows.filter(r => r.total >= minQuestions && r.accuracy < 80).slice(0, count);
}

/** SVG polyline points for a sparkline of 0–100 values, padded so dots aren't clipped. */
export function sparklinePoints(
	values: number[],
	width: number,
	height: number,
	pad = 3,
): { x: number; y: number }[] {
	if (values.length === 0) return [];
	const innerW = width - 2 * pad;
	const innerH = height - 2 * pad;
	const step = values.length > 1 ? innerW / (values.length - 1) : 0;
	return values.map((v, i) => {
		const clamped = Math.min(Math.max(v, 0), 100);
		return {
			x: Math.round((values.length > 1 ? pad + i * step : width / 2) * 10) / 10,
			y: Math.round((pad + innerH - (clamped / 100) * innerH) * 10) / 10,
		};
	});
}

export const SKILL_LABELS: Record<string, string> = {
	LISTENING: 'Nghe',
	READING: 'Đọc',
	WRITING: 'Viết',
	SPEAKING: 'Nói',
};

type SkillLike = { skill: string; attempts: number; lastPercent?: number; averagePercent?: number };

/**
 * One thing to practise next: the weakest question tag with enough data, else the weakest skill
 * already practised. Null when there is nothing to go on yet.
 */
export function practiceSuggestion(
	skills: SkillLike[],
	tags: { name: string; correct: number; incorrect: number; skipped: number }[],
): { title: string; detail: string; href: string } | null {
	const [tag] = focusTags(tagRows(tags), 5, 1);
	if (tag) {
		return {
			title: `ôn dạng “${tag.name}”`,
			detail: `Bạn đúng ${tag.accuracy}% trên ${tag.total} câu gần đây, thấp nhất trong các dạng câu hỏi.`,
			href: `/test-selection?tag=${encodeURIComponent(tag.name)}`,
		};
	}
	const weakest = skills
		.filter(s => s.attempts > 0 && s.averagePercent !== undefined && s.averagePercent < 80)
		.sort((a, b) => (a.averagePercent ?? 0) - (b.averagePercent ?? 0))[0];
	if (weakest) {
		return {
			title: `luyện kỹ năng ${SKILL_LABELS[weakest.skill]?.toLowerCase() ?? weakest.skill}`,
			detail: `Điểm trung bình ${Math.round(weakest.averagePercent ?? 0)}%, thấp nhất trong các kỹ năng bạn đã luyện.`,
			href: weakest.skill === 'SPEAKING' ? '/speaking' : '/test-selection',
		};
	}
	return null;
}
