export const maxBubbleSize = 300
export const maxEquationsCount = 3
export const Difficulty = {
    EASY: 0,
    MEDIUM: 1,
    HARD: 2
}
export const Status = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2
}

export const ControlState = {
    MOUSE: 0,
    LOADING_HAND: 1,
    HAND: 2
}

export const NotificationType = {
    INFO: 0,
    WARN: 1,
    ERROR: 2,
}

export const MIN_BOARD_WIDTH = 1300
export const MIN_BOARD_HEIGHT = 900
export const MAX_BOARD_HEIGHT_RATIO = 0.8
export const MAX_BOARD_WIDTH_RATIO = 0.8
export const DEFAULT_BOARD_DIMENS = {
    width: `${MAX_BOARD_WIDTH_RATIO * 100}vw`,
    height: `${MAX_BOARD_HEIGHT_RATIO * 100}vh`
}
export const TRIM_RATIO = 0.2
