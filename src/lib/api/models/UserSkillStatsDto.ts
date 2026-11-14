/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SkillScorePointDto = {
    attemptId: string;
    /**
     * Average AI writing band (0-9)
     */
    band?: number;
    endedAt: string;
    examTitle: string;
    /**
     * Score on this skill in that attempt, 0-100
     */
    percent: number;
};
export type SkillStatsDto = {
    /**
     * Attempts that practised this skill
     */
    attempts: number;
    averageBand?: number;
    averagePercent?: number;
    bestPercent?: number;
    lastPercent?: number;
    /**
     * Up to 10 latest, oldest first
     */
    recent: Array<SkillScorePointDto>;
    skill: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING';
};
export type TagAccuracyDto = {
    correct: number;
    incorrect: number;
    name: string;
    skipped: number;
};
export type UserSkillStatsDto = {
    /**
     * Latest finished attempts looked at (max 100)
     */
    attemptsConsidered: number;
    /**
     * Always all four skills
     */
    skills: Array<SkillStatsDto>;
    /**
     * Question tags, weakest first
     */
    tags: Array<TagAccuracyDto>;
};

