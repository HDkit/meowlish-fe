import { Blog } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const blogs: Blog[] = [
	{
		id: 'b1',
		createdBy: 'u1',
		summary: 'Tips for IELTS Reading',
		title: 'IELTS Reading Strategies',
		content: `
Mastering the IELTS Reading section requires a combination of speed, comprehension, and strategy. 
Here are some tips to improve your score:

1. **Skim and Scan:** Don't read every word. Skim the passage for the main idea and scan for keywords related to the questions.
2. **Time Management:** Allocate roughly 20 minutes per passage. Keep an eye on the clock to avoid spending too long on tricky questions.
3. **Understand Question Types:** Familiarize yourself with multiple-choice, true/false/not given, and matching headings questions. Each has its own strategy.
4. **Highlight Keywords:** While reading, underline or circle important names, dates, and technical terms to locate answers quickly.
5. **Practice Regularly:** Daily reading exercises from newspapers, journals, or IELTS sample tests help you get comfortable with different topics and vocabulary.
6. **Review Mistakes:** Always review the questions you got wrong and understand why the correct answer is right. This prevents repeating mistakes.

By incorporating these strategies into your study routine, you'll improve not only your speed but also your accuracy. Consistent practice is key to achieving your target score in the IELTS Reading section.
    `,
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
