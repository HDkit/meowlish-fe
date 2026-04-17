/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { get_presigned_url_req_dto_GetPresignedUrlDto } from '../models/get_presigned_url_req_dto_GetPresignedUrlDto';
import type { ResponseEntity } from '../models/ResponseEntity';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FilesService {
    /**
     * Create a presigned upload URL
     * @returns any
     * @throws ApiError
     */
    public static fileGatewayControllerGetPresignedUrlV1({
        requestBody,
    }: {
        requestBody: get_presigned_url_req_dto_GetPresignedUrlDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/files',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
