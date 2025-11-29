import { Tag, TagType } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const tags: Tag[] = [
	{ id: 't1', name: 'Reading', tagType: TagType.Exam },
	{ id: 't2', name: 'Listening', tagType: TagType.Exam },

	// Part 1
	{ id: 'q-t1', name: '[Part 1] Tranh tả người', tagType: TagType.Question },
	{ id: 'q-t2', name: '[Part 1] Tranh tả cả người và vật', tagType: TagType.Question },

	// Part 2
	{ id: 'q-t3', name: '[Part 2] Câu hỏi WHAT', tagType: TagType.Question },
	{ id: 'q-t4', name: '[Part 2] Câu hỏi WHO', tagType: TagType.Question },
	{ id: 'q-t5', name: '[Part 2] Câu hỏi WHERE', tagType: TagType.Question },
	{ id: 'q-t6', name: '[Part 2] Câu hỏi WHEN', tagType: TagType.Question },
	{ id: 'q-t7', name: '[Part 2] Câu hỏi HOW', tagType: TagType.Question },
	{ id: 'q-t8', name: '[Part 2] Câu hỏi WHY', tagType: TagType.Question },
	{ id: 'q-t9', name: '[Part 2] Câu hỏi YES/NO', tagType: TagType.Question },
	{ id: 'q-t10', name: '[Part 2] Câu hỏi đuôi', tagType: TagType.Question },
	{ id: 'q-t11', name: '[Part 2] Câu hỏi lựa chọn', tagType: TagType.Question },
	{ id: 'q-t12', name: '[Part 2] Câu yêu cầu, đề nghị', tagType: TagType.Question },

	// Part 3
	{ id: 'q-t13', name: '[Part 3] Câu hỏi về chủ đề, mục đích', tagType: TagType.Question },
	{ id: 'q-t14', name: '[Part 3] Câu hỏi về danh tính người nói', tagType: TagType.Question },
	{ id: 'q-t15', name: '[Part 3] Câu hỏi về chi tiết cuộc hội thoại', tagType: TagType.Question },
	{ id: 'q-t16', name: '[Part 3] Câu hỏi về hành động tương lai', tagType: TagType.Question },
	{ id: 'q-t17', name: '[Part 3] Câu hỏi kết hợp bảng biểu', tagType: TagType.Question },
	{ id: 'q-t18', name: '[Part 3] Câu hỏi về hàm ý câu nói', tagType: TagType.Question },
	{ id: 'q-t19', name: '[Part 3] Chủ đề: Company - General Office Work', tagType: TagType.Question },
	{ id: 'q-t20', name: '[Part 3] Chủ đề: Company - Personnel', tagType: TagType.Question },
	{ id: 'q-t21', name: '[Part 3] Chủ đề: Company - Event, Project', tagType: TagType.Question },
	{ id: 'q-t22', name: '[Part 3] Chủ đề: Company - Facility', tagType: TagType.Question },
	{ id: 'q-t23', name: '[Part 3] Chủ đề: Shopping, Service', tagType: TagType.Question },
	{ id: 'q-t24', name: '[Part 3] Chủ đề: Housing', tagType: TagType.Question },
	{ id: 'q-t25', name: '[Part 3] Câu hỏi về yêu cầu, gợi ý', tagType: TagType.Question },

	// Part 4
	{ id: 'q-t26', name: '[Part 4] Câu hỏi về chủ đề, mục đích', tagType: TagType.Question },
	{ id: 'q-t27', name: '[Part 4] Câu hỏi về danh tính, địa điểm', tagType: TagType.Question },
	{ id: 'q-t28', name: '[Part 4] Câu hỏi về chi tiết', tagType: TagType.Question },
	{ id: 'q-t29', name: '[Part 4] Câu hỏi về hành động tương lai', tagType: TagType.Question },
	{ id: 'q-t30', name: '[Part 4] Câu hỏi kết hợp bảng biểu', tagType: TagType.Question },
	{ id: 'q-t31', name: '[Part 4] Câu hỏi về hàm ý câu nói', tagType: TagType.Question },
	{ id: 'q-t32', name: '[Part 4] Dạng bài: Telephone message - Tin nhắn thoại', tagType: TagType.Question },
	{ id: 'q-t33', name: '[Part 4] Dạng bài: Announcement - Thông báo', tagType: TagType.Question },
	{ id: 'q-t34', name: '[Part 4] Dạng bài: News report, Broadcast - Bản tin', tagType: TagType.Question },
	{ id: 'q-t35', name: '[Part 4] Dạng bài: Talk - Bài phát biểu, diễn văn', tagType: TagType.Question },
	{ id: 'q-t36', name: '[Part 4] Câu hỏi yêu cầu, gợi ý', tagType: TagType.Question },

	// Part 5 (Grammar)
	{ id: 'q-t37', name: '[Part 5] Câu hỏi từ loại', tagType: TagType.Question },
	{ id: 'q-t38', name: '[Part 5] Câu hỏi ngữ pháp', tagType: TagType.Question },
	{ id: 'q-t39', name: '[Part 5] Câu hỏi từ vựng', tagType: TagType.Question },
	{ id: 'q-t40', name: '[Grammar] Danh từ', tagType: TagType.Question },
	{ id: 'q-t41', name: '[Grammar] Đại từ', tagType: TagType.Question },
	{ id: 'q-t42', name: '[Grammar] Tính từ', tagType: TagType.Question },
	{ id: 'q-t43', name: '[Grammar] Thì', tagType: TagType.Question },
	{ id: 'q-t44', name: '[Grammar] Thể', tagType: TagType.Question },
	{ id: 'q-t45', name: '[Grammar] Trạng từ', tagType: TagType.Question },
	{ id: 'q-t46', name: '[Grammar] Động từ nguyên mẫu có to', tagType: TagType.Question },
	{ id: 'q-t47', name: '[Grammar] Phân từ và Cấu trúc phân từ', tagType: TagType.Question },
	{ id: 'q-t48', name: '[Grammar] Giới từ', tagType: TagType.Question },
	{ id: 'q-t49', name: '[Grammar] Liên từ', tagType: TagType.Question },
	{ id: 'q-t50', name: '[Grammar] Cấu trúc so sánh', tagType: TagType.Question },
];

const tagsSlice = createGenericSlice<Tag>('tags', tags);

export const { addItem: addTag, updateItem: updateTag, removeItem: removeTag, setList: setTags } = tagsSlice.actions;
export default tagsSlice.reducer;
