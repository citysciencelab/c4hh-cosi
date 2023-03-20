import ChartDataset from "../../ChartGenerator/classes/ChartDataset";

/**
 * @description Adjusting data for Graph Generator Tool.
 * @param {Object} data - the item from the dashboardTable
 * @param {String} dist the district
 * @param {Number[]} timestamps - the timestamps for the x-Axis
 * @param {String} timestampPrefix - the string the timestamps start with (e.g. jahr_)
 * @returns {void}
 */
function prepareGraphData (data, dist, timestamps, timestampPrefix) {
    const statFeature = data[dist.value],
        newDataset = {
            label: dist.text,
            data: []
        };

    for (const timestamp of timestamps) {
        newDataset.data.push(statFeature?.[timestampPrefix + timestamp]);
    }

    newDataset.data.reverse();

    return newDataset;
}

/**
 * @description Adjusting data for Graph Generator Tool.
 * @param {Object} data - the correlation data from the dashboardTable
 * @returns {void}
 */
function prepareScatterData (data) {
    const datasets = {};

    for (const datum of data) {
        if (datasets[datum.district]) {
            datasets[datum.district].data.push(datum);
        }
        else {
            datasets[datum.district] = {
                label: datum.district,
                data: [datum]
            };
        }
    }

    return Object.values(datasets);
}

/**
 * @description Adjusting data for Graph Generator Tool.
 * @param {Object} correlation - the correlation data from the dashboardTable
 * @returns {void}
 */
function prepareLinRegData (correlation) {
    return {
        type: "line",
        label: "Regression",
        data: correlation.data.map(datum => ({
            x: datum.x,
            y: datum.yEst
        })),
        correlation: correlation.correlation,
        covariance: correlation.covariance,
        options: {
            showLine: true
        }
    };
}

/**
* @description Passes data to the Chart Generator Tool.
* @param {Object[]} graphData - the data for all districts
* @param {String} districtLevelLabel - the label of the districtLevel
* @param {String} category - the category to get the charts for
* @param {Number[]} timestamps - the timestamps for the x-Axis
* @returns {Void} Function returns nothing.
*/
export function generateGraphObj (graphData, districtLevelLabel, category, timestamps) {
    return new ChartDataset({
        id: "ccm",
        name: districtLevelLabel + " - " + category,
        type: ["LineChart", "BarChart", "PieChart"],
        color: "rainbow",
        source: "Dashboard",
        scaleLabels: [category, "Jahre"],
        data: {
            labels: [...timestamps].reverse(),
            datasets: graphData
        }
    });
}

/**
* @description Passes data to the Chart Generator Tool.
* @param {Object[]} graphData - the data for all districts
* @param {String} categoryX - the category displayed on the x Axis
* @param {String} categoryY - the category displayed on the y Axis
* @returns {Void} Function returns nothing.
*/
export function generateScatterGraphObj (graphData, categoryX, categoryY) {
    return new ChartDataset({
        id: "ccm",
        name: `${categoryY} / ${categoryX}`,
        type: "ScatterChart",
        color: "rainbow",
        source: "Dashboard",
        scaleLabels: [categoryY, categoryX],
        data: {
            datasets: graphData
        }
    });
}

/**
 * Generates chart data from a set of districts and their stats feature
 * @param {Object} data - the item from the dashboardTable
 * @param {String[]} districtCols - the districts objects to generate the chart data for
 * @param {String} districtLevelLabel - the label of the districtLevel
 * @param {String} timestampPrefix - the string the timestamps start with (e.g. jahr_)
 * @returns {ChartDataset} the chart data
 */
export function generateChartForDistricts (data, districtCols, districtLevelLabel, timestampPrefix = "jahr_") {
    const graphData = districtCols.map(dist => prepareGraphData(data, dist, data.years, timestampPrefix)),
        graphObj = generateGraphObj(graphData, districtLevelLabel, data.category, data.years);

    return graphObj;
}

/**
 * Generates chart data from a correlation data set
 * @param {Object} correlation - the correlation data calculated from dashboardTable
 * @param {String} categoryX - the category displayed on the x Axis
 * @param {String} categoryY - the category displayed on the y Axis
 * @returns {ChartDataset} the chart data
 */
export function generateChartForCorrelation (correlation, categoryX, categoryY) {
    const scatterData = prepareScatterData(correlation.data),
        lineData = prepareLinRegData(correlation),
        graphObj = generateScatterGraphObj([...scatterData, lineData], categoryX, categoryY);

    return graphObj;
}

/**
 * Generates chart data from a set of districts and their stats feature
 * @param {Object} data - the item from the dashboardTable
 * @param {String[]} districtCols - the districts objects to generate the chart data for
 * @param {String} districtLevelLabel - the label of the districtLevel
 * @param {String} timestampPrefix - the string the timestamps start with (e.g. jahr_)
 * @returns {ChartDataset} the chart data
 */
export function generateChartsForItems (data, districtCols, districtLevelLabel, timestampPrefix = "jahr_") {
    const
        timestamps = [...new Set(data.reduce((res, item) => [...res, ...item.years], []))].sort(),
        graphs = districtCols.map(col => {
            const chartData = {
                labels: timestamps,
                datasets: data.map(item => ({
                    label: item.category,
                    data: timestamps.map(t => parseFloat(item[col.value]?.[timestampPrefix + t]))
                }))
            };

            return new ChartDataset({
                id: "ccm-" + data.map(d => d.category).join(","),
                name: (col.districtLevel || districtLevelLabel) + " - " + col.text,
                type: ["LineChart", "BarChart"],
                color: "rainbow",
                source: "Dashboard",
                scaleLabels: ["", "Jahre"],
                data: chartData
            });
        });

    return graphs;
}
