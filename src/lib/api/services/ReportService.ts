import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface ReportResponse {
  id: string;
  reportedBy: string;
  type: string;
  status: string;
  title: string;
  description: string;
  targetType?: string;
  targetId?: string;
  resolvedBy?: string;
  adminResponse?: string;
  fileIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListReportsResponse {
  reports: ReportResponse[];
  totalCount: number;
}

export interface CreateReportPayload {
  reportedBy: string;
  type: string;
  title: string;
  description: string;
  targetType?: string;
  targetId?: string;
  fileIds?: string[];
}

export interface UpdateReportPayload {
  status?: string;
  resolvedBy?: string;
  adminResponse?: string;
}

export class ReportService {
  public static listReports(
    reportedBy?: string,
    type?: string,
    status?: string,
    targetType?: string,
    targetId?: string,
    page?: number,
    limit?: number,
  ): CancelablePromise<ListReportsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/reports',
      query: { reportedBy, type, status, targetType, targetId, page, limit },
    });
  }

  public static getReport(id: string): CancelablePromise<ReportResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/reports/{id}',
      path: { id },
    });
  }

  public static createReport(
    payload: CreateReportPayload,
  ): CancelablePromise<ReportResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/reports',
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static updateReport(
    id: string,
    payload: UpdateReportPayload,
  ): CancelablePromise<ReportResponse> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/v1/resources/reports/{id}',
      path: { id },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static deleteReport(id: string): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/resources/reports/{id}',
      path: { id },
    });
  }

  public static addFileToReport(
    id: string,
    fileId: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/reports/{id}/files',
      path: { id },
      body: { fileId },
      mediaType: 'application/json',
    });
  }

  public static removeFileFromReport(
    reportId: string,
    fileId: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/resources/reports/{reportId}/files/{fileId}',
      path: { reportId, fileId },
    });
  }
}
