/**
 * Availability of the AI-backed features (Speaking/Writing grading, answer
 * explanations, in-test translation). Flip by setting
 * NEXT_PUBLIC_AI_SERVICE_OPERATIONAL=true at build time.
 */
export const AI_SERVICE_OPERATIONAL = process.env.NEXT_PUBLIC_AI_SERVICE_OPERATIONAL === 'true';

/**
 * Site-wide AI notice (top banner and the box on /changelog). Off: only Speaking grading is
 * unavailable, and that page explains it itself. Set to true to bring the notice back.
 */
export const SHOW_AI_NOTICE = false;

export const AI_SERVICE_NOTICE = {
	title: 'Chấm điểm Speaking bằng AI đang tạm ngưng',
	message: 'Luyện Nói (Speaking) tạm thời chưa chấm điểm được. Bài Writing đã được AI chấm thật, mỗi bài mất khoảng 1–2 phút. Các tính năng khác vẫn dùng bình thường.',
	english: 'Speaking grading is temporarily unavailable. Writing is graded by AI.',
};
