/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type update_section_req_dto_UpdateSectionDto = {
    contentType?: string;
    directive?: string;
    name?: string;
    setNameNull?: boolean;
    /**
     * Ids of tags (not names)
     */
    addTags: Array<string>;
    /**
     * Ids of tags (not names)
     */
    removeTags: Array<string>;
    addFiles: Array<string>;
    removeFiles: Array<string>;
};

