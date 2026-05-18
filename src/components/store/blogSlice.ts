import { Blog } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const blogsSlice = createGenericSlice<Blog>('blogs', []);

export const {
	addItem: addBlog,
	updateItem: updateBlog,
	removeItem: removeBlog,
	setList: setBlogs,
} = blogsSlice.actions;
export default blogsSlice.reducer;
