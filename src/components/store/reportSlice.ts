import { Report } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const reportsSlice = createGenericSlice<Report>('reports', []);

export const {
	addItem: addReport,
	updateItem: updateReport,
	removeItem: removeReport,
	setList: setReports,
} = reportsSlice.actions;
export default reportsSlice.reducer;
