import aggregateData from "../../../utils/aggregateData.js";

const mutations = {
    /**
     * Sets the genders (grouped by "gender" and by date), selected from OGC-API data.
     * @param {Object} state the store's state object
     * @param {Object} payload data from OGC-API endpoint
     * @returns {void}
     */
    setGendersData (state, payload) {
        const aggregated = aggregateData(
            payload.features,
            date => date.getFullYear(),
            date => date.getMonth(),
            () => ({sum: 0, count: 0}),
            "geschlecht"
        );

        Object.keys(aggregated).forEach(year => {
            Object.keys(aggregated[year]).forEach(month => {
                Object.keys(aggregated[year][month]).forEach(gender => {
                    const item = aggregated[year][month][gender],
                        monthInt = parseInt(month, 10) + 1;

                    state.gendersData.push({
                        date: `${year}-${monthInt.toString().padStart(2, "0")}`,
                        gender,
                        sum: item.sum,
                        count: item.count
                    });
                });
            });
        });
    },
    /**
     * Sets the genders daily (grouped by "gender" and by year & month), selected from OGC-API data
     * @param {Object} state the store's state object
     * @returns {void}
     */
    setGendersMonthlyData (state) {
        const dataset = {},
            datasetLine = {},
            tempDataset = {},
            tempDatasetGroups = {},
            xLabels = i18next.t("additional:modules.tools.vpidashboard.time.months", {returnObjects: true}),
            gendersByYear = {};


        state.gendersData.forEach(entry => {
            // get the genders by year and month
            const [yearOfEntry, monthOfEntry] = entry.date.split("-"),
                genderLabel = entry.gender;

            if (!tempDataset[yearOfEntry]) {
                tempDataset[yearOfEntry] = {};
                tempDatasetGroups[yearOfEntry] = [];
            }

            // set default values
            if (!tempDataset[yearOfEntry][genderLabel]) {
                tempDataset[yearOfEntry][genderLabel] = [
                    {index: "01", sum: "n/a", label: genderLabel},
                    {index: "02", sum: "n/a", label: genderLabel},
                    {index: "03", sum: "n/a", label: genderLabel},
                    {index: "04", sum: "n/a", label: genderLabel},
                    {index: "05", sum: "n/a", label: genderLabel},
                    {index: "06", sum: "n/a", label: genderLabel},
                    {index: "07", sum: "n/a", label: genderLabel},
                    {index: "08", sum: "n/a", label: genderLabel},
                    {index: "09", sum: "n/a", label: genderLabel},
                    {index: "10", sum: "n/a", label: genderLabel},
                    {index: "11", sum: "n/a", label: genderLabel},
                    {index: "12", sum: "n/a", label: genderLabel}
                ];
            }
            // add each dataset to the correct object
            tempDataset[yearOfEntry][genderLabel].find(x=> x.index === monthOfEntry).sum = Math.ceil(entry.sum / 100) * 100;

            if (!tempDatasetGroups[yearOfEntry][genderLabel]) {
                tempDatasetGroups[yearOfEntry][genderLabel] = 0;
            }

            // sum the single month's datasets for both genders (to be used in the pie chart later)
            tempDatasetGroups[yearOfEntry][genderLabel] += Math.ceil(entry.sum / 100) * 100;
        }
        );

        Object.keys(tempDataset).forEach(function (year) {

            if (!dataset[year]) {
                dataset[year] = [];
                datasetLine[year] = [];
                gendersByYear[year] = [];
            }

            const yearSumForGenders = Object.values(tempDatasetGroups[year]).reduce((a, b) => a + b),
                yearGroupObj = {
                    data: [],
                    hoverOffset: 4,
                    backgroundColor: []
                };

            state.gendersChartLabels.forEach(labelObj => {
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

                tempDataset[year][labelObj.attrLookup].forEach(gendersPerMonth => {
                    dataObj.data.push(gendersPerMonth.sum);
                    dataObjLine.data.push(gendersPerMonth.sum);
                });

                // Round and also show trailing zeros, e.g. 18 becomes 18,0
                yearGroupObj.data.push((Math.round(tempDatasetGroups[year][labelObj.attrLookup] * 100 / yearSumForGenders * 10) / 10).toFixed(1));
                yearGroupObj.backgroundColor.push(labelObj.color);

                dataset[year].push(dataObj);
                datasetLine[year].push(dataObjLine);
            });

            gendersByYear[year].push(yearGroupObj);
        });

        state.gendersMonthlyData = dataset;
        state.gendersMonthlyDataLine = datasetLine;
        state.gendersMonthlyXLabels = xLabels;
        state.gendersYearlyData = gendersByYear;
    }
};

export default mutations;
