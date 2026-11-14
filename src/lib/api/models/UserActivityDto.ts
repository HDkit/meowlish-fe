/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ActivityDayDto = {
    /**
     * Attempts finished that day
     */
    attempts: number;
    /**
     * UTC day, YYYY-MM-DD
     */
    date: string;
    /**
     * Practice time, each attempt capped at 3 h
     */
    minutes: number;
};
export type UserActivityDto = {
    /**
     * All-time days with a finished attempt
     */
    activeDays: number;
    /**
     * Consecutive UTC days with practice, ending today or yesterday
     */
    currentStreak: number;
    /**
     * Only days with activity, ascending
     */
    days: Array<ActivityDayDto>;
    /**
     * First day of the range (UTC)
     */
    from: string;
    longestStreak: number;
    /**
     * Today (UTC)
     */
    to: string;
    /**
     * All-time finished attempts
     */
    totalAttempts: number;
};

