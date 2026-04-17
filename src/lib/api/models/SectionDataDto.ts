/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestionDataDto } from './QuestionDataDto';
export type SectionDataDto = {
    directive: string;
    fileUrls: Array<string>;
    id: string;
    name?: string;
    order: number;
    questions: Array<QuestionDataDto>;
    sections: Array<SectionDataDto>;
    type: string;
};

