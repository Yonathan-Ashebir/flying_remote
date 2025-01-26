import {createContext} from "react";

import {DifficultyLevel, DifficultyLevels, Status, Statuses} from "../types";

export const GameContext = createContext<{
    difficulty: DifficultyLevel,
    status: Status,
    gameStartTime: number,
    gameEndTime: number
}>({
    difficulty: DifficultyLevels.EASY,
    status: Statuses.STOPPED,
    gameStartTime: -1,
    gameEndTime: -1
});