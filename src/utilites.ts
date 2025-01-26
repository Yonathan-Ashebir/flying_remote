const {createRef} = require("react");
const {Difficulty} = require("./data/contants");

function lowerBound(arr, value, lessThan = (a, b) => a < b) {
    let left = 0, right = arr.length;
    while (left < right) {
        let mid = Math.floor((left + right) / 2);
        if (lessThan(arr[mid], value)) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;
}

function upperBound(arr, value, greaterThan = (a, b) => a > b) {
    let left = 0, right = arr.length;
    while (left < right) {
        let mid = Math.floor((left + right) / 2);
        if (greaterThan(arr[mid], value)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

function equalRange(arr, value, lessThan = (a, b) => a < b, greaterThan = (a, b) => a > b) {
    const lower = lowerBound(arr, value, lessThan);
    const upper = upperBound(arr, value, greaterThan);
    return [lower, upper];
}

const constrainBetween = (val, lower, upper) => Math.max(Math.min(val, upper), lower)

const selectScale = dimens => {
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

const getNumberBounds = difficulty => difficulty === Difficulty.EASY ? [0, 10] : difficulty === Difficulty.MEDIUM ? [0, 20] : [0, 50]

const getRandom = (lower, upper) => lower + Math.random() * (upper - lower)

module.exports = {
    wait: millis => new Promise(resolve => setTimeout(resolve, millis)),
    waitForNextAnimationFrame: () => new Promise(resolve => requestAnimationFrame(resolve)),
    constrainBetween,
    generateEquation: (answer, difficulty) => {
        const addened = Math.floor(getRandom(...getNumberBounds(difficulty)))
        return {
            answer,
            suspended: false,
            releaseTime: 0,
            question: ['x', '+', addened, '= ', answer + addened],
            reference: createRef()
        }
    },
    getNumberBounds,
    getNextBubbleTimeBounds: difficulty => difficulty === Difficulty.EASY ? [400, 1000] : difficulty === Difficulty.MEDIUM ? [157.14, 557.14] : [122.2, 322.2],
    getBubbleDurationBounds: difficulty => difficulty === Difficulty.EASY ? [4000, 4500] : difficulty === Difficulty.MEDIUM ? [2000, 3000] : [1500, 2500],
    getShouldHaveEquationProbability: difficulty => difficulty === Difficulty.EASY ? 3 / 5 : difficulty === Difficulty.MEDIUM ? 3 / 7 : 1 / 3,
    getRandom,
    getBubbleSizeBounds: difficulty => [70, 300],
    lowerBound, upperBound, equalRange,
    getEquationBubbleBounds: difficulty => [0, 0.2],
    getReleaseTimeBounds: difficulty => difficulty === Difficulty.EASY ? [1000, 3000] : difficulty === Difficulty.MEDIUM ? [1500, 3000] : [2000, 3000],
    getBonus: (index, difficult) => (3 - index) * 5,
    getDeduction: (difficulty) => 5,
    getGameDuration: () => 60000,
    notify: (msg, type) => window.alert(msg),
    selectScale,
    selectBestScale: dimens => {
        const {maximumLowerScale, minimumUpperScale} = selectScale(dimens);
        if (minimumUpperScale > maximumLowerScale) return constrainBetween(1, maximumLowerScale, minimumUpperScale)
        return maximumLowerScale
    }
}