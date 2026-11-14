/**
 * Availability of the AI-backed features (Speaking/Writing grading, answer
 * explanations, in-test translation). Flip by setting
 * NEXT_PUBLIC_AI_SERVICE_OPERATIONAL=true at build time.
 */
export const AI_SERVICE_OPERATIONAL = process.env.NEXT_PUBLIC_AI_SERVICE_OPERATIONAL === 'true';

export const AI_SERVICE_NOTICE = {
	title: 'Dịch vụ AI tạm thời không hoạt động',
	message: 'Chấm điểm Speaking, giải thích đáp án và dịch nhanh bằng AI đang tạm ngưng. Bài Writing đã được AI chấm thật, mỗi bài mất khoảng 1–2 phút. Các tính năng khác vẫn dùng bình thường.',
	english: 'AI features are temporarily unavailable.',
};
