/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { create_exam_req_dto_CreateExamDto } from '../models/create_exam_req_dto_CreateExamDto';
import type { create_question_req_dto_CreateQuestionDto } from '../models/create_question_req_dto_CreateQuestionDto';
import type { create_section_req_dto_CreateSectionDto } from '../models/create_section_req_dto_CreateSectionDto';
import type { FilterOptionsDto } from '../models/FilterOptionsDto';
import type { move_question_req_dto_MoveQuestionDto } from '../models/move_question_req_dto_MoveQuestionDto';
import type { move_section_req_dto_MoveSectionDto } from '../models/move_section_req_dto_MoveSectionDto';
import type { ResponseEntity } from '../models/ResponseEntity';
import type { review_exam_req_dto_ReviewExamDto } from '../models/review_exam_req_dto_ReviewExamDto';
import type { SortOptionsDto } from '../models/SortOptionsDto';
import type { update_exam_req_dto_UpdateExamDto } from '../models/update_exam_req_dto_UpdateExamDto';
import type { update_question_req_dto_UpdateQuestionDto } from '../models/update_question_req_dto_UpdateQuestionDto';
import type { update_section_req_dto_UpdateSectionDto } from '../models/update_section_req_dto_UpdateSectionDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExamManagementService {
    /**
     * Create an exam
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerCreateExamV1({
        requestBody,
    }: {
        requestBody: create_exam_req_dto_CreateExamDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exams/management',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create a section inside an exam
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerCreateSectionInExamV1({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: create_section_req_dto_CreateSectionDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exams/management/{id}/sections',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create a nested section inside a section
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerCreateSectionInSectionV1({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: create_section_req_dto_CreateSectionDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exams/management/sections/{id}/sections',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create a question inside a section
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerCreateQuestionV1({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: create_question_req_dto_CreateQuestionDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exams/management/sections/{id}/questions',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update an exam
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerUpdateExamV1({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: update_exam_req_dto_UpdateExamDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/exams/management/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete an exam
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerDeleteExamV1({
        id,
    }: {
        id: string,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/exams/management/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update a section
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerUpdateSectionV1({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: update_section_req_dto_UpdateSectionDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/exams/management/sections/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a section
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerDeleteSectionV1({
        id,
    }: {
        id: string,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/exams/management/sections/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get detailed section management data
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerGetSectionDetailsV1({
        id,
    }: {
        id: string,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/management/sections/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update a question
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerUpdateQuestionV1({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: update_question_req_dto_UpdateQuestionDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/exams/management/questions/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a question
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerDeleteQuestionV1({
        id,
    }: {
        id: string,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/exams/management/questions/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get detailed question management data
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerGetQuestionDetailsV1({
        id,
    }: {
        id: string,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/management/questions/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Move a section
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerMoveSectionV1({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: move_section_req_dto_MoveSectionDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/exams/management/sections/{id}/move',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Move a question
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerMoveQuestionV1({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: move_question_req_dto_MoveQuestionDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/exams/management/questions/{id}/move',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Review and approve or reject an exam
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerReviewExamV1({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: review_exam_req_dto_ReviewExamDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/exams/management/{id}/review',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Find exams for management
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerFindExamsV1({
        cursor,
        filter,
        limit,
        sortBy,
    }: {
        cursor?: string,
        filter?: FilterOptionsDto,
        limit?: number,
        sortBy?: SortOptionsDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/management/exams',
            query: {
                'cursor': cursor,
                'filter': filter,
                'limit': limit,
                'sortBy': sortBy,
            },
        });
    }
    /**
     * Get detailed exam management data
     * @returns any
     * @throws ApiError
     */
    public static examManagementGatewayControllerGetExamDetailsV1({
        id,
    }: {
        id: string,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/management/exams/{id}',
            path: {
                'id': id,
            },
        });
    }
}
