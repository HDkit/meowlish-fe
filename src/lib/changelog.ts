/**
 * Release history shown on /changelog and in the "what's new" dialog.
 * Newest first. The first entry's version is the app's current version
 * (keep package.json "version" in sync when adding a release).
 */

export type ChangeType = 'new' | 'improved' | 'fixed' | 'notice';

/** Who the change matters to. Staff = moderators, admins and exam staff. */
export type ChangeAudience = 'learner' | 'staff';

export interface ChangeItem {
	type: ChangeType;
	/** Plain Vietnamese for end users: what they can do now, no technical terms. */
	text: string;
	/** Defaults to 'learner'. Staff items get their own section. */
	audience?: ChangeAudience;
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
	new: 'Tính năng mới',
	improved: 'Cải thiện',
	fixed: 'Sửa lỗi',
};

export const RELEASES: Release[] = [
	{
		version: '0.11.0',
		date: '2026-11-14',
		title: 'AI chấm Writing & thông báo khi có người trả lời bạn',
		summary: 'Bài Writing nay được AI chấm thật. Bạn cũng nhận được thông báo khi có người bình luận hoặc trả lời mình, cùng nhiều cải thiện nhỏ.',
		changes: [
			{
				type: 'notice',
				text: 'Bài Writing nay được AI chấm thật theo bốn tiêu chí của IELTS, kèm nhận xét chi tiết. Mỗi bài mất khoảng 1–2 phút; khi nhiều người nộp cùng lúc, bạn có thể phải chờ lâu hơn một chút. Chấm Speaking, giải thích đáp án và dịch nhanh trong bài thi bằng AI vẫn đang tạm ngưng.',
			},
			{ type: 'new', text: 'Nhận thông báo khi có người bình luận bài blog của bạn, trả lời bình luận của bạn hoặc trả lời chủ đề bạn mở trên diễn đàn. Bật hoặc tắt từng loại trong trang Cài đặt.' },
			{ type: 'new', text: 'Nút "Dịch nghĩa" khi tạo flashcard (kể cả khi bôi đen chữ trong bài thi): nghĩa tiếng Việt được thêm vào sau phần bạn đã viết, không ghi đè.' },
			{ type: 'new', text: 'Bộ sưu tập danh hiệu trên trang cá nhân: huy chương đồng, bạc, vàng và kim cương, kèm tiến độ tới danh hiệu tiếp theo.' },
			{ type: 'improved', text: 'Ôn tập flashcard: khi xem thẻ đã lưu, ô trả lời trượt sang trái và thẻ hiện ra bên phải một cách mượt mà.' },
			{ type: 'improved', text: 'Bản đồ hoạt động dễ nhìn hơn: ngày chưa luyện tập có màu xám nhạt, ngày có luyện tập màu xanh rõ hơn.' },
			{ type: 'improved', text: 'Bộ lọc chủ đề trong Blog hiện đủ mọi chủ đề ngay từ đầu, không còn thay đổi khi chuyển trang.' },
			{ type: 'improved', text: 'Danh sách đề thi và bộ flashcard có số trang, và giữ đúng trang khi bạn quay lại.' },
			{ type: 'improved', text: 'Thêm nhiều bài blog, bộ flashcard công khai và phòng chat để khám phá.' },
			{ type: 'fixed', text: 'Tìm phòng chat theo tên nay tìm trong tất cả các phòng, và nút trang trước/sau giữ nguyên kết quả tìm kiếm.' },
			{ type: 'fixed', text: 'Danh hiệu "Nhà khám phá" và "Chú ong chăm chỉ" (14 ngày) nay được trao đúng. Nếu bạn đã đủ điều kiện, bạn sẽ nhận ở lần đăng nhập tiếp theo.' },
			{ type: 'fixed', text: 'Ôn tập flashcard không còn giữ lại câu trả lời của thẻ trước khi sang thẻ mới.' },
			{ type: 'fixed', text: 'Thanh bên khi thu gọn nay cuộn được trên màn hình thấp.' },
		],
	},
	{
		version: '0.10.0',
		date: '2026-11-14',
		title: 'Diễn đàn, ôn tập flashcard & trang Tiến độ mới',
		summary:
			'Bản cập nhật lớn nhất từ trước đến nay: có chỗ để trò chuyện với cộng đồng, cách mới để ôn từ vựng, và bức tranh rõ ràng hơn về quá trình luyện tập của bạn.',
		changes: [
			{
				type: 'notice',
				text: 'Điểm Writing hiện vẫn là điểm mẫu ngẫu nhiên để thử nghiệm, chưa phản ánh trình độ thật. Chấm Speaking, giải thích đáp án và dịch nhanh bằng AI vẫn đang tạm ngưng.',
			},
			{ type: 'new', text: 'Diễn đàn: đặt câu hỏi và chia sẻ kinh nghiệm theo từng chủ đề, trả lời hoặc trích dẫn bài của người khác. Tìm thấy ở mục "Diễn đàn" trên thanh bên.' },
			{ type: 'new', text: 'Bình luận dưới bài blog: trả lời thẳng vào một bình luận, bấm "Đang trả lời…" để xem lại bình luận gốc.' },
			{ type: 'new', text: 'Chế độ Ôn tập flashcard: chọn các bộ thẻ của bạn và kiểu câu hỏi (Từ → Nghĩa, Nghĩa → Từ…), gõ những gì bạn nhớ rồi so với thẻ đã lưu. Không chấm điểm, cứ thoải mái ôn.' },
			{ type: 'new', text: 'Lưu bộ flashcard công khai của người khác thành bộ của riêng bạn để tự chỉnh sửa, và cập nhật khi bản gốc có thay đổi.' },
			{ type: 'new', text: 'Đề xuất thay đổi cho bộ flashcard gốc: chủ bộ xem từng thẻ được thêm, sửa, xoá rồi chấp nhận hoặc từ chối. Cả hai bên đều nhận được thông báo.' },
			{ type: 'new', text: 'Trang Tiến độ mới: mỗi kỹ năng có một thẻ riêng với điểm gần nhất, xu hướng và mức độ, kèm gợi ý dạng câu hỏi nên luyện tiếp.' },
			{ type: 'new', text: 'Lịch luyện tập theo tuần với mục tiêu số ngày học, cùng bản đồ hoạt động cho thấy những ngày bạn đã luyện tập và chuỗi ngày dài nhất.' },
			{ type: 'new', text: 'Trang Cài đặt: bật hoặc tắt từng loại thông báo, chọn giao diện sáng hoặc tối.' },
			{ type: 'new', text: 'Tìm bộ flashcard trong tab "Khám phá" theo tên hoặc thẻ. Bộ công khai của bạn cũng hiện ở đây.' },
			{ type: 'new', text: 'Báo cáo bài viết trên diễn đàn và bình luận blog có nội dung không phù hợp.' },
			{ type: 'improved', text: 'Bài Writing được chấm sau khoảng 1–3 phút, như khi có giám khảo đọc bài, và trang kết quả chờ đến khi có điểm cùng nhận xét.' },
			{ type: 'improved', text: 'Blog được làm mới: bài nổi bật, ảnh bìa, thời gian đọc và gợi ý bài liên quan.' },
			{ type: 'improved', text: 'Chọn thẻ khi tìm đề dễ hơn: gõ để tìm, thẻ được nhóm theo loại, thêm lựa chọn Tất cả / IELTS / TOEIC.' },
			{ type: 'improved', text: 'Nút "Quay lại" trên trang đề thi đưa bạn về đúng danh sách cùng các bộ lọc đã chọn.' },
			{ type: 'improved', text: 'Gợi ý thẻ khi tạo flashcard và bộ flashcard.' },
			{ type: 'improved', text: 'Danh sách phòng chat hiện tin nhắn mới nhất kèm tên người gửi, và tải nhanh hơn.' },
			{ type: 'improved', text: 'Hình nền mới nhẹ nhàng với họa tiết học tập, có cả phiên bản cho giao diện tối.' },
			{ type: 'improved', text: 'Đổi bộ lọc không còn làm trang nhấp nháy: nội dung cũ vẫn hiển thị trong lúc tải.' },
			{ type: 'improved', text: 'Thông báo lỗi trong biểu mẫu rõ ràng hơn, bằng tiếng Việt, hiện ngay dưới ô cần sửa và không bị tràn trên điện thoại.' },
			{ type: 'improved', text: 'Bấm vào một thông báo sẽ mở đúng trang liên quan; thông báo thành tích nay bằng tiếng Việt.' },
			{ type: 'improved', text: 'Trang kết quả dễ đọc hơn: mỗi lần chỉ mở một câu, bảng phân tích tô màu từng câu đúng, sai và bỏ trống.' },
			{ type: 'fixed', text: 'Câu trả lời trong bài thi không còn bị mất: trang hiện "Đang lưu… / Đã lưu" và chỉ nộp bài khi mọi câu đã được lưu.' },
			{ type: 'fixed', text: 'Mở lại một bài thi đã nộp sẽ đưa bạn đến trang kết quả thay vì báo lỗi.' },
			{ type: 'fixed', text: 'Đề TOEIC hiện lại đầy đủ trong danh sách đề; lọc theo một thẻ không còn báo lỗi.' },
			{ type: 'fixed', text: 'Hình ảnh trong đề thi và ảnh đại diện hiển thị lại bình thường.' },
			{ type: 'fixed', text: 'Yêu cầu mật khẩu khi đăng ký nay được nói rõ từ đầu (ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký hiệu), không còn đăng ký thất bại khó hiểu.' },
			{ type: 'new', audience: 'staff', text: 'Quản trị viên nhận thông báo ngay khi có báo cáo mới cần xử lý.' },
			{ type: 'new', audience: 'staff', text: 'Kiểm duyệt viên có thể ghim, khoá hoặc xoá chủ đề trên diễn đàn.' },
			{ type: 'new', audience: 'staff', text: 'Lọc bài blog theo tác giả trong trang Quản lý blog.' },
			{ type: 'improved', audience: 'staff', text: 'Các trang quản trị được thiết kế lại: thẻ thống kê bấm vào để lọc, ô tìm kiếm, bảng dùng tốt trên điện thoại và hiện tên thật của người tạo, người báo cáo.' },
			{ type: 'improved', audience: 'staff', text: 'Báo cáo về bài viết diễn đàn hay bình luận mở thẳng đến đúng nội dung bị báo cáo.' },
			{ type: 'improved', audience: 'staff', text: 'Các nút trong phòng chat và thanh bên chỉ hiện những thao tác bạn được phép làm.' },
			{ type: 'fixed', audience: 'staff', text: 'Thời lượng đề thi khi tạo hoặc sửa đề được lưu đúng theo phút.' },
			{ type: 'fixed', audience: 'staff', text: 'Quản lý người dùng hiện đủ danh sách; gỡ vai trò và lọc theo vai trò hoạt động đúng.' },
		],
	},
	{
		version: '0.9.0',
		date: '2026-11-12',
		title: 'Đăng nhập an toàn hơn & tài khoản dùng thử',
		summary: 'Tài khoản của bạn được bảo vệ tốt hơn, và giờ ai cũng có thể dùng thử Lingriser mà không cần đăng ký.',
		changes: [
			{
				type: 'notice',
				text: 'Bài Writing đã có điểm trở lại sau khoảng 1–3 phút, nhưng đó là điểm và nhận xét mẫu ngẫu nhiên để thử nghiệm, không phản ánh trình độ thật.',
			},
			{ type: 'new', text: 'Nút "Dùng thử bằng tài khoản demo" ở trang đăng nhập. Tài khoản demo dùng chung nên không đổi được mật khẩu, tên đăng nhập hay cách đăng nhập.' },
			{ type: 'improved', text: 'Đề TOEIC mẫu có hình ảnh và âm thanh thật; Part 7 được viết lại cho khớp với đoạn văn.' },
			{ type: 'improved', text: 'Phiên đăng nhập được bảo vệ tốt hơn trước các trang web lạ.' },
			{ type: 'improved', text: 'Đổi mật khẩu cần nhập mật khẩu hiện tại.' },
			{ type: 'improved', text: 'Liên kết tài khoản Google ổn định hơn.' },
			{ type: 'fixed', text: 'Không còn bị đăng xuất bất ngờ khi thao tác nhanh; tài khoản bị khoá sẽ được đăng xuất ngay.' },
			{ type: 'fixed', audience: 'staff', text: 'Thẻ của đề thi, phần thi và câu hỏi được lưu đúng khi chỉnh sửa.' },
		],
	},
	{
		version: '0.8.0',
		date: '2026-11-12',
		title: 'Tạm ngưng dịch vụ AI & trang "Có gì mới"',
		summary: 'Các tính năng dùng AI đang tạm ngưng. Những phần còn lại của Lingriser vẫn hoạt động bình thường.',
		changes: [
			{
				type: 'notice',
				text: 'Dịch vụ AI tạm thời không hoạt động: chấm điểm Speaking/Writing, giải thích đáp án bằng AI và dịch nhanh trong bài thi sẽ không trả kết quả cho đến khi có thông báo mới.',
			},
			{ type: 'new', text: 'Trang "Có gì mới" và cửa sổ giới thiệu mỗi khi có phiên bản mới.' },
			{ type: 'new', text: 'Thông báo trạng thái dịch vụ AI hiển thị trên mọi trang.' },
			{ type: 'fixed', text: 'Sửa lỗi hiển thị trên Dashboard, Flashcards và Phòng chat.' },
		],
	},
	{
		version: '0.7.0',
		date: '2026-06-10',
		title: 'Blog, báo cáo nội dung & lịch hoạt động',
		changes: [
			{ type: 'new', text: 'Lọc blog theo nhiều thẻ cùng lúc.' },
			{ type: 'new', text: 'Chọn khoảng thời gian tuỳ ý cho lịch hoạt động trên Dashboard.' },
			{ type: 'new', text: 'Báo cáo flashcard và bộ flashcard có nội dung không phù hợp.' },
			{ type: 'new', text: 'Gắn nhiều thẻ cho mỗi flashcard.' },
			{ type: 'improved', text: 'Lỗi khi đăng nhập hoặc đăng ký hiện ngay dưới ô cần sửa.' },
			{ type: 'fixed', text: 'Ảnh đại diện hiển thị đúng ngay sau khi tải lên; nút chuyển trang luôn hiện.' },
		],
	},
	{
		version: '0.6.0',
		date: '2026-05-27',
		title: 'Làm bài thông minh hơn & Flashcard cộng đồng',
		changes: [
			{ type: 'new', text: 'Đánh dấu câu hỏi và ghi chú ngay trong lúc làm bài.' },
			{ type: 'new', text: 'Bôi đen để dịch nhanh trong bài thi (dùng AI).' },
			{ type: 'new', text: 'Tab "Khám phá" với các bộ flashcard công khai; tự đặt bộ của bạn ở chế độ công khai và gắn thẻ.' },
			{ type: 'improved', text: 'Danh sách dài được chia trang và tải nhanh hơn.' },
			{ type: 'improved', text: 'Bảng theo dõi câu hỏi thu gọn được; trang làm bài hiện khung chờ khi đang tải.' },
			{ type: 'improved', text: 'Thông báo lỗi dễ hiểu hơn, tự thử lại khi kết nối bị gián đoạn.' },
			{ type: 'fixed', text: 'Tin nhắn chat không còn bị lặp; thanh bên hiển thị đúng khi thu gọn.' },
			{ type: 'new', audience: 'staff', text: 'Kiểm duyệt viên có thể duyệt hoặc từ chối đề thi và cấm người dùng trong phòng chat.' },
		],
	},
	{
		version: '0.5.0',
		date: '2026-05-19',
		title: 'Lingriser: cộng đồng & quản trị',
		changes: [
			{ type: 'new', text: 'Ứng dụng có tên mới là Lingriser, cùng logo và giao diện mới.' },
			{ type: 'new', text: 'Phòng chat, livestream và lịch phòng học.' },
			{ type: 'new', text: 'Thông báo trong ứng dụng.' },
			{ type: 'new', text: 'Đặt mục tiêu học tập, xem thống kê và biểu đồ tiến độ từ kết quả thật của bạn.' },
			{ type: 'new', audience: 'staff', text: 'Trang quản lý báo cáo và vai trò Kiểm duyệt viên.' },
			{ type: 'new', audience: 'staff', text: 'Khoá hoặc mở khoá tài khoản, tìm người dùng theo số điện thoại.' },
		],
	},
	{
		version: '0.4.0',
		date: '2026-05-06',
		title: 'Đăng nhập Google & chấm Writing bằng AI',
		changes: [
			{ type: 'new', text: 'Đăng nhập bằng tài khoản Google.' },
			{ type: 'new', text: 'Chấm bài Writing bằng AI: nộp bài rồi quay lại xem kết quả khi chấm xong.' },
			{ type: 'improved', text: 'Lịch sử làm bài ổn định hơn; sau khi đăng nhập bạn quay lại đúng trang đang xem.' },
			{ type: 'improved', text: 'Làm mới trang luyện Speaking và Writing.' },
		],
	},
	{
		version: '0.3.0',
		date: '2026-04-29',
		title: 'Giao diện mới "Spring Garden"',
		changes: [
			{ type: 'new', text: 'Toàn bộ giao diện được thiết kế lại với màu sắc thống nhất và trang giới thiệu mới.' },
			{ type: 'new', text: 'Điều hướng mới: thanh trên cùng ở trang giới thiệu, thanh bên thu gọn được trong ứng dụng.' },
			{ type: 'new', text: 'Chuỗi ngày học, biểu đồ kỹ năng và thành tích.' },
			{ type: 'fixed', text: 'Âm thanh và hình ảnh trong bài thi hiển thị đúng.' },
		],
	},
	{
		version: '0.2.0',
		date: '2026-03-05',
		title: 'Ứng dụng nhanh hơn & công cụ cho đội ngũ',
		changes: [
			{ type: 'improved', text: 'Ứng dụng được xây dựng lại để chuyển trang nhanh hơn.' },
			{ type: 'improved', text: 'Giao diện bằng tiếng Việt và trang Flashcard được làm mới.' },
			{ type: 'new', audience: 'staff', text: 'Tạo đề thi và duyệt đề.' },
			{ type: 'new', audience: 'staff', text: 'Công cụ riêng cho nhân viên và trưởng nhóm nhân viên.' },
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
