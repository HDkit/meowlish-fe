import { Report } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const reports: Report[] = [
	{
		id: 'rep1',
		userId: 'u2',
		examId: 'e1',
		content: 'Question 2 has a typo.',
	},
];

const reportsSlice = createGenericSlice<Report>('reports', reports);

export const {
	addItem: addReport,
	updateItem: updateReport,
	removeItem: removeReport,
	setList: setReports,
} = reportsSlice.actions;
export default reportsSlice.reducer;
