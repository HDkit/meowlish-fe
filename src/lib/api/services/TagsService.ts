/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { add_tag_req_dto_AddTagDto } from '../models/add_tag_req_dto_AddTagDto';
import type { move_tag_req_dto_MoveTagDto } from '../models/move_tag_req_dto_MoveTagDto';
import type { ResponseEntity } from '../models/ResponseEntity';
import type { update_tag_dto_UpdateTagDto } from '../models/update_tag_dto_UpdateTagDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TagsService {
    /**
     * Create a tag
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static tagGatewayControllerAddTagV1(
        requestBody: add_tag_req_dto_AddTagDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exams/tags',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a tag
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static tagGatewayControllerDeleteTagV1(
        id: string,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/exams/tags/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Rename a tag
     * @param id
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static tagGatewayControllerUpdateTagV1(
        id: string,
        requestBody: update_tag_dto_UpdateTagDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/exams/tags/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Move a tag under another parent
     * @param id
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static tagGatewayControllerMoveTagV1(
        id: string,
        requestBody: move_tag_req_dto_MoveTagDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exams/tags/{id}/move',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Fetch all tags in a tree format
     * @returns any
     * @throws ApiError
     */
    public static tagGatewayControllerGetTagTreeV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/tags/tree',
        });
    }
    /**
     * Fetch all tags as a list
     * @returns any
     * @throws ApiError
     */
    public static tagGatewayControllerGetTagListV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exams/tags/list',
        });
    }
}
