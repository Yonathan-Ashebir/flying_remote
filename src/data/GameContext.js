import {createContext} from "react";
import {Difficulty, Status} from "./contants";

export const GameContext = createContext({difficulty: Difficulty.EASY, status: Status.STOPPED});