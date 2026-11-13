import { ExamManagementService, SortOptionsDto } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/admin';
import { extractEntityData } from '@/lib/api-response';

/** A row of GET /exams/management/exams. */
export type ManagedExam = {
	id: string;
	title: string;
	status: string;
	createdBy?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type ExamCounts = { total: number; approved: number; pending: number; rejected: number };

const PAGE_SIZE = 100;

/**
 * Every management exam matching the server-side filters, newest first. The list is small and the
 * server only matches exact titles, so pages search and paginate locally.
 */
export const loadManagedExams = async (filter: { createdBy?: string; status?: string } = {}) => {
	const sortBy = { key: SortOptionsDto.key.CREATED_AT, direction: SortOptionsDto.direction.DESC };
	const hasFilter = Boolean(filter.createdBy || filter.status);
	return fetchAllPages<ManagedExam>(
		async (cursor) => {
			const res = await ExamManagementService.examManagementGatewayControllerFindExamsV1(
				cursor,
				// The cursor carries filter and sort after the first page.
				cursor || !hasFilter ? undefined : filter,
				PAGE_SIZE,
				cursor ? undefined : sortBy,
			);
			const data = extractEntityData<{ exams?: ManagedExam[]; nextCursor?: string }>(res);
			return { items: data?.exams ?? [], nextCursor: data?.nextCursor };
		},
		{ pageSize: PAGE_SIZE },
	);
};

export const loadExamCounts = async (): Promise<ExamCounts | null> => {
	return extractEntityData<ExamCounts>(await ExamManagementService.examManagementGatewayControllerGetExamCountsV1());
};
