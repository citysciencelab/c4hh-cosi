/**
 * Linear filter for an index
 * @param {Number} i - the index
 * @param {Number} len - the length of the list
 * @param {Number} [integral=1] - the integral (sum) for all indices
 * @returns {Number} the weight of the index
 */
function filterLinear (i, len, integral = 1) {
    return (2 * integral / len) * (i + 0.5);
}

/**
 * Local derivation for every two neighboring values
 * @param {Number[]} arr - array of values, len n
 * @returns {Number[]} the list of local slopes, len n-1
 */
function deriveLocalLinear (arr) {
    return arr.map((v, i) => arr[i + 1] / v).filter(v => !isNaN(v));
}

/**
 * gets the average for a set of dy/dt incl. bias for latest values
 * @param {*} arr - list of values
 * @param {*} steps - n steps for linear filter
 * @returns {Number} the average slope
 */
function averageSlope (arr, steps = 5) {
    const _steps = arr.length > steps ? steps : arr.length;

    return arr
        .slice(arr.length - _steps)
        .map((v, i) => v * filterLinear(i, _steps))
        .reduce((r, v)=> r + v, 0) / _steps;
}

/**
 * Extrapolates the trend of growth for the next timestep in a series
 * Looks at the slope and change of slope for the last 5 timesteps
 * @param {Object} stats - the stats properties per indicator and district
 * @param {Number[]} timestamps - all relevant timesteps
 * @param {String} [currentTimestamp] - the currentTimestamp (last entry if not provided)
 * @param {String} [timestampPrefix="jahr_"] - timestamp props prefix
 * @return {Number} the projected growth for the next timestep
 */
export function getTrend (stats, timestamps, currentTimestamp, timestampPrefix = "jahr_") {
    const
        _timestamps = currentTimestamp ? timestamps.filter(t => t <= currentTimestamp) : timestamps,
        vals = _timestamps.map(t => parseFloat(stats[timestampPrefix + t])).reverse(),
        dy_1 = deriveLocalLinear(vals),
        dy_2 = deriveLocalLinear(dy_1),
        avg_dy_2 = averageSlope(dy_2),
        dy = avg_dy_2 * dy_1[dy_1.length - 1];

    return dy;
}

/**
 * gets a style for a trend arrow
 * @param {Number} dy - the expected growth for the next timestep
 * @returns {Object} css style
 */
export function getTrendStyle (dy) {
    if (dy > 1.055) {
        return {color: "green", transform: "rotate(-60deg)"};
    }
    if (dy > 1.045 && dy <= 1.055) {
        return {color: "green", transform: "rotate(-50deg)"};
    }
    if (dy > 1.035 && dy <= 1.045) {
        return {color: "green", transform: "rotate(-40deg)"};
    }
    if (dy > 1.025 && dy <= 1.035) {
        return {color: "green", transform: "rotate(-30deg)"};
    }
    if (dy > 1.015 && dy <= 1.025) {
        return {color: "green", transform: "rotate(-20deg)"};
    }
    if (dy > 1.005 && dy <= 1.015) {
        return {color: "green", transform: "rotate(-10deg)"};
    }
    if (dy >= 0.995 && dy <= 1.005) {
        return {color: "lightgrey"};
    }
    if (dy >= 0.985 && dy < 0.995) {
        return {color: "crimson", transform: "rotate(10deg)"};
    }
    if (dy >= 0.975 && dy < 0.985) {
        return {color: "crimson", transform: "rotate(20deg)"};
    }
    if (dy >= 0.965 && dy < 0.975) {
        return {color: "crimson", transform: "rotate(30deg)"};
    }
    if (dy >= 0.955 && dy < 0.965) {
        return {color: "crimson", transform: "rotate(40deg)"};
    }
    if (dy >= 0.945 && dy < 0.955) {
        return {color: "crimson", transform: "rotate(50deg)"};
    }
    if (dy < 0.945) {
        return {color: "crimson", transform: "rotate(60deg)"};
    }

    return {display: "none"};
}
