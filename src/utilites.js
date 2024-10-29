const {createRef} = require("react");

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

module.exports = {
    wait: millis => new Promise(resolve => setTimeout(resolve, millis)),
    generateEquation: (answer, difficulty) => ({
        answer,
        suspended: false,
        releaseTime: 0,
        question: ['x', '+', '2', '= ', answer + 2],
        reference: createRef()
    }),
    getNumberBounds: difficulty => [0, 100],
    getNextBubbleTimeBounds: difficulty => [700, 2000],
    getBubbleDurationBounds: difficulty => [5000, 5000],
    getRandom: (lower, upper) => lower + Math.random() * (upper - lower),
    getBubbleSizeBounds: difficulty => [70, 300],
    lowerBound, upperBound, equalRange,
    getEquationBubbleBounds: difficulty => [0, 0.2],
    getReleaseTimeBounds: difficulty => [1000, 2000],
    getBonus: (index, difficult) => 5
}