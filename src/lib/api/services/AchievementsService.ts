/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseEntity } from '../models/ResponseEntity';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AchievementsService {
    /**
     * Get all available badges
     * @returns any
     * @throws ApiError
     */
    public static achievementGatewayControllerGetAllBadgesV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/achievements/badges',
        });
    }
    /**
     * Get the authenticated user badges
     * @param cursor
     * @param limit
     * @returns any
     * @throws ApiError
     */
    public static achievementGatewayControllerGetMyBadgesV1(
        cursor?: string,
        limit?: number,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/achievements/badges/my',
            query: {
                'cursor': cursor,
                'limit': limit,
            },
        });
    }
    /**
     * Get badges earned by a specific user
     * @param uid
     * @param cursor
     * @param limit
     * @returns any
     * @throws ApiError
     */
    public static achievementGatewayControllerGetSomeonesBadgesV1(
        uid: string,
        cursor?: string,
        limit?: number,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/achievements/badges/{uid}',
            path: {
                'uid': uid,
            },
            query: {
                'cursor': cursor,
                'limit': limit,
            },
        });
    }
    /**
     * Get the authenticated user badges progress
     * @returns any
     * @throws ApiError
     */
    public static achievementGatewayControllerGetMyProgressV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/achievements/badges/my/progress',
        });
    }
}
