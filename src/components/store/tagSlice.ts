import { Tag } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const tags: Tag[] = [];

const tagsSlice = createGenericSlice<Tag>('tags', tags);

export const { addItem: addTag, updateItem: updateTag, removeItem: removeTag, setList: setTags } = tagsSlice.actions;
export default tagsSlice.reducer;
