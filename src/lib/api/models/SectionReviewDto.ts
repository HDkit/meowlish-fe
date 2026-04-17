/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestionReviewDto } from './QuestionReviewDto';
export type SectionReviewDto = {
    directive: string;
    fileUrls: Array<string>;
    id: string;
    name?: string;
    order: number;
    questions: Array<QuestionReviewDto>;
    sections: Array<SectionReviewDto>;
    type: string;
};

