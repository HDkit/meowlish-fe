/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { login_mail_req_dto_LoginMailDto } from '../models/login_mail_req_dto_LoginMailDto';
import type { register_mail_req_dto_RegisterMailDto } from '../models/register_mail_req_dto_RegisterMailDto';
import type { ResponseEntity } from '../models/ResponseEntity';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Register with email and password
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerRegisterV1({
        requestBody,
    }: {
        requestBody: register_mail_req_dto_RegisterMailDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Log in with email and password
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerLoginV1({
        requestBody,
    }: {
        requestBody: login_mail_req_dto_LoginMailDto,
    }): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Refresh access tokens using a refresh token
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerRefreshV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/refresh',
        });
    }
    /**
     * Log out from all active sessions
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerLogoutAllV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/logout-all',
        });
    }
}
