/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { add_note_req_dto_AddNoteDto } from '../models/add_note_req_dto_AddNoteDto';
import type { answer_req_dto_AnswerDto } from '../models/answer_req_dto_AnswerDto';
import type { attempt_req_dto_AttemptDto } from '../models/attempt_req_dto_AttemptDto';
import type { find_exams_req_dto_FilterOptionsDto } from '../models/find_exams_req_dto_FilterOptionsDto';
import type { find_exams_req_dto_SortOptionsDto } from '../models/find_exams_req_dto_SortOptionsDto';
import type { get_user_calendar_req_dto_TimeRangeDto } from '../models/get_user_calendar_req_dto_TimeRangeDto';
import type { get_users_attempt_history_req_dto_SortOptionsDto } from '../models/get_users_attempt_history_req_dto_SortOptionsDto';
import type { remove_answer_req_dto_RemoveAnswerDto } from '../models/remove_answer_req_dto_RemoveAnswerDto';
import type { ResponseEntity } from '../models/ResponseEntity';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExamPracticeService {
    /**
     * Start a practice attempt for an exam
     * @param id
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerAttemptV1(
        id: string,
        requestBody: attempt_req_dto_AttemptDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exams/practice/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Submit an attempt
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerEndAttemptV1(
        id: string,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exams/practice/attempt/{id}/submit',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Answer a question in an attempt
     * @param id
     * @param questionId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerAnswerV1(
        id: string,
        questionId: string,
        requestBody: answer_req_dto_AnswerDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exams/practice/attempt/{id}/answers/{questionId}',
            path: {
                'id': id,
                'questionId': questionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Remove an answer from a question in an attempt
     * @param id
     * @param questionId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerRemoveAnswerV1(
        id: string,
        questionId: string,
        requestBody: remove_answer_req_dto_RemoveAnswerDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/exams/practice/attempt/{id}/answers/{questionId}',
            path: {
                'id': id,
                'questionId': questionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Toggle question flag state
     * @param id
     * @param questionId
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerToggleFlagV1(
        id: string,
        questionId: string,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/exams/practice/attempt/{id}/answers/{questionId}/flag',
            path: {
                'id': id,
                'questionId': questionId,
            },
        });
    }
    /**
     * Add or update a note for a question
     * @param id
     * @param questionId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerAddNoteV1(
        id: string,
        questionId: string,
        requestBody: add_note_req_dto_AddNoteDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/exams/practice/attempt/{id}/answers/{questionId}/note',
            path: {
                'id': id,
                'questionId': questionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Find exams available for practice
     * @param filter
     * @param sortBy
     * @param cursor
     * @param limit
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerFindExamsV1(
        filter?: find_exams_req_dto_FilterOptionsDto,
        sortBy?: find_exams_req_dto_SortOptionsDto,
        cursor?: string,
        limit?: number,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/practice',
            query: {
                'filter': filter,
                'sortBy': sortBy,
                'cursor': cursor,
                'limit': limit,
            },
        });
    }
    /**
     * Get exam details for practice
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerGetExamDetailsV1(
        id: string,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/practice/{id}/details',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get detailed question information for practice
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerGetDetailedQuestionInfoV1(
        id: string,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/practice/questions/{id}/details',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get aggregate exam statistics
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerGetExamStatsV1(
        id: string,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/practice/{id}/stats',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get saved attempt data
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerGetAttemptSavedDataV1(
        id: string,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/practice/attempt/{id}/saved',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get attempt review data
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerGetAttemptReviewV1(
        id: string,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/practice/attempt/{id}/review',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get the authenticated user practice calendar
     * @param range
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerGetUsersAttemptSummaryV1(
        range: get_user_calendar_req_dto_TimeRangeDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/practice/my/calendar',
            query: {
                'range': range,
            },
        });
    }
    /**
     * Get the authenticated user attempt history
     * @param examId
     * @param cursor
     * @param limit
     * @param sortBy
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerGetUsersAttemptHistoryV1(
        examId?: string,
        cursor?: string,
        limit?: number,
        sortBy?: get_users_attempt_history_req_dto_SortOptionsDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/practice/my/history',
            query: {
                'examId': examId,
                'cursor': cursor,
                'limit': limit,
                'sortBy': sortBy,
            },
        });
    }
    /**
     * Get the authenticated user practice stats
     * @returns any
     * @throws ApiError
     */
    public static examPracticeGatewayControllerGetUsesStatsV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/practice/my/stats',
        });
    }
}
