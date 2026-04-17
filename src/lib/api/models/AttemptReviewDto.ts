/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseReviewDto } from './ResponseReviewDto';
import type { SectionReviewDto } from './SectionReviewDto';
export type AttemptReviewDto = {
    durationLimit: number;
    endedAt: string;
    responses: Array<ResponseReviewDto>;
    sections: Array<SectionReviewDto>;
    startedAt: string;
    totalPoints?: number;
};

