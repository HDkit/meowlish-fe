import { Difficulty, Section } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const sections: Section[] = [
	{
		id: 's1',
		lastEditedBy: 'u1',
		parentId: 'e1', // parent is exam
		direction: 'LTR',
		difficulty: Difficulty.Intermediate,
	},
	{
		id: 's1-1',
		lastEditedBy: 'u1',
		parentId: 's1', // nested under s1
		direction: 'LTR',
		difficulty: Difficulty.Intermediate,
	},
	{
		id: 's2',
		lastEditedBy: 'u2',
		parentId: 'e2', // parent is exam
		direction: 'LTR',
		difficulty: Difficulty.Beginner,
	},
	{
		id: 's2-1',
		lastEditedBy: 'u2',
		parentId: 's2', // nested under s2
		direction: 'LTR',
		difficulty: Difficulty.Beginner,
	},
];

const sectionsSlice = createGenericSlice<Section>('sections', sections);

export const {
	addItem: addSection,
	updateItem: updateSection,
	removeItem: removeSection,
	setList: setSections,
} = sectionsSlice.actions;
export default sectionsSlice.reducer;
