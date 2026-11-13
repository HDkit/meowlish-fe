/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type find_exams_req_dto_FilterOptionsDto = {
    name?: string;
    /**
     * Exams with ANY of these tag names (a descendant tag also matches)
     */
    tags?: Array<string>;
    /**
     * Exams with EVERY one of these tag names (or a descendant of each), e.g. ["TOEIC"]
     */
    requiredTags?: Array<string>;
};

