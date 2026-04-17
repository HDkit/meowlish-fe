/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddChoiceDto } from './AddChoiceDto';
import type { UpdateChoiceDto } from './UpdateChoiceDto';
export type update_question_req_dto_UpdateQuestionDto = {
    addChoices: Array<AddChoiceDto>;
    deleteChoicesIds: Array<string>;
    updateChoices: Array<UpdateChoiceDto>;
    content?: string;
    explanation?: string;
    points?: number;
    type?: string;
    addTags: Array<string>;
    removeTags: Array<string>;
    addFiles: Array<string>;
    removeFiles: Array<string>;
};

