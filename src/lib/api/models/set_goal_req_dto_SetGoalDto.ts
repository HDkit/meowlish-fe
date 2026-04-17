/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type set_goal_req_dto_SetGoalDto = {
    date: string;
    target: number;
    type: set_goal_req_dto_SetGoalDto.type;
};
export namespace set_goal_req_dto_SetGoalDto {
    export enum type {
        IELTS = 'IELTS',
        TOEIC = 'TOEIC',
        VSTEP = 'VSTEP',
        TOEFL = 'TOEFL',
    }
}

