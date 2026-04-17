/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ResponseEntity = {
    /**
     * API path
     */
    path: string;
    /**
     * HTTP status code
     */
    statusCode: number;
    /**
     * Request success status
     */
    success: boolean;
    /**
     * Response timestamp
     */
    timestamp: Record<string, any>;
    /**
     * Error message if any
     */
    error?: Record<string, any>;
    /**
     * Response payload, null if error and in special cases
     */
    data: Record<string, any> | null;
};

