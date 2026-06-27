import {generateSimpleGetters} from "../../../src/shared/js/utils/generators.js";
import stateVpiDashboard from "./stateVpiDashboard.js";

const getters = {
    /**
     * Returns an object of simple getters for a state object, where
     * simple means that they will just return an entry for any key.
     * For example, given a state object {key: value}, an object
     * {key: state => state[key]} will be returned.
     * This is useful to avoid writing basic operations.
     */
    ...generateSimpleGetters(stateVpiDashboard),

    /**
     * Gets data about unique visitors per year (sum per year and daily average), generated from OGC-API data.
     * @param {Object} state the stores state object
     * @returns {Array} array of yearly data average, rounded
     */
    getVisitorsPerYear (state) {
        return state.visitorsPerYear;
    },

    /**
     * Gets Array containing all OGC-API locations.
     * @param {Object} state of this component
     * @returns {Array} Array of all locations
     */
    getAllLocationsArray (state) {
        return state.allLocationsArray;
    },
    /**
     * Gets the title of the range slider
     * @param {Object} state of this component
     * @returns {String} title of the slider
     */
    getSliderTitle (state) {
        const rangeFrom = state.sliderData.find(item => item.id === state.sliderSelectedValues[0])?.name,
            rangeTo = state.sliderData.find(item => item.id === state.sliderSelectedValues[1])?.name;

        return `${rangeFrom} - ${rangeTo}`;
    },
    /**
     * Gets the options for the bar chart
     * @param {Object} state of this component
     * @returns {Object} options object for the bar chart
     */
    barChartOptions (state) {
        return {
            scales: {
                x: {
                    min: state.sliderSelectedValues[0],
                    max: state.sliderSelectedValues[1],
                    stacked: true
                },
                y: {
                    stacked: true,
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString(state.currentLocale);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    align: "start"
                }
            },
            maintainAspectRatio: false
        };
    },
    /**
     * Gets the options for the line chart
     * @param {Object} state of this component
     * @returns {Object} options object for the line chart
     */
    lineChartOptions (state) {
        return {
            scales: {
                x: {
                    min: state.sliderSelectedValues[0],
                    max: state.sliderSelectedValues[1]
                }
            },
            plugins: {
                legend: {
                    display: true,
                    align: "start"
                }
            },
            maintainAspectRatio: false,
            animation: false
        };
    },
    /**
     * Gets only unique geoIds with names
     * @param {Object} state of this component
     * @returns {Array} array of unique geoIds with names
     */
    uniqueGeoIdsWithNames (state) {
        return [...new Set(state.allLocationsArray)].map(geoId => {
            const name = state.geoIdToNameMapping[geoId] || geoId;

            return {
                geoId,
                name
            };
        });
    }
};

export default getters;
