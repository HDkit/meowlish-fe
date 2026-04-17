/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChoiceDto } from './ChoiceDto';
import type { FilePreviewDto } from './FilePreviewDto';
export type QuestionManagementInfoDto = {
    choices: Array<ChoiceDto>;
    content: string;
    explanation: string;
    files: Array<FilePreviewDto>;
    id: string;
    points: number;
    sectionId: string;
    tags: Array<string>;
    type: string;
};

