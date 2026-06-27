import {generateSimpleMutations} from "../../../src/shared/js/utils/generators.js";
import stateVpiDashboard from "./stateVpiDashboard.js";
import tabOriginsMutations from "./tab/origins/mutations.js";
import tabAgeGroupsMutations from "./tab/age-groups/mutations.js";
import tabGendersMutations from "./tab/gender/mutations.js";
import {changeDateFormat} from "../utils/dateHelpers.js";
import aggregateChartData from "../utils/aggregateChartData.js";
import aggregateData from "../utils/aggregateData.js";

const mutations = {
    ...generateSimpleMutations(stateVpiDashboard),

    ...tabOriginsMutations,
    ...tabAgeGroupsMutations,
    ...tabGendersMutations,

    /**
     * Adds a new entry to the year list in the state.
     * @param {Object} state - The Vuex state object for the VpiDashboard module.
     * @param {any} entry - The entry to be added to the year list.
     * @returns {void}
    */
    addYearListEntry (state, entry) {
        state.yearList.push(entry);
    },
    /**
     * Sets the rounded monthly data for unique visitors to the state, selected from OGC-API data.
     * @param {Object} state the store's state object
     * @param {Object} payload data from OGC-API endpoint
     * @returns {void}
     */
    setSumVisitorsPerMonth (state, payload) {
        const
            data = payload.features,
            aggregated = aggregateData(
                data,
                date => date.getFullYear(),
                date => date.getMonth(),
                () => ({sum: 0, count: 0})
            ),
            result = {};

        Object.keys(aggregated).forEach(year => {
            result[year] = Array(12).fill(null).map((_, month) => {
                const monthData = aggregated[year][month];

                if (monthData) {
                    const avg = Math.ceil(monthData.sum / monthData.count / 100) * 100,
                        sum = Math.ceil(monthData.sum / 100) * 100;

                    return {index: month.toString(), avg, sum};
                }
                return {index: month.toString(), avg: "n/a", sum: "n/a"};

            });
        });

        state.sumVisitorsPerMonth = result;

    },
    /**
     * Sets the rounded daily data for unique visitors to the state, selected from OGC-API data.
     * @param {Object} state the store's state object
     * @param {Object} payload data from OGC-API endpoint
     * @returns {void}
     */
    setAverageVisitorsPerDay (state, payload) {
        const data = payload.features,
            aggregated = {},
            result = {};

        data.forEach(feature => {
            const item = feature.properties,
                date = new Date(item.datum),
                day = date.getDay() === 0 ? 6 : date.getDay() - 1,
                month = date.getMonth(),
                year = date.getFullYear();

            if (!aggregated[year]) {
                aggregated[year] = [];
            }

            if (!aggregated[year][month]) {
                aggregated[year][month] = [];
            }

            if (!aggregated[year][month][day]) {
                aggregated[year][month][day] = {
                    sum: 0,
                    totalNumberOfWeekdaysInMonthsOverYears: 0
                };
            }

            aggregated[year][month][day].sum += item.besucher;
            aggregated[year][month][day].totalNumberOfWeekdaysInMonthsOverYears++;
        });

        // Ceil up to 100, e.g. 18318 becomes 18400
        Object.keys(aggregated).forEach(year => {
            result[year] = [];
            for (let i = 0; i < 12; i++) {
                result[year][i] = [
                    {index: "0", avg: "n/a"},
                    {index: "1", avg: "n/a"},
                    {index: "2", avg: "n/a"},
                    {index: "3", avg: "n/a"},
                    {index: "4", avg: "n/a"},
                    {index: "5", avg: "n/a"},
                    {index: "6", avg: "n/a"}
                ];
            }

            Object.keys(aggregated[year]).forEach(month => {
                Object.keys(aggregated[year][month]).forEach(key => {
                    result[year][month].find(x => x.index === key).avg = Math.ceil(aggregated[year][month][key].sum / 100 / aggregated[year][month][key].totalNumberOfWeekdaysInMonthsOverYears) * 100;
                });
            });
        });

        state.averageVisitorsPerDay = result;
    },
    /**
     * Sets the rounded yearly data for unique visitors to the state, selected from OGC-API data.
     * @param {Object} state the store's state object
     * @param {Object} payload data from OGC-API endpoint
     * @returns {void}
     */
    setVisitorsPerYear (state, payload) {
        const
            data = payload.features,
            aggregated = aggregateData(
                data,
                date => date.getFullYear(),
                date => date.getFullYear(),
                () => ({sum: 0, count: 0})
            ),
            result = [];

        Object.keys(aggregated).forEach(year => {
            result.push({
                date__year: year,
                avg: Math.ceil(aggregated[year][year].sum / 100) * 100
            });
        });

        state.visitorsPerYear = result;
    },
    /**
     * Generates Bar Chart Daily Data and saves it to state.
     * @param {Object} state the store's state object
     * @param {Object} dates the year and the month's index, the data shall be generated for
     * @returns {void}
     */
    setBarChartDailyData (state, dates = {year: 2024, month: 0}) {
        const daily = state.averageVisitorsPerDay[dates.year]?.[dates.month] || [],
            labels = [],
            day_data = [],
            backgroundColors = [],
            translatedLabelList = i18next.t("additional:modules.tools.vpidashboard.time.days", {returnObjects: true});

        daily.forEach((element, index) => {
            let label_text = translatedLabelList[index];

            if (element.avg === "n/a") {
                label_text = [label_text, i18next.t("additional:modules.tools.vpidashboard.unique.noData")];
            }

            backgroundColors.push(index >= 6 ? "#BED1EC" : "#002680");
            labels.push(label_text);
            day_data.push(element.avg);
        });

        state.barChartDailyData = [{
            label: i18next.t("additional:modules.tools.vpidashboard.unique.dailyOverview", {
                year: dates.year,
                month: i18next.t("additional:modules.tools.vpidashboard.time.months", {returnObjects: true})[dates.month]
            }),
            data: day_data,
            hoverOffset: 4,
            backgroundColor: backgroundColors
        }];
        state.dailyOverviewXLabels = labels;
    },

    /**
     * Generates Bar Chart Daily Data and saves it to state.
     * @param {Object} state the store's state object
     * @param {Object} dates the year and the month's index, the data shall be generated for
     * @returns {void}
     */
    setLineChartDailyData (state, dates = {year: 2024, month: 0}) {
        const daily = state.averageVisitorsPerDay[dates.year]?.[dates.month] || [],
            day_data = [];

        daily.forEach((element) => {
            day_data.push(element.avg);
        });

        state.lineChartDailyData = [{
            label: i18next.t("additional:modules.tools.vpidashboard.unique.dailyOverview", {
                year: dates.year,
                month: i18next.t("additional:modules.tools.vpidashboard.time.months", {returnObjects: true})[dates.month]
            }),
            data: day_data,
            fill: false,
            borderColor: "#002680",
            tension: 0.1
        }];
    },

    /**
     * Generates Bar Chart Monthly Data and saves it to state.
     * @param {Object} state the store's state object
     * @param {Number} year the year, the data shall be generated for
     * @returns {void}
     */
    setBarChartMonthlyData (state, year = 2024) {
        const monthly = state.sumVisitorsPerMonth[year] || [],
            labels = [],
            month_data = [],
            translatedLabelList = i18next.t("additional:modules.tools.vpidashboard.time.months", {returnObjects: true});

        monthly.forEach((element) => {
            labels.push(translatedLabelList[element.index]);
            month_data.push(element.sum);
        });

        state.barChartMonthlyData = [{
            label: i18next.t("additional:modules.tools.vpidashboard.unique.monthlyOverview", {year: year}),
            data: month_data,
            hoverOffset: 4,
            backgroundColor: "#002680"
        }];

        state.monthlyXLabels = labels;
    },
    /**
     * Generates Line Chart Monthly Data and saves it to state.
     * @param {Object} state the store's state object
     * @param {Number} year the year, the data shall be generated for
     * @returns {void}
     */
    setLineChartMonthlyData (state, year = 2024) {
        const monthly = state.sumVisitorsPerMonth[year] || [],
            month_data = [];

        monthly.forEach((element) => {
            month_data.push(element.sum);
        });

        state.lineChartMonthlyData = [{
            label: i18next.t("additional:modules.tools.vpidashboard.unique.monthlyOverview", {year: year}),
            data: month_data,
            fill: false,
            borderColor: "#002680",
            tension: 0.1
        }];
    },
    /**
     * Generates Line Chart Data and saves it to state.
     * @param {Object} state the store's state object
     * @param {Object} payload data from OGC-API endpoint
     * @returns {void}
     */
    setLineChartData (state, payload) {
        const
            data = payload.features,
            aggregated = aggregateChartData(data, changeDateFormat);

        // Line chart configuration
        state.lineChartData = {
            labels: Object.keys(aggregated),
            datasets: [{
                label: i18next.t("additional:modules.tools.vpidashboard.unique.uniqueVisitors"),
                data: Object.values(aggregated),
                fill: false,
                borderColor: "#002680",
                tension: 0.1
            }]
        };
    },
    /**
     * Sets showLoader value in state.
     * Set it true to show loader and set it false to hide loader.
     * @param {Object} state the store's state object
     * @param {Boolean} isLoaderShown variable to set as showLoader
     * @returns {void}
     */
    setLoader (state, isLoaderShown) {
        state.showLoader = isLoaderShown;
    },
    /**
     * Sets the select interaction in the state.
     * This is used to define the interaction for selecting features on the map.
     * @param {Object} state - The Vuex state object for the VpiDashboard module.
     * @param {Object} value - The select interaction object to be set in the state.
     * @returns {void}
     */
    setSelectInteraction (state, value) {
        state.selectInteraction = value;
    }
};

export default mutations;
