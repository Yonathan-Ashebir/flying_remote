import {RefObject} from "react";

export const DifficultyLevels = {
    EASY: 0, MEDIUM: 1, HARD: 2
} as const
export type DifficultyLevel = typeof DifficultyLevels[keyof typeof DifficultyLevels];
export const getDifficultyLabel= (difficulty: DifficultyLevel)=> difficulty === DifficultyLevels.EASY? 'easy': difficulty === DifficultyLevels.MEDIUM? 'medium': 'hard';

export const Statuses = {
    PLAYING: 0, PAUSED: 1, STOPPED: 2
} as const
export type Status = typeof Statuses[keyof typeof Statuses];

export const ControlStates = {
    MOUSE: 0, LOADING_HAND: 1, HAND: 2
} as const
export type ControlState = typeof ControlStates[keyof typeof ControlStates];

export const NotificationTypes = {
    INFO: 0, WARN: 1, ERROR: 2,
} as const
export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];


export interface Bubble {
    value: number;
    createTime: number,
    duration: number,
    auxiliary: number,
    size: number,
    popped: boolean,
    reference: RefObject<HTMLElement>
}

export const EventTypes = {
    POP: 'pop',
    PAUSE: 'pause',
    STOP: 'stop',
    CONTINUE: 'continue',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

export interface Equation {
    suspended: boolean,
    question: (string | number)[]
    answer: number
    releaseTime: number,
    reference: RefObject<HTMLElement>
}