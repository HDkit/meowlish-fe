/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseEntity } from '../models/ResponseEntity';
import type { set_goal_req_dto_SetGoalDto } from '../models/set_goal_req_dto_SetGoalDto';
import type { update_goal_req_dto_UpdateGoalDto } from '../models/update_goal_req_dto_UpdateGoalDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GoalsService {
    /**
     * Set a goal for the authenticated user
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static goalGatewayControllerSetGoalV1(
        requestBody: set_goal_req_dto_SetGoalDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exams/goals/my',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete the authenticated user goal
     * @returns any
     * @throws ApiError
     */
    public static goalGatewayControllerDeleteGoalV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/exams/goals/my',
        });
    }
    /**
     * Update the authenticated user goal
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static goalGatewayControllerUpdateGoalV1(
        requestBody: update_goal_req_dto_UpdateGoalDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/exams/goals/my',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get the authenticated user goal
     * @returns any
     * @throws ApiError
     */
    public static goalGatewayControllerGetGoalV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/goals/my',
        });
    }
}
