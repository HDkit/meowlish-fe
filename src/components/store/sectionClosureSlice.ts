import { SectionClosure } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialClosures: SectionClosure[] = [];

const baseSlice = createGenericSlice<SectionClosure>('sectionClosures', initialClosures);

// Extend with closure table operations
const sectionClosuresSlice = createSlice({
	name: 'sectionClosures',
	initialState: baseSlice.getInitialState(),
	reducers: {
		...baseSlice.caseReducers,
		
		// Add section with automatic closure paths
		addSectionClosure: (state, action: PayloadAction<{ sectionId: string; parentId?: string }>) => {
			const { sectionId, parentId } = action.payload;
			
			// Add self-reference
			state.list.push({
				id: `sc-${sectionId}-self`,
				ancestorId: sectionId,
				descendantId: sectionId,
				depth: 0,
			});
			
			if (parentId) {
				// Find all ancestors of parent
				const parentPaths = state.list.filter(c => c.descendantId === parentId);
				
				// Add paths from all ancestors to new section
				parentPaths.forEach(path => {
					state.list.push({
						id: `sc-${path.ancestorId}-${sectionId}`,
						ancestorId: path.ancestorId,
						descendantId: sectionId,
						depth: path.depth + 1,
					});
				});
			}
		},
		
		// Move section to new parent
		moveSectionClosure: (state, action: PayloadAction<{ sectionId: string; newParentId: string | null }>) => {
			const { sectionId, newParentId } = action.payload;
			
			// Get all descendants of moving section
			const descendants = state.list
				.filter(c => c.ancestorId === sectionId)
				.map(c => c.descendantId);
			
			// Remove old paths (keep only self-references)
			state.list = state.list.filter(c => 
				!(descendants.includes(c.descendantId) && c.depth > 0)
			);
			
			// Add new paths if has parent
			if (newParentId) {
				const parentPaths = state.list.filter(c => c.descendantId === newParentId);
				
				descendants.forEach(descId => {
					const descDepth = state.list.find(
						c => c.ancestorId === sectionId && c.descendantId === descId
					)?.depth || 0;
					
					parentPaths.forEach(parentPath => {
						state.list.push({
							id: `sc-${parentPath.ancestorId}-${descId}`,
							ancestorId: parentPath.ancestorId,
							descendantId: descId,
							depth: parentPath.depth + 1 + descDepth,
						});
					});
				});
			}
		},
		
		// Delete section and all closure paths
		deleteSectionClosure: (state, action: PayloadAction<string>) => {
			const sectionId = action.payload;
			state.list = state.list.filter(
				c => c.ancestorId !== sectionId && c.descendantId !== sectionId
			);
		},
	},
});

export const {
	addItem: addClosure,
	setList: setClosures,
	addSectionClosure,
	moveSectionClosure,
	deleteSectionClosure,
} = sectionClosuresSlice.actions;

export default sectionClosuresSlice.reducer;
