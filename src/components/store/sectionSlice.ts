import { Section } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const sections: Section[] = [];

const sectionsSlice = createGenericSlice<Section>('sections', sections);

export const {
    addItem: addSection,
    updateItem: updateSection,
    removeItem: removeSection,
    setList: setSections,
} = sectionsSlice.actions;
export default sectionsSlice.reducer;