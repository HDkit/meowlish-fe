import { Report, ReportCategory, ReportStatus } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const reports: Report[] = [
	{
		id: 'rep1',
		userId: 'u2',
		category: ReportCategory.Bug,
		title: 'Lỗi hiển thị câu hỏi',
		description: 'Câu hỏi số 2 trong đề thi IELTS Reading bị lỗi hiển thị, không thấy các lựa chọn đáp án.',
		targetType: 'exam',
		targetId: 'e1',
		status: ReportStatus.Resolved,
		adminResponse: 'Đã sửa lỗi hiển thị. Cảm ơn bạn đã báo cáo!',
		reviewedBy: 'u1',
		createdAt: Date.now() - 604800000,
		updatedAt: Date.now() - 432000000,
	},
	{
		id: 'rep2',
		userId: 'u3',
		category: ReportCategory.Content,
		title: 'Nội dung không phù hợp',
		description: 'Bài blog "Review EnglishAI Pro" có chứa link quảng cáo ngoài không liên quan.',
		targetType: 'blog',
		targetId: 'b4',
		status: ReportStatus.Reviewing,
		createdAt: Date.now() - 259200000,
	},
	{
		id: 'rep3',
		userId: 'u2',
		category: ReportCategory.Behavior,
		title: 'Người dùng spam bình luận',
		description: 'Người dùng liên tục gửi bình luận rác trong phần comment của đề thi.',
		targetType: 'user',
		targetId: 'u4',
		status: ReportStatus.Pending,
		createdAt: Date.now() - 172800000,
	},
	{
		id: 'rep4',
		userId: 'u1',
		category: ReportCategory.Bug,
		title: 'Timer bị lỗi khi tạm dừng',
		description: 'Khi nhấn nút tạm dừng (pause) trong lúc làm bài thi, timer vẫn tiếp tục chạy. Đã thử trên nhiều trình duyệt.',
		targetType: 'exam',
		targetId: 'e2',
		status: ReportStatus.Pending,
		createdAt: Date.now() - 86400000,
	},
	{
		id: 'rep5',
		userId: 'u3',
		category: ReportCategory.Content,
		title: 'Đáp án sai ở câu 15',
		description: 'Đề thi TOEIC Listening Part 3, câu 15 đáp án đúng là B nhưng hệ thống chấm là C.',
		targetType: 'exam',
		targetId: 'e3',
		status: ReportStatus.Rejected,
		adminResponse: 'Đã kiểm tra lại, đáp án C là đúng theo Official Guide. Vui lòng xem lại giải thích chi tiết.',
		reviewedBy: 'u1',
		createdAt: Date.now() - 432000000,
		updatedAt: Date.now() - 345600000,
	},
];

const reportsSlice = createGenericSlice<Report>('reports', reports);

export const {
	addItem: addReport,
	updateItem: updateReport,
	removeItem: removeReport,
	setList: setReports,
} = reportsSlice.actions;
export default reportsSlice.reducer;
