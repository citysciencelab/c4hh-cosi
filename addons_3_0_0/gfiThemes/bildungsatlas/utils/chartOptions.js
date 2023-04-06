/**
 * for Bildungsatlas we can set chartOptions via config.json
 * these are the helper functions for this matter
 */

/**
 * checks if the given charts options are an object as decribed for chartOptions for Bildungsatlas config.json
 * @param {String} propertyName the property name to lookup in chartOptions
 * @param {*} chartOptions the options to use, may be an object
 * @returns {Boolean} true if it is save to use chartOptions, false if not
 */
function isChartOptions (propertyName, chartOptions) {
    return typeof propertyName === "string"
        && typeof chartOptions === "object" && chartOptions !== null
        && Object.prototype.hasOwnProperty.call(chartOptions, propertyName)
        && typeof chartOptions[propertyName] === "object" && chartOptions[propertyName] !== null;
}

/**
 * returns the options for the chart using the chartOptions
 * @param {String} propertyName the property name to lookup in chartOptions
 * @param {Object} chartOptions the options to use
 * @param {Number} [chartOptions.suggestedMin=undefined] the min value of the y axis
 * @param {Number} [chartOptions.suggestedMax=undefined] the max value of the y axis
 * @param {Number} [chartOptions.stepSize=undefined] the step size on the y axis
 * @returns {Object|boolean} the options for ChartJS or false on error
 */
function getChartOptions (propertyName, chartOptions) {
    if (!isChartOptions(propertyName, chartOptions)) {
        return false;
    }
    return {
        scales: {
            yAxes: [{
                ticks: chartOptions[propertyName]
            }]
        }
    };
}

/**
 * returns the options for the chart with unit for percentages
 * @param {String} propertyName the property name to lookup in chartOptions
 * @param {Object} chartOptions the options to use
 * @param {Number} [chartOptions.suggestedMin=0] the min value of the y axis
 * @param {Number} [chartOptions.suggestedMax=100] the max value of the y axis
 * @param {Number} [chartOptions.stepSize=20] the step size on the y axis
 * @returns {Object} the options for ChartJS
 */
function getChartOptionsForPercentage (propertyName, chartOptions) {
    let options = chartOptions;

    if (!isChartOptions(propertyName, options)) {
        options = {};
        options[propertyName] = {
            suggestedMin: 0,
            suggestedMax: 100,
            stepSize: 20
        };
    }
    return {
        scales: {
            yAxes: [{
                ticks: {
                    suggestedMin: typeof options[propertyName].suggestedMin === "number" ? options[propertyName].suggestedMin : 0,
                    suggestedMax: typeof options[propertyName].suggestedMax === "number" ? options[propertyName].suggestedMax : 100,
                    stepSize: typeof options[propertyName].stepSize === "number" ? options[propertyName].stepSize : 20
                }
            }]
        }
    };
}

export {isChartOptions, getChartOptions, getChartOptionsForPercentage};
