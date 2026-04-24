/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { add_mail_cred_req_dto_AddMailCredDto } from '../models/add_mail_cred_req_dto_AddMailCredDto';
import type { assign_role_to_req_dto_AssignRoleToDto } from '../models/assign_role_to_req_dto_AssignRoleToDto';
import type { login_mail_req_dto_LoginMailDto } from '../models/login_mail_req_dto_LoginMailDto';
import type { register_mail_req_dto_RegisterMailDto } from '../models/register_mail_req_dto_RegisterMailDto';
import type { remove_role_from_req_dto_RemoveRoleFromDto } from '../models/remove_role_from_req_dto_RemoveRoleFromDto';
import type { ResponseEntity } from '../models/ResponseEntity';
import type { update_identity_req_dto_UpdateIdentityDto } from '../models/update_identity_req_dto_UpdateIdentityDto';
import type { update_password_req_dto_UpdateMailPasswordDto } from '../models/update_password_req_dto_UpdateMailPasswordDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Register with email and password
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerRegisterMailV1(
        requestBody: register_mail_req_dto_RegisterMailDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Log in with email and password
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerLoginMailV1(
        requestBody: login_mail_req_dto_LoginMailDto,
    ): CancelablePromise<ResponseEntity> {
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
    /**
     * Get Google redirect to login/register with OAuth2
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerLoginOrRegisterGoogleV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/google',
        });
    }
    /**
     * Callback url for OAuth2
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerGoogleCallbackV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/google/callback',
        });
    }
    /**
     * Add Google credential to existing account
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerAddGoogleCredV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/credentials/google',
        });
    }
    /**
     * Add mail credential to existing account
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerAddMailCredentialV1(
        requestBody: add_mail_cred_req_dto_AddMailCredDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/credentials/mail',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete credential from existing account
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerRemoveCredentialV1(
        id: string,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/auth/credentials/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Assign a role to someone
     * @param id
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerAssignRoleToV1(
        id: string,
        requestBody: assign_role_to_req_dto_AssignRoleToDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/{id}/roles',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Remove a role of someone
     * @param id
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerRemoveRoleFromV1(
        id: string,
        requestBody: remove_role_from_req_dto_RemoveRoleFromDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/auth/{id}/roles',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Find identities with roles and permissions
     * @param usernameOrCredIdentifierOrId
     * @param hasPerms
     * @param hasRoles
     * @param cursor
     * @param limit
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerFindIdentitiesV1(
        usernameOrCredIdentifierOrId?: string,
        hasPerms?: Array<string>,
        hasRoles?: Array<string>,
        cursor?: string,
        limit?: number,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/identities',
            query: {
                'usernameOrCredIdentifierOrId': usernameOrCredIdentifierOrId,
                'hasPerms': hasPerms,
                'hasRoles': hasRoles,
                'cursor': cursor,
                'limit': limit,
            },
        });
    }
    /**
     * Find public identity profiles
     * @param usernameOrCredIdentifier
     * @param cursor
     * @param limit
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerFindIdentitiesLimitedV1(
        usernameOrCredIdentifier?: string,
        cursor?: string,
        limit?: number,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/identities-public',
            query: {
                'usernameOrCredIdentifier': usernameOrCredIdentifier,
                'cursor': cursor,
                'limit': limit,
            },
        });
    }
    /**
     * Find identity ids only
     * @param usernameOrCredIdentifier
     * @param cursor
     * @param limit
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerFindIdentityIdsV1(
        usernameOrCredIdentifier?: string,
        cursor?: string,
        limit?: number,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/identity-ids',
            query: {
                'usernameOrCredIdentifier': usernameOrCredIdentifier,
                'cursor': cursor,
                'limit': limit,
            },
        });
    }
    /**
     * Get your credentials list
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerGetCredentialsV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/credentials',
        });
    }
    /**
     * Get a roles list
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerGetRoleListV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/roles',
        });
    }
    /**
     * Get a permissions list
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerGetPermListV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/perms',
        });
    }
    /**
     * Update your account information
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerUpdateIdentityV1(
        requestBody: update_identity_req_dto_UpdateIdentityDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/my/identity',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get your own identity information
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerGetOwnIdentityV1(): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/my/identity',
        });
    }
    /**
     * Change password
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerUpdateMailPasswordV1(
        requestBody: update_password_req_dto_UpdateMailPasswordDto,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/credentials/mail/password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Hydrate ids to identities
     * @param ids
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerHydrateIdentitiesV1(
        ids: Array<string>,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/hydrate-many',
            query: {
                'ids': ids,
            },
        });
    }
    /**
     * Hydrate an id to an identity
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static authGatewayControllerHydrateIdentityV1(
        id: string,
    ): CancelablePromise<ResponseEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/hydrate',
            query: {
                'id': id,
            },
        });
    }
}
