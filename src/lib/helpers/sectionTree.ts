import { Section, SectionClosure } from '@/types/client';

export interface SectionTreeNode extends Section {
	children: SectionTreeNode[];
	depth: number;
}

/**
 * Build section tree from flat list using closure table
 */
export function buildSectionTree(
	sections: Section[],
	closures: SectionClosure[],
	examId: string
): SectionTreeNode[] {
	// Filter sections for this exam (parentId is examId or another section in the exam)
	const examSections = sections.filter(s => 
		s.parentId === examId || sections.some(parent => parent.id === s.parentId)
	);

	// Create node map
	const nodeMap = new Map<string, SectionTreeNode>();
	examSections.forEach(section => {
		nodeMap.set(section.id, {
			...section,
			children: [],
			depth: 0,
		});
	});

	// Calculate depth from closures
	examSections.forEach(section => {
		const closure = closures.find(c => 
			c.descendantId === section.id && 
			c.ancestorId !== section.id
		);
		if (closure && nodeMap.has(section.id)) {
			nodeMap.get(section.id)!.depth = closure.depth;
		}
	});

	// Build tree structure
	const roots: SectionTreeNode[] = [];
	
	examSections.forEach(section => {
		const node = nodeMap.get(section.id)!;
		
		// Find parent
		const parentSection = examSections.find(s => s.id === section.parentId);
		
		if (parentSection && nodeMap.has(parentSection.id)) {
			// Add to parent's children
			nodeMap.get(parentSection.id)!.children.push(node);
		} else if (section.parentId === examId) {
			// Root section
			roots.push(node);
		}
	});

	// Sort children by id (or add orderIndex field later)
	const sortChildren = (node: SectionTreeNode) => {
		node.children.sort((a, b) => a.id.localeCompare(b.id));
		node.children.forEach(sortChildren);
	};
	roots.forEach(sortChildren);

	return roots;
}

/**
 * Get all descendants of a section
 */
export function getSectionDescendants(
	sectionId: string,
	closures: SectionClosure[]
): string[] {
	return closures
		.filter(c => c.ancestorId === sectionId && c.depth > 0)
		.map(c => c.descendantId);
}

/**
 * Get all ancestors of a section (breadcrumb)
 */
export function getSectionAncestors(
	sectionId: string,
	sections: Section[],
	closures: SectionClosure[]
): Section[] {
	const ancestorIds = closures
		.filter(c => c.descendantId === sectionId && c.depth > 0)
		.sort((a, b) => b.depth - a.depth) // Sort by depth descending
		.map(c => c.ancestorId);

	return ancestorIds
		.map(id => sections.find(s => s.id === id))
		.filter(Boolean) as Section[];
}

/**
 * Get direct children of a section
 */
export function getDirectChildren(
	sectionId: string,
	sections: Section[],
	closures: SectionClosure[]
): Section[] {
	const childIds = closures
		.filter(c => c.ancestorId === sectionId && c.depth === 1)
		.map(c => c.descendantId);

	return sections.filter(s => childIds.includes(s.id));
}
