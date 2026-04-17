/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type update_goal_req_dto_UpdateGoalDto = {
    date: string;
    target: number;
    type: update_goal_req_dto_UpdateGoalDto.type;
};
export namespace update_goal_req_dto_UpdateGoalDto {
    export enum type {
        IELTS = 'IELTS',
        TOEIC = 'TOEIC',
        VSTEP = 'VSTEP',
        TOEFL = 'TOEFL',
    }
}

