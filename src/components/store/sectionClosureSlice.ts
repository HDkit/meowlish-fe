import { SectionClosure } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Initial closure table entries (generated from existing sections)
const initialClosures: SectionClosure[] = [
	// s1 (root) closures
	{ id: 'sc1', ancestorId: 's1', descendantId: 's1', depth: 0 },
	{ id: 'sc2', ancestorId: 's1', descendantId: 's1-1', depth: 1 },
	{ id: 'sc3', ancestorId: 's1', descendantId: 's1-2', depth: 1 },
	
	// s1-1 self
	{ id: 'sc4', ancestorId: 's1-1', descendantId: 's1-1', depth: 0 },
	
	// s1-2 self
	{ id: 'sc5', ancestorId: 's1-2', descendantId: 's1-2', depth: 0 },
	
	// s2 (root) closures
	{ id: 'sc6', ancestorId: 's2', descendantId: 's2', depth: 0 },
];

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
