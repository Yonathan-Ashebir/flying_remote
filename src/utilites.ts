import {DifficultyLevel, DifficultyLevels, Equation} from "./types";
import {createRef} from "react";

export function lowerBound(arr: number[], value: number, lessThan = (a: number, b: number) => a < b) {
    let left = 0, right = arr.length;
    while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (lessThan(arr[mid], value)) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;
}

export function upperBound(arr: number[], value: number, greaterThan = (a: number, b: number) => a > b) {
    let left = 0, right = arr.length;
    while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (greaterThan(arr[mid], value)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

export function equalRange(arr: number[], value: number, lessThan = (a: number, b: number) => a < b, greaterThan = (a: number, b: number) => a > b) {
    const lower = lowerBound(arr, value, lessThan);
    const upper = upperBound(arr, value, greaterThan);
    return [lower, upper];
}

export const constrainBetween = (val: number, lower: number, upper: number) => Math.max(Math.min(val, upper), lower)

export const selectScale = (dimens: { value: number, lower?: number, upper?: number }[]) => {
    let maximumLowerScale = 0;
    let minimumUpperScale = Number.MAX_VALUE;
    for (const dimen of dimens) {
        const {value, lower = 0, upper = Number.MAX_VALUE} = dimen
        const lowerScale = lower / value;
        const upperScale = upper / value;
        maximumLowerScale = Math.max(maximumLowerScale, lowerScale);
        minimumUpperScale = Math.min(minimumUpperScale, upperScale);
    }
    return {maximumLowerScale, minimumUpperScale}
}

// export const getNumberBounds = (difficulty: DifficultyLevel): [number, number] => difficulty === DifficultyLevels.EASY ? [0, 10] : difficulty === DifficultyLevels.MEDIUM ? [0, 20] : [0, 50]
export const getNumberBounds = (difficulty: DifficultyLevel): [number, number] => [0, 10]

export const getRandom = (lower: number, upper: number) => lower + Math.random() * (upper - lower)

export const wait = (millis: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, millis));

export const waitForNextAnimationFrame = (): Promise<number> =>
    new Promise(resolve => requestAnimationFrame(resolve));

export const generateEquation = (answer: number, difficulty: DifficultyLevel): Equation => {
    const addened = Math.floor(getRandom(...getNumberBounds(difficulty)));
    return {
        answer,
        suspended: false,
        releaseTime: 0,
        question: ['x', '+', addened, '=', answer + addened],
        reference: createRef<HTMLDivElement>() // Assuming this is for React components
    };
};

export const getNextBubbleTimeBounds = (difficulty: DifficultyLevel): [number, number] =>
    difficulty === DifficultyLevels.EASY ? [1000, 2000] :
        difficulty === DifficultyLevels.MEDIUM ? [1000, 1500] :
            [700, 1500];

export const getBubbleDurationBounds = (difficulty: DifficultyLevel): [number, number] =>
    difficulty === DifficultyLevels.EASY ? [6000, 7000] :
        difficulty === DifficultyLevels.MEDIUM ? [3500, 5500] :
            [2000, 4500];

export const getShouldHaveEquationProbability = (difficulty: DifficultyLevel): number =>
    difficulty === DifficultyLevels.EASY ? 3 / 5 :
        difficulty === DifficultyLevels.MEDIUM ? 3 / 5 :
            3 / 5;

export const getBubbleSizeBounds = (difficulty: DifficultyLevel): [number, number] => [70, 300];

export const getEquationBubbleBounds = (difficulty: DifficultyLevel): [number, number] => [0, 0.2];

export const getReleaseTimeBounds = (difficulty: DifficultyLevel): [number, number] =>
    difficulty === DifficultyLevels.EASY ? [1000, 3000] :
        difficulty === DifficultyLevels.MEDIUM ? [1500, 3000] :
            [2000, 3000];

export const getBonus = (index: number, difficulty: DifficultyLevel): number => (3 - index) * 5;

export const getDeduction = (difficulty: DifficultyLevel): number => 5;

export const getGameDuration = (): number => 60000;

export const notify = (msg: string, type?: string): void => window.alert(msg);

export const selectBestScale = (dimens: { value: number, lower?: number, upper?: number }[]): number => {
    const {maximumLowerScale, minimumUpperScale} = selectScale(dimens);
    if (minimumUpperScale > maximumLowerScale) {
        return constrainBetween(1, maximumLowerScale, minimumUpperScale);
    }
    return maximumLowerScale;
};
