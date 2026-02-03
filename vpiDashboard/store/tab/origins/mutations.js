import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import aggregateData from "../../../utils/aggregateData.js";

dayjs.extend(weekOfYear);

const mutations = {
    /**
     * Get all origins data
     * @param {Object} state of this component
     * @param {Array} payload Array of all origins from the selected location
     * @returns {void}
     */
    setAllOriginsData (state, payload) {
        const aggregated = aggregateData(
            payload.features,
            date => date.getFullYear(),
            date => date.getMonth(),
            () => ({sum: 0, count: 0}),
            "besuchertyp"
        );

        Object.keys(aggregated).forEach(year => {
            Object.keys(aggregated[year]).forEach(month => {
                Object.keys(aggregated[year][month]).forEach(visitorType => {
                    const item = aggregated[year][month][visitorType],
                        monthInt = parseInt(month, 10) + 1;

                    state.allOriginsData.push({
                        date: `${year}-${monthInt.toString().padStart(2, "0")}`,
                        visitorType,
                        sum: item.sum,
                        count: item.count
                    });
                });
            });
        });
    },
    /**
     * Get all origins monthly data
     * @param {Object} state of this component
     * @returns {void}
     */
    setAllOriginsMonthlyData (state) {
        const dataset = {},
            datasetLine = {},
            tempDataset = {},
            tempDatasetGroups = {},
            xLabels = i18next.t("additional:modules.tools.vpidashboard.time.months", {returnObjects: true}),
            originsByYear = {};

        state.allOriginsData.forEach(entry => {
            // get the origins by year and month
            const [yearOfEntry, monthOfEntry] = entry.date.split("-"),
                originsLabel = entry.visitorType;

            if (!tempDataset[yearOfEntry]) {
                tempDataset[yearOfEntry] = {};
                tempDatasetGroups[yearOfEntry] = [];
            }

            // set default values
            if (!tempDataset[yearOfEntry][originsLabel]) {
                tempDataset[yearOfEntry][originsLabel] = [
                    {index: "01", sum: "n/a", label: originsLabel},
                    {index: "02", sum: "n/a", label: originsLabel},
                    {index: "03", sum: "n/a", label: originsLabel},
                    {index: "04", sum: "n/a", label: originsLabel},
                    {index: "05", sum: "n/a", label: originsLabel},
                    {index: "06", sum: "n/a", label: originsLabel},
                    {index: "07", sum: "n/a", label: originsLabel},
                    {index: "08", sum: "n/a", label: originsLabel},
                    {index: "09", sum: "n/a", label: originsLabel},
                    {index: "10", sum: "n/a", label: originsLabel},
                    {index: "11", sum: "n/a", label: originsLabel},
                    {index: "12", sum: "n/a", label: originsLabel}
                ];
            }
            // add each dataset to the correct object
            tempDataset[yearOfEntry][originsLabel].find(x=> x.index === monthOfEntry).sum = Math.ceil(entry.sum / 100) * 100;

            if (!tempDatasetGroups[yearOfEntry][originsLabel]) {
                tempDatasetGroups[yearOfEntry][originsLabel] = 0;
            }

            // sum the single month's datasets for each origin (to be used in the pie chart later)
            tempDatasetGroups[yearOfEntry][originsLabel] += Math.ceil(entry.sum / 100) * 100;
        });

        // now sort them for the correct oder (given by 'labels') and convert them to data objects for chartJS
        Object.keys(tempDataset).forEach(function (year) {

            if (!dataset[year]) {
                dataset[year] = [];
                datasetLine[year] = [];
                originsByYear[year] = [];
            }

            const yearSumForAllOrigins = Object.values(tempDatasetGroups[year]).reduce((a, b) => a + b),
                yearGroupObj = {
                    data: [],
                    hoverOffset: 4,
                    backgroundColor: []
                };

            state.originsChartLabels.forEach(labelObj => {
                const dataObj = {
                        data: [],
                        hoverOffset: 4,
                        label: i18next.t(labelObj.text),
                        backgroundColor: labelObj.color
                    },
                    dataObjLine = {
                        data: [],
                        label: i18next.t(labelObj.text),
                        fill: false,
                        tension: 0.1,
                        borderColor: labelObj.color
                    };

                tempDataset[year][labelObj.attrLookup].forEach(originsPerMonth => {
                    dataObj.data.push(originsPerMonth.sum);
                    dataObjLine.data.push(originsPerMonth.sum);
                });

                // Round and also show trailing zeros, e.g. 18 becomes 18,0
                yearGroupObj.data.push((Math.round(tempDatasetGroups[year][labelObj] * 100 / yearSumForAllOrigins * 10) / 10).toFixed(1));
                yearGroupObj.backgroundColor.push(labelObj.color);

                dataset[year].push(dataObj);
                datasetLine[year].push(dataObjLine);
            });

            originsByYear[year].push(yearGroupObj);
        });

        state.allOriginsMonthlyData = dataset;
        state.allOriginsMonthlyDataLine = datasetLine;
        state.originsMonthlyXLabels = xLabels;
    },
    /**
     * Sets the origins cities data
     * @param {Object} state the store's state object
     * @param {Object} payload data from tgl_besucher_nach_landkr endpoint
     * @returns {void}
     */
    setAverageVisitorsPerWeek (state, payload) {
        const aggregatedData = aggregateData(
                payload.features,
                date => dayjs(date).year(),
                date => `${dayjs(date).year()}-W${dayjs(date).week()}`,
                () => ({sum: 0, weeksInYear: 0}),
                "besuchertyp"),
            result = {};

        Object.keys(aggregatedData).forEach(year => {
            Object.keys(aggregatedData[year]).forEach(week => {
                Object.keys(aggregatedData[year][week]).forEach(category => {
                    if (!result[category]) {
                        result[category] = {};
                    }
                    if (!result[category][year]) {
                        result[category][year] = {sum: 0, weeksInYear: 0};
                    }
                    result[category][year].sum += aggregatedData[year][week][category].sum;
                    result[category][year].weeksInYear++;
                });
            });
        });

        Object.keys(result).forEach(category => {
            Object.keys(result[category]).forEach(year => {
                const {sum, weeksInYear} = result[category][year];

                if (weeksInYear > 0) {
                    result[category][year] = Math.round(sum / weeksInYear);
                }
                else {
                    result[category][year] = result[category][year] || 0;
                }
            });
        });

        state.averageVisitorsPerWeek = result;
    }
};

export default mutations;
