/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseDataDto } from './ResponseDataDto';
import type { SectionDataDto } from './SectionDataDto';
export type AttemptDataDto = {
    durationLimit: number;
    responses: Array<ResponseDataDto>;
    sections: Array<SectionDataDto>;
    startedAt: string;
};

