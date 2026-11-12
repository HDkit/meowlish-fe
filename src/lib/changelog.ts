/**
 * Release history shown on /changelog and in the "what's new" dialog.
 * Newest first. The first entry's version is the app's current version
 * (keep package.json "version" in sync when adding a release).
 */

export type ChangeType = 'new' | 'improved' | 'fixed' | 'notice';

export interface ChangeItem {
	type: ChangeType;
	text: string;
}

export interface Release {
	version: string;
	/** ISO date (YYYY-MM-DD) */
	date: string;
	title: string;
	summary?: string;
	changes: ChangeItem[];
}

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
	notice: 'Lưu ý',
	new: 'Mới',
	improved: 'Cải thiện',
	fixed: 'Sửa lỗi',
};

export const RELEASES: Release[] = [
	{
		version: '0.9.0',
		date: '2026-11-12',
		title: 'Đăng nhập bằng cookie & chấm Writing thử nghiệm',
		summary:
			'Phiên đăng nhập an toàn hơn và bài Writing đã có điểm trở lại, nhưng đó là điểm mẫu ngẫu nhiên để thử nghiệm, không phải AI chấm thật.',
		changes: [
			{
				type: 'notice',
				text: 'Chấm điểm Writing hiện dùng dịch vụ mô phỏng: sau vài giây chờ, bài làm nhận điểm và nhận xét ngẫu nhiên. Điểm này chỉ để thử nghiệm luồng chấm bài, không phản ánh trình độ thật.',
			},
			{ type: 'improved', text: 'Phiên đăng nhập được lưu trong cookie HttpOnly thay vì bộ nhớ trình duyệt.' },
			{ type: 'improved', text: 'Đổi mật khẩu yêu cầu nhập mật khẩu hiện tại.' },
			{ type: 'improved', text: 'Liên kết tài khoản Google bằng cách chuyển trang thay vì gọi API nền, ổn định hơn.' },
			{ type: 'fixed', text: 'Sửa thẻ của đề thi, phần thi và câu hỏi khi chỉnh sửa (lưu theo ID).' },
			{ type: 'fixed', text: 'Không còn bị đăng xuất khi gửi yêu cầu quá nhanh (lỗi 429); tài khoản bị khóa sẽ được đăng xuất ngay.' },
		],
	},
	{
		version: '0.8.0',
		date: '2026-11-12',
		title: 'Tạm ngưng dịch vụ AI & trang cập nhật',
		summary:
			'Các tính năng dùng AI đang tạm ngưng. Những phần còn lại của Lingriser vẫn hoạt động bình thường.',
		changes: [
			{
				type: 'notice',
				text: 'Dịch vụ AI tạm thời không hoạt động: chấm điểm Speaking/Writing, giải thích đáp án bằng AI và dịch nhanh trong bài thi sẽ không trả kết quả cho đến khi có thông báo mới.',
			},
			{ type: 'new', text: 'Trang "Có gì mới" và cửa sổ thông báo khi có phiên bản mới.' },
			{ type: 'new', text: 'Thông báo trạng thái dịch vụ AI luôn hiển thị trên mọi trang.' },
			{ type: 'fixed', text: 'Sửa lỗi hiển thị (hydration) trên Dashboard, Flashcards, Phòng Chat và Quản lý User.' },
			{ type: 'fixed', text: 'Các yêu cầu API khi chạy local không còn bị gửi nhầm lên máy chủ production.' },
			{ type: 'improved', text: 'Cập nhật thư viện (Next.js 15.5, Radix UI) và dọn dẹp tài liệu cũ.' },
			{ type: 'improved', text: 'Thay bộ kiểm thử Playwright bằng unit test Vitest gọn nhẹ.' },
		],
	},
	{
		version: '0.7.0',
		date: '2026-06-10',
		title: 'Blog, báo cáo nội dung & kiểm thử E2E',
		changes: [
			{ type: 'new', text: 'Lọc blog theo nhiều thẻ cùng lúc, xử lý ngay trên máy chủ.' },
			{ type: 'new', text: 'Chọn khoảng thời gian tùy ý cho lịch hoạt động trên Dashboard.' },
			{ type: 'new', text: 'Báo cáo flashcard và bộ flashcard vi phạm.' },
			{ type: 'new', text: 'Gắn nhiều thẻ cho mỗi flashcard.' },
			{ type: 'improved', text: 'Hiển thị lỗi đăng nhập/đăng ký ngay tại từng ô nhập liệu.' },
			{ type: 'improved', text: 'Bộ kiểm thử end-to-end bằng Playwright cho các luồng chính.' },
			{ type: 'fixed', text: 'Ảnh đại diện sau khi tải lên hiển thị đúng; phân trang luôn hiển thị.' },
		],
	},
	{
		version: '0.6.0',
		date: '2026-05-27',
		title: 'Làm bài thông minh hơn & Flashcard cộng đồng',
		changes: [
			{ type: 'new', text: 'Đánh dấu câu hỏi và ghi chú ngay trong lúc làm bài.' },
			{ type: 'new', text: 'Bôi đen để dịch nhanh trong bài thi (dùng AI).' },
			{ type: 'new', text: 'Tab "Khám phá" với các bộ flashcard công khai; đặt chế độ công khai và thẻ cho bộ flashcard.' },
			{ type: 'new', text: 'Phân trang phía máy chủ cho các trang danh sách.' },
			{ type: 'new', text: 'Kiểm duyệt viên có thể duyệt/từ chối đề thi và cấm người dùng trong phòng chat.' },
			{ type: 'improved', text: 'Bảng theo dõi câu hỏi thu gọn được, skeleton khi tải trang làm bài.' },
			{ type: 'improved', text: 'Thông báo lỗi thân thiện hơn, tự động thử lại khi máy chủ gián đoạn.' },
			{ type: 'fixed', text: 'Tin nhắn chat không còn bị lặp; sửa độ rộng thanh bên khi thu gọn.' },
		],
	},
	{
		version: '0.5.0',
		date: '2026-05-19',
		title: 'Lingriser: cộng đồng & quản trị',
		changes: [
			{ type: 'new', text: 'Đổi tên ứng dụng thành Lingriser, logo và giao diện mới.' },
			{ type: 'new', text: 'Phòng chat, livestream và lịch phòng học.' },
			{ type: 'new', text: 'Thông báo, quản lý báo cáo và vai trò Kiểm duyệt viên (Mod).' },
			{ type: 'new', text: 'Mục tiêu học tập, thống kê và biểu đồ tiến độ kết nối dữ liệu thật.' },
			{ type: 'new', text: 'Khóa/mở khóa tài khoản và tìm người dùng theo số điện thoại.' },
			{ type: 'improved', text: 'Tối ưu SEO: metadata, robots.txt và sitemap.' },
		],
	},
	{
		version: '0.4.0',
		date: '2026-05-06',
		title: 'Đăng nhập Google & chấm Writing bằng AI',
		changes: [
			{ type: 'new', text: 'Đăng nhập bằng tài khoản Google.' },
			{ type: 'new', text: 'Chấm bài Writing bằng AI chạy nền, xem kết quả khi hoàn tất.' },
			{ type: 'improved', text: 'Lịch sử làm bài và chuyển hướng đăng nhập ổn định hơn.' },
			{ type: 'improved', text: 'Làm mới trang luyện Speaking và Writing.' },
		],
	},
	{
		version: '0.3.0',
		date: '2026-04-29',
		title: 'Giao diện "Spring Garden"',
		changes: [
			{ type: 'new', text: 'Thiết kế lại toàn bộ giao diện: màu sắc thống nhất, landing page dạng bento.' },
			{ type: 'new', text: 'Điều hướng mới: thanh trên cho trang giới thiệu, thanh bên thu gọn được trong ứng dụng.' },
			{ type: 'new', text: 'Chuỗi ngày học, biểu đồ radar kỹ năng và thành tích.' },
			{ type: 'improved', text: 'Kết nối API thật cho tạo đề, đăng nhập và quản lý thẻ.' },
			{ type: 'fixed', text: 'Âm thanh và hình ảnh trong bài thi hiển thị đúng.' },
		],
	},
	{
		version: '0.2.0',
		date: '2026-03-05',
		title: 'Chuyển sang Next.js & công cụ cho nhân viên',
		changes: [
			{ type: 'new', text: 'Chuyển toàn bộ ứng dụng sang Next.js.' },
			{ type: 'new', text: 'Tạo đề thi và duyệt đề cho quản trị viên.' },
			{ type: 'new', text: 'Tính năng dành cho Staff và Head Staff.' },
			{ type: 'improved', text: 'Việt hóa giao diện và làm mới trang Flashcard.' },
		],
	},
	{
		version: '0.1.0',
		date: '2025-12-04',
		title: 'Phiên bản đầu tiên',
		changes: [
			{ type: 'new', text: 'Chọn đề, làm bài thi và xem kết quả chi tiết.' },
			{ type: 'new', text: 'Giải thích đáp án bằng AI và bài thi Writing.' },
			{ type: 'new', text: 'Bôi đen văn bản để tạo flashcard.' },
			{ type: 'new', text: 'Trang cá nhân, lịch sử làm bài và so sánh kỹ năng.' },
		],
	},
];

export const CURRENT_RELEASE: Release = RELEASES[0];
export const CURRENT_VERSION: string = CURRENT_RELEASE.version;
