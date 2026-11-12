/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Short-lived Google access token only; the Google refresh token never reaches the browser.
 */
export type GoogleCalendarAccessTokenDto = {
    accessToken: string;
    /**
     * Expiry as epoch milliseconds
     */
    expiresAt: number;
};

