/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type get_users_attempt_history_req_dto_SortOptionsDto = {
    key: get_users_attempt_history_req_dto_SortOptionsDto.key;
    direction: get_users_attempt_history_req_dto_SortOptionsDto.direction;
};
export namespace get_users_attempt_history_req_dto_SortOptionsDto {
    export enum key {
        ENDED_AT = 'endedAt',
        STARTED_AT = 'startedAt',
        EXAM_ID = 'examId',
        SCORE = 'score',
    }
    export enum direction {
        ASC = 'ASC',
        DESC = 'DESC',
    }
}

