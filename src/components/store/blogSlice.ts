import { Blog, BlogCategory } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const blogs: Blog[] = [
	{
		id: 'b1',
		createdBy: 'u1',
		summary: 'Hướng dẫn chi tiết cách sử dụng các tính năng trên EnglishAI Pro để học hiệu quả nhất',
		title: 'Hướng dẫn sử dụng EnglishAI Pro: Tận dụng tối đa các tính năng',
		content: `# Hướng dẫn sử dụng EnglishAI Pro

EnglishAI Pro là nền tảng học tiếng Anh thông minh với nhiều tính năng hỗ trợ bạn trong quá trình học tập. Dưới đây là hướng dẫn chi tiết để bạn tận dụng tối đa các tính năng:

## 1. Dashboard - Trung tâm điều khiển

Dashboard là nơi bạn có thể xem tổng quan về tiến độ học tập của mình:
- Xem các mục tiêu đã đặt
- Theo dõi số lượng bài thi đã làm
- Xem thống kê điểm số

## 2. Làm bài thi

### Chọn đề thi
- Vào trang "Exam Selection" để tìm kiếm đề thi phù hợp
- Lọc theo loại: IELTS hoặc TOEIC
- Chọn kỹ năng: Reading, Listening, Writing, Speaking

### Làm bài
- Chọn chế độ "Luyện tập từng phần" để tập trung vào một phần cụ thể
- Hoặc chọn "Full Test" để làm bài thi đầy đủ như thi thật
- Sử dụng timer để quản lý thời gian

## 3. Flashcards

### Tạo List
- Tạo các list flashcard theo chủ đề
- Ví dụ: "Từ vựng IELTS", "Ngữ pháp TOEIC"

### Thêm Flashcard
- Thêm từ vựng hoặc cấu trúc ngữ pháp vào list
- Ghi chú định nghĩa và ví dụ

### Khám phá
- Xem flashcard từ người dùng khác
- Copy flashcard hay vào list của bạn

## 4. Theo dõi tiến độ

- Xem lịch sử làm bài
- Phân tích điểm số theo thời gian
- Xác định điểm mạnh và điểm yếu

Chúc bạn học tập hiệu quả với EnglishAI Pro!`,
		category: BlogCategory.WebUsage,
		createdAt: new Date('2025-01-01').getTime(),
		views: 1250,
	},
	{
		id: 'b2',
		createdBy: 'u1',
		summary: '5 phương pháp học tiếng Anh hiệu quả được các chuyên gia khuyên dùng',
		title: '5 Phương pháp học tiếng Anh hiệu quả nhất năm 2025',
		content: `# 5 Phương pháp học tiếng Anh hiệu quả nhất

Học tiếng Anh là một hành trình dài đòi hỏi sự kiên trì và phương pháp đúng đắn. Dưới đây là 5 phương pháp được các chuyên gia đánh giá cao:

## 1. Immersion Learning (Học qua môi trường)

Tạo môi trường tiếng Anh xung quanh bạn:
- Xem phim, nghe nhạc bằng tiếng Anh
- Đọc báo, tạp chí tiếng Anh hàng ngày
- Thay đổi ngôn ngữ điện thoại, máy tính sang tiếng Anh

## 2. Spaced Repetition (Lặp lại ngắt quãng)

Sử dụng flashcards và ứng dụng như Anki:
- Ôn tập từ vựng theo chu kỳ tăng dần
- Ngày 1, 3, 7, 14, 30... sau khi học lần đầu
- Giúp ghi nhớ lâu dài

## 3. Active Learning (Học chủ động)

Thay vì chỉ đọc, hãy:
- Viết lại những gì đã học
- Giải thích cho người khác
- Tạo câu ví dụ với từ vựng mới

## 4. Practice with Real Materials

Làm bài thi thật:
- IELTS/TOEIC practice tests
- Đọc sách nguyên bản tiếng Anh
- Nghe podcast, TED talks

## 5. Consistent Daily Practice

Quan trọng nhất là sự nhất quán:
- Học 30 phút mỗi ngày tốt hơn 5 giờ một lần
- Tạo thói quen học tập
- Theo dõi tiến độ hàng ngày

Hãy chọn phương pháp phù hợp với bạn và kiên trì thực hiện!`,
		category: BlogCategory.LanguageLearning,
		createdAt: new Date('2025-01-05').getTime(),
		views: 2100,
	},
	{
		id: 'b3',
		createdBy: 'u2',
		summary: 'Bí quyết đạt điểm cao trong bài thi IELTS Reading và Listening',
		title: 'Bí quyết làm bài thi IELTS: Từ 6.0 lên 8.0',
		content: `# Bí quyết làm bài thi IELTS: Từ 6.0 lên 8.0

Sau nhiều năm giảng dạy và nghiên cứu, tôi đã tổng hợp những bí quyết quan trọng nhất để cải thiện điểm IELTS:

## Reading Section

### 1. Skimming và Scanning
- **Skimming**: Đọc lướt để nắm ý chính (2-3 phút)
- **Scanning**: Tìm từ khóa cụ thể trong câu hỏi
- Không đọc từng từ, đọc theo cụm

### 2. Quản lý thời gian
- Passage 1: 15 phút
- Passage 2: 20 phút  
- Passage 3: 25 phút
- Dành 5 phút cuối để kiểm tra

### 3. Xử lý các dạng câu hỏi
- **True/False/Not Given**: Tập trung vào từ ngữ chính xác
- **Matching Headings**: Đọc đoạn đầu và cuối mỗi đoạn
- **Multiple Choice**: Loại trừ đáp án sai trước

## Listening Section

### 1. Trước khi nghe
- Đọc kỹ câu hỏi và gạch chân từ khóa
- Dự đoán loại từ (danh từ, động từ, số...)
- Chú ý giới hạn từ (NO MORE THAN TWO WORDS)

### 2. Trong khi nghe
- Không cố hiểu hết, chỉ nghe thông tin cần thiết
- Chú ý từ đồng nghĩa (paraphrasing)
- Ghi chú nhanh nếu cần

### 3. Sau khi nghe
- Kiểm tra chính tả
- Đảm bảo đúng format (số, ngày tháng...)

## Writing Section

### Task 1 (Academic)
- 20 phút, 150 từ
- Cấu trúc: Introduction → Overview → Details
- So sánh số liệu, không chỉ mô tả

### Task 2
- 40 phút, 250 từ
- Cấu trúc: Introduction → Body (2-3 đoạn) → Conclusion
- Sử dụng từ nối, cấu trúc phức tạp

## Speaking Section

### Part 1: Giới thiệu
- Trả lời ngắn gọn, tự nhiên
- Thêm lý do, ví dụ

### Part 2: Long Turn
- Chuẩn bị 1 phút: ghi chú ý chính
- Nói 2 phút: mở rộng từng điểm

### Part 3: Discussion
- Đưa ra ý kiến cá nhân
- So sánh, đối chiếu
- Đưa ví dụ cụ thể

Chúc bạn đạt điểm cao!`,
		category: BlogCategory.ExamTips,
		createdAt: new Date('2025-01-10').getTime(),
		views: 3500,
	},
	{
		id: 'b4',
		createdBy: 'u2',
		summary: 'Chia sẻ trải nghiệm thực tế của học viên sau 3 tháng sử dụng EnglishAI Pro',
		title: 'Review EnglishAI Pro: Hành trình từ 5.5 lên 7.5 IELTS',
		content: `# Review EnglishAI Pro: Hành trình từ 5.5 lên 7.5 IELTS

Xin chào mọi người! Mình là Minh, một học viên đã sử dụng EnglishAI Pro được 3 tháng. Mình muốn chia sẻ trải nghiệm thực tế của mình.

## Hoàn cảnh ban đầu

Mình bắt đầu với điểm IELTS 5.5, cần đạt 7.0 để apply học bổng. Mình đã thử nhiều phương pháp nhưng không hiệu quả.

## Tại sao chọn EnglishAI Pro?

### 1. Đề thi đa dạng
- Có đầy đủ đề IELTS và TOEIC
- Đề thi được cập nhật thường xuyên
- Có thể luyện từng phần riêng lẻ

### 2. Flashcards thông minh
- Tạo list theo chủ đề giúp mình nhớ từ vựng tốt hơn
- Có thể copy flashcard từ người khác
- Học mọi lúc mọi nơi

### 3. Theo dõi tiến độ
- Dashboard cho mình biết điểm mạnh/yếu
- Lịch sử làm bài giúp mình xem lại lỗi sai
- Đặt mục tiêu và theo dõi

## Kết quả sau 3 tháng

- **Reading**: 5.5 → 7.5
- **Listening**: 6.0 → 8.0
- **Writing**: 5.0 → 6.5
- **Speaking**: 5.5 → 7.0
- **Overall**: 5.5 → 7.5

## Điểm mạnh của EnglishAI Pro

✅ Giao diện dễ sử dụng
✅ Đề thi chất lượng
✅ Tính năng flashcards hiệu quả
✅ Theo dõi tiến độ chi tiết
✅ Giá cả hợp lý

## Điểm cần cải thiện

⚠️ Cần thêm đề thi Writing và Speaking
⚠️ Cần tính năng chấm điểm tự động cho Writing

## Kết luận

EnglishAI Pro đã giúp mình đạt được mục tiêu. Mình rất recommend cho các bạn đang ôn thi IELTS/TOEIC!

Cảm ơn EnglishAI Pro và team đã tạo ra nền tảng tuyệt vời này! ❤️`,
		category: BlogCategory.StudentReview,
		createdAt: new Date('2025-01-15').getTime(),
		views: 1800,
	},
	{
		id: 'b5',
		createdBy: 'u1',
		summary: 'Kinh nghiệm du học tại Anh: Từ chuẩn bị hồ sơ đến cuộc sống sinh viên',
		title: 'Kinh nghiệm du học Anh: Hành trình của một sinh viên Việt Nam',
		content: `# Kinh nghiệm du học Anh: Hành trình của một sinh viên Việt Nam

Xin chào! Mình là Lan, hiện đang là sinh viên năm 2 tại University of Manchester, Anh. Mình muốn chia sẻ kinh nghiệm du học của mình.

## Giai đoạn chuẩn bị



### 2. Hồ sơ### 1. IELTS
- Cần tối thiểu 6.5 overall, không band nào dưới 6.0
- Mình đã dùng EnglishAI Pro để luyện thi
- Đạt 7.5 sau 4 tháng ôn tập
- Personal Statement: Viết về động lực, kinh nghiệm
- Reference Letters: Xin từ giáo viên, người giám sát
- Academic Transcript: Dịch và công chứng

### 3. Visa
- Chuẩn bị tài chính (bank statement)
- CAS letter từ trường
- Health check

## Cuộc sống tại Anh

### Học tập
- Phương pháp học khác Việt Nam: tự học nhiều hơn
- Tham gia seminar, discussion groups
- Deadline rất nghiêm ngặt

### Chi phí
- Học phí: £15,000-25,000/năm
- Sinh hoạt: £10,000-12,000/năm (London cao hơn)
- Có thể làm thêm 20h/tuần

### Văn hóa
- Người Anh khá reserved nhưng thân thiện
- Thích trò chuyện về thời tiết
- Punctuality rất quan trọng

## Tips cho các bạn

1. **Chuẩn bị tiếng Anh tốt**: Không chỉ IELTS mà cả kỹ năng giao tiếp
2. **Tài chính**: Chuẩn bị đủ, có dự phòng
3. **Mở rộng mạng lưới**: Tham gia clubs, societies
4. **Tận dụng resources**: Thư viện, career services
5. **Giữ liên lạc với gia đình**: Nhưng cũng độc lập

## Kết luận

Du học là trải nghiệm tuyệt vời nhưng cũng đầy thử thách. Hãy chuẩn bị kỹ càng và tận dụng mọi cơ hội!

Chúc các bạn thành công! 🎓✈️`,
		category: BlogCategory.StudyAbroad,
		createdAt: new Date('2025-01-20').getTime(),
		views: 2800,
	},
];

const blogsSlice = createGenericSlice<Blog>('blogs', blogs);

export const {
	addItem: addBlog,
	updateItem: updateBlog,
	removeItem: removeBlog,
	setList: setBlogs,
} = blogsSlice.actions;
export default blogsSlice.reducer;
