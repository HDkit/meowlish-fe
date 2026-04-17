/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { attempt_review_res_dto_ChoiceDto } from './attempt_review_res_dto_ChoiceDto';
export type QuestionReviewDto = {
    choices: Array<attempt_review_res_dto_ChoiceDto>;
    content: string;
    fileUrls: Array<string>;
    id: string;
    order: number;
    points: number;
    tags: Array<string>;
    type: string;
};

